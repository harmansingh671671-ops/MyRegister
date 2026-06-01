// App.js - Main application entry point with error handling
import { initStorage, getProfile, calculateIntegrityHealth, saveProfile, getYetToCreditDiamonds } from './modules/storage.js';
import { renderOnboarding } from './modules/onboarding.js';
import { renderPath } from './modules/path.js';
import { renderAnalytics } from './modules/analytics.js';
import { renderShop, syncAppTheme } from './modules/shop.js';
import { renderSettings } from './modules/settings.js';
import { requestNotificationPermission, showToast } from './modules/notifications.js';
import { calculateMilitaryRank, openRanksModal, RANKS } from './modules/ranks.js';
import { renderSocial } from './modules/social_v2.js'; // inder branch: Social Tab
import { renderLearn } from './modules/learn.js';   // inder branch: Learn Tab

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Initialize local database
    initStorage();
    calculateIntegrityHealth();
    calculateMilitaryRank();

    // 2. Sync active theme on boot
    const bootProfile = getProfile();
    syncAppTheme(bootProfile.equippedTheme);

    // 3. Request notification permission on first interaction
    let notificationRequested = false;
    document.body.addEventListener('click', () => {
      if (!notificationRequested) {
        notificationRequested = true;
        requestNotificationPermission().catch(e => console.warn('Notification request error:', e));
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
        console.error('Rank modal error:', err);
      }
    });

    // 5. Setup router
    const views = {
      onboarding: document.getElementById('view-onboarding'),
      path: document.getElementById('view-path'),
      stats: document.getElementById('view-stats'),
      shop: document.getElementById('view-shop'),
      settings: document.getElementById('view-settings'),
      social: document.getElementById('view-social'),   // inder branch: Social Tab
      learn:  document.getElementById('view-learn')      // inder branch: Learn Tab
    };

    const navLinks = document.querySelectorAll('.nav-link');

    function navigateTo(viewName) {
      try {
        const profile = getProfile();
        
        // Redirect to onboarding if not completed
        if (!profile.hasCompletedOnboarding) {
          viewName = 'onboarding';
        }

        // Hide all views
        Object.keys(views).forEach(key => {
          if (views[key]) {
            views[key].classList.add('hidden');
          }
        });

        // Show selected view
        if (views[viewName]) {
          views[viewName].classList.remove('hidden');
        } else {
          console.warn('Unknown view:', viewName);
          return;
        }

        // Update nav active state
        navLinks.forEach(link => {
          if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        // Toggle bottom nav visibility
        const bottomNav = document.querySelector('.mobile-bottom-nav');
        if (viewName === 'onboarding') {
          if (bottomNav) bottomNav.classList.add('hidden');
        } else {
          if (bottomNav) bottomNav.classList.remove('hidden');
        }

        // Render the view
        switch (viewName) {
          case 'onboarding':
            renderOnboarding(views.onboarding, () => {
              navigateTo('path');
            });
            break;
          case 'path':
            renderPath(views.path);
            break;
          case 'stats':
            renderAnalytics(views.stats);
            break;
          case 'shop':
            renderShop(views.shop);
            break;
          case 'settings':
            renderSettings(views.settings);
            break;
          case 'social': // inder branch: Social Tab
            renderSocial(views.social);
            break;
          case 'learn': // inder branch: Learn Tab
            renderLearn(views.learn);
            break;
        }

        sessionStorage.setItem('tempo_current_view', viewName);
      } catch (e) {
        console.error('Navigation error:', e);
        showToast('Navigation error occurred', 'error');
      }
    }

    // Bind navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = link.getAttribute('data-view');
        navigateTo(viewName);
      });
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
        console.error('Header update error:', e);
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
        const badgeEmoji = rankObj ? rankObj.badge : '🍃';

        levels.forEach(el => el.textContent = activeRankName);

        const xpPills = document.querySelectorAll('.text-xp');
        xpPills.forEach(pill => {
          const iconEl = pill.querySelector('.stat-icon') || pill.querySelector('span:first-child');
          if (iconEl) {
            iconEl.textContent = badgeEmoji;
          }
        });
      } catch (e) {
        console.error('Header pill update error:', e);
      }
    }

    // Update simulator time
    function updateSimulatorTime() {
      try {
        const timeEl = document.getElementById('simulator-time');
        if (timeEl) {
          const now = new Date();
          timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
      } catch (e) {
        console.error('Time update error:', e);
      }
    }
    
    updateSimulatorTime();
    setInterval(updateSimulatorTime, 1000);

    // Navigate to last viewed tab or default
    const profile = getProfile();
    const currentView = profile.hasCompletedOnboarding
      ? (sessionStorage.getItem('tempo_current_view') || 'path')
      : 'onboarding';
    
    navigateTo(currentView);
    updateHeaderPills();
  } catch (e) {
    console.error('Critical initialization error:', e);
    showToast('Failed to initialize app. Please refresh.', 'error');
  }
});
