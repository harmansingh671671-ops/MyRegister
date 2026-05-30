// App.js
import { initStorage, getProfile, calculateIntegrityHealth } from './modules/storage.js';
import { renderOnboarding } from './modules/onboarding.js';
import { renderPath } from './modules/path.js';
import { renderAnalytics } from './modules/analytics.js';
import { renderShop, syncAppTheme } from './modules/shop.js';
import { renderSettings } from './modules/settings.js';
import { requestNotificationPermission } from './modules/notifications.js';
import { calculateMilitaryRank, openRanksModal, RANKS } from './modules/ranks.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize local database tables
  initStorage();
  calculateIntegrityHealth();
  calculateMilitaryRank();

  // Sync active visual theme on boot
  const bootProfile = getProfile();
  syncAppTheme(bootProfile.equippedTheme);

  // 2. Gentle notification request on click
  document.body.addEventListener('click', () => {
    requestNotificationPermission();
  }, { once: true });

  // Open ranks modal on clicking level/rank pill
  document.body.addEventListener('click', (e) => {
    const xpPill = e.target.closest('.text-xp');
    if (xpPill) {
      e.preventDefault();
      openRanksModal();
    }
  });

  // 3. Router View Configuration
  const views = {
    onboarding: document.getElementById('view-onboarding'),
    path: document.getElementById('view-path'),
    stats: document.getElementById('view-stats'),
    shop: document.getElementById('view-shop'),
    settings: document.getElementById('view-settings')
  };

  const navLinks = document.querySelectorAll('.nav-link');

  function navigateTo(viewName) {
    const profile = getProfile();
    // Redirect to onboarding if not completed
    if (!profile.hasCompletedOnboarding) {
      viewName = 'onboarding';
    }

    // Hide all view screens
    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].classList.add('hidden');
      }
    });

    // Show selected view
    if (views[viewName]) {
      views[viewName].classList.remove('hidden');
    }

    // Toggle active link highlights
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle bottom nav bar visibility
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (viewName === 'onboarding') {
      if (bottomNav) bottomNav.classList.add('hidden');
    } else {
      if (bottomNav) bottomNav.classList.remove('hidden');
    }

    // Render corresponding screens
    if (viewName === 'onboarding') {
      renderOnboarding(views.onboarding, () => {
        navigateTo('path');
      });
    } else if (viewName === 'path') {
      renderPath(views.path);
    } else if (viewName === 'stats') {
      renderAnalytics(views.stats);
    } else if (viewName === 'shop') {
      renderShop(views.shop);
    } else if (viewName === 'settings') {
      renderSettings(views.settings);
    }

    sessionStorage.setItem('tempo_current_view', viewName);
  }

  // Event bindings for standard links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewName = link.getAttribute('data-view');
      navigateTo(viewName);
    });
  });

  // Global navigations
  window.addEventListener('tempo_navigate', (e) => {
    navigateTo(e.detail);
  });

  // Sync pills when profile changes
  window.addEventListener('tempo_profile_changed', () => {
    updateHeaderPills();
  });

  function updateHeaderPills() {
    const profile = getProfile();
    const streaks = document.querySelectorAll('.header-streak-val');
    const diamonds = document.querySelectorAll('.header-diamond-val');
    const levels = document.querySelectorAll('.header-level-val');

    streaks.forEach(el => el.textContent = profile.streak);
    diamonds.forEach(el => el.textContent = profile.diamonds);

    const activeRankName = profile.militaryRank || "Civilian";
    const rankObj = RANKS.find(r => r.name === activeRankName) || RANKS[0];
    const badgeEmoji = rankObj ? rankObj.badge : "🍃";

    levels.forEach(el => el.textContent = activeRankName);

    const xpPills = document.querySelectorAll('.text-xp');
    xpPills.forEach(pill => {
      const iconEl = pill.querySelector('.stat-icon') || pill.querySelector('span:first-child');
      if (iconEl) {
        iconEl.textContent = badgeEmoji;
      }
    });
  }

  // Update simulator time bar
  function updateSimulatorTime() {
    const timeEl = document.getElementById('simulator-time');
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }
  updateSimulatorTime();
  setInterval(updateSimulatorTime, 1000);

  // Load last session tab or default to path
  const profile = getProfile();
  const currentView = profile.hasCompletedOnboarding
    ? (sessionStorage.getItem('tempo_current_view') || 'path')
    : 'onboarding';
  navigateTo(currentView);
  updateHeaderPills();
});
