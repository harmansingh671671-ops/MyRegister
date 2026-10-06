// App.js - Main application entry point with modern UI
import { initStorage, getProfile, calculateIntegrityHealth, saveProfile, getYetToCreditDiamonds, autoLockPastDays } from './modules/storage.js';
import { renderOnboarding } from './modules/onboarding.js';
import { renderPath } from './modules/path.js';
import { renderAnalytics } from './modules/analytics.js';
import { renderShop, syncAppTheme } from './modules/shop.js';
import { renderSettings } from './modules/settings.js';
import { requestNotificationPermission, showToast } from './modules/notifications.js';
import { calculateMilitaryRank, openRanksModal, RANKS } from './modules/ranks.js';
import { renderSocial } from './modules/social_v2.js';
import { renderLearn } from './modules/learn.js';
import { supabase } from './modules/supabase.js';
import { renderAuthScreen } from './modules/auth.js';
import { error, warn, info } from './modules/logger.js';
import { sanitizeHTML } from './modules/security.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Initialize local database
    initStorage();
    autoLockPastDays();
    calculateIntegrityHealth();
    calculateMilitaryRank();

    // 2. Sync active theme on boot
    const bootProfile = getProfile();
    syncAppTheme(bootProfile.equippedTheme);

    // Initialize UI Components
    initUIComponents();

    // 3. Request notification permission on first interaction
    let notificationRequested = false;
    document.body.addEventListener('click', () => {
      if (!notificationRequested) {
        notificationRequested = true;
        requestNotificationPermission().catch(e => warn('Notification request error:', e));
      }
    }, { once: true });

    // 4. Open ranks modal on clicking level pill
    document.body.addEventListener('click', (e) => {
      try {
        const xpPill = e.target.closest('.text-xp');
        if (xpPill) {
          e.preventDefault();
          openRanksModal();
        }
      } catch (err) {
        error('Rank modal error:', err);
      }
    });

    // 5. Setup router
    const views = {
      onboarding: document.getElementById('view-onboarding'),
      path: document.getElementById('view-path'),
      stats: document.getElementById('view-stats'),
      shop: document.getElementById('view-shop'),
      settings: document.getElementById('view-settings'),
      social: document.getElementById('view-social'),
      learn:  document.getElementById('view-learn'),
      auth:   document.getElementById('view-auth')
    };

    const menuItems = document.querySelectorAll('.menu-item');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    let currentSession = null;

    function navigateTo(viewName) {
      try {
        const profile = getProfile();
        
        // Redirect if auth/onboarding is missing
        if (!currentSession) {
          viewName = 'auth';
        } else if (!profile.hasCompletedOnboarding) {
          viewName = 'onboarding';
        }

        // Hide all views
        Object.keys(views).forEach(key => {
          if (views[key]) {
            views[key].classList.add('hidden');
            views[key].classList.remove('active');
          }
        });

        // Show selected view
        if (views[viewName]) {
          views[viewName].classList.remove('hidden');
          views[viewName].classList.add('active');
        } else {
          warn('Unknown view:', viewName);
          return;
        }

        // Update menu active state
        menuItems.forEach(item => {
          if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });

        // Close mobile sidebar on navigation
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
        }

        // Update header pills
        updateHeaderPills();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (e) {
        error('Navigation error:', e);
        showToast(sanitizeHTML('Navigation error occurred'), 'error');
      }
    }

    // Bind navigation from menu items
    menuItems.forEach(item => {
      const link = item.querySelector('.menu-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const viewName = item.getAttribute('data-view');
          navigateTo(viewName);
        });
      }
    });

    // Mobile menu toggle
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Sidebar toggle (collapse/expand)
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });

    // Global navigation event
    window.addEventListener('tempo_navigate', (e) => {
      if (e.detail) {
        navigateTo(e.detail);
      }
    });

    // Sync pills when profile or logs change
    const triggerUpdate = () => {
      try {
        updateHeaderPills();
      } catch (e) {
        error('Header update error:', e);
      }
    };
    window.addEventListener('tempo_profile_changed', triggerUpdate);
    window.addEventListener('tempo_logs_changed', triggerUpdate);

    function updateHeaderPills() {
      try {
        const profile = getProfile();
        const streaks = document.querySelectorAll('.header-streak-val');
        const diamonds = document.querySelectorAll('.header-diamond-val');
        const levels = document.querySelectorAll('.header-level-val');

        streaks.forEach(el => el.textContent = Math.max(0, profile.streak));
        
        // Render diamonds as x+y
        const yetToCredit = getYetToCreditDiamonds();
        diamonds.forEach(el => el.textContent = `${Math.max(0, profile.diamonds)}+${yetToCredit}`);

        const activeRankName = profile.militaryRank || 'Civilian';
        const rankObj = RANKS.find(r => r.name === activeRankName) || RANKS[0];
        const badgeEmoji = rankObj ? rankObj.badge : '\ud83c\udf43';

        levels.forEach(el => el.textContent = activeRankName);

        const xpPills = document.querySelectorAll('.text-xp');
        xpPills.forEach(pill => {
          const iconEl = pill.querySelector('.stat-icon') || pill.querySelector('span:first-child');
          if (iconEl) {
            iconEl.textContent = badgeEmoji;
          }
        });
      } catch (e) {
        error('Header pill update error:', e);
      }
    }

    // Initialize theme
    initTheme();

    // Initialize notifications
    initNotifications();

    // Initialize search
    initSearch();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Initialize session checking and auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentSession = session;
      const profile = getProfile();
      const defaultView = currentSession 
        ? (profile.hasCompletedOnboarding ? (sessionStorage.getItem('tempo_current_view') || 'path') : 'onboarding')
        : 'auth';
      navigateTo(defaultView);
      updateHeaderPills();
    });

    supabase.auth.onAuthStateChange((event, session) => {
      currentSession = session;
      const profile = getProfile();
      if (!session) {
        navigateTo('auth');
      } else {
        const currentView = views.auth && !views.auth.classList.contains('hidden')
          ? (profile.hasCompletedOnboarding ? (sessionStorage.getItem('tempo_current_view') || 'path') : 'onboarding')
          : null;
        if (currentView) navigateTo(currentView);
      }
    });

    // Update simulator time (removed - not needed in new UI)

    sessionStorage.setItem('tempo_current_view', 'path');

  } catch (e) {
    error('Critical initialization error:', e);
    showToast(sanitizeHTML('Failed to initialize app. Please refresh.'), 'error');
  }
});

// UI Components Initialization
function initUIComponents() {
  // Add smooth animations to all elements
  const elements = document.querySelectorAll('.card, .stat-card, .btn, .task-item');
  elements.forEach((el, index) => {
    el.classList.add('animate-fade-in-up');
    el.style.animationDelay = `${index * 0.1}s`;
  });
}

// Theme Management
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
      }
      
      showToast(sanitizeHTML(`Switched to ${newTheme} mode`), 'info');
    });
    
    // Update initial icon
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }
}

// Notification System
function initNotifications() {
  const notificationBtn = document.getElementById('notification-btn');
  const notificationBadge = document.querySelector('.notification-badge');
  
  if (notificationBtn && notificationBadge) {
    // Simulate notifications
    let notificationCount = 3;
    
    notificationBtn.addEventListener('click', () => {
      showToast(sanitizeHTML('Notifications center coming soon!'), 'info');
    });
  }
}

// Search Functionality
function initSearch() {
  const searchInput = document.getElementById('search-input');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      // Implement search functionality
      info('Search query:', query);
    });
    
    // Keyboard shortcut for search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        e.target.blur();
      }
    });
  }
}

// Keyboard Shortcuts
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) {
        const closeBtn = activeModal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.click();
        }
      }
    }
  });
}


// Export for use in other modules
window.navigateTo = navigateTo;
