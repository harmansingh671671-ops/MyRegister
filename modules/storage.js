// Modules/storage.js

const PROFILE_KEY = 'tempo_user_profile';
const DAY_LOGS_KEY = 'tempo_day_logs';
const REASONS_KEY = 'tempo_custom_reasons';

const DEFAULT_MISS_REASONS = [
  "🔋 Low Energy / Fatigue",
  "📱 Distracted (Social/Games)",
  "⏳ Task took longer than planned",
  "💼 Meeting / Interruption",
  "⚠️ Urgent Emergency",
  "💤 Overslept / Late start"
];

const DEFAULT_PROFILE = {
  diamonds: 5,
  streak: 0,
  lastPlanDate: '',
  lastReviewDate: '',
  streakFreezeActive: false,
  unlockedBadges: [],
  equippedBadge: null,
  integrityScore: 100,
  milestonesClaimed: [], // e.g. ["streak_7", "streak_15", "streak_30"]
  hasCompletedOnboarding: false,
  name: '',
  dob: '',
  goals: [],
  createdDate: '',
  weekNames: {},
  // Gamification & Customization
  xp: 0,
  level: 1,
  leagueTier: 'Bronze', // Bronze, Silver, Gold, Diamond
  highestStreak: 0,
  maxDailyXP: 0,
  unlockedThemes: ['default'],
  equippedTheme: 'default',
  unlockedMascots: ['owl'],
  equippedMascot: 'owl',
  unlockedOutfits: ['none'],
  equippedOutfit: 'none',
  unlockedSounds: ['default'],
  equippedSound: 'default',
  weeklyLeaderboard: [],
  lastLeagueReset: '',
  violationLog: []
};

export function initStorage() {
  if (!localStorage.getItem(PROFILE_KEY)) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
  }
  if (!localStorage.getItem(DAY_LOGS_KEY)) {
    localStorage.setItem(DAY_LOGS_KEY, JSON.stringify({}));
  }
  if (!localStorage.getItem(REASONS_KEY)) {
    localStorage.setItem(REASONS_KEY, JSON.stringify(DEFAULT_MISS_REASONS));
  }
}

export function getProfile() {
  initStorage();
  try {
    const prof = JSON.parse(localStorage.getItem(PROFILE_KEY));
    // Graceful migration for missing properties
    let modified = false;
    for (const key in DEFAULT_PROFILE) {
      if (prof[key] === undefined) {
        prof[key] = DEFAULT_PROFILE[key];
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
    }
    return prof;
  } catch (e) {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  // Dispatch custom event to update UI components when profile changes
  window.dispatchEvent(new CustomEvent('tempo_profile_changed', { detail: profile }));
}

export function getCustomReasons() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(REASONS_KEY));
  } catch (e) {
    return [...DEFAULT_MISS_REASONS];
  }
}

export function saveCustomReasons(reasons) {
  localStorage.setItem(REASONS_KEY, JSON.stringify(reasons));
}

export function addCustomReason(reason) {
  const reasons = getCustomReasons();
  const trimmed = reason.trim();
  if (trimmed && !reasons.includes(trimmed)) {
    reasons.push(trimmed);
    saveCustomReasons(reasons);
    return true;
  }
  return false;
}

export function removeCustomReason(reason) {
  let reasons = getCustomReasons();
  reasons = reasons.filter(r => r !== reason);
  saveCustomReasons(reasons);
}

export function getDay(dateStr) {
  initStorage();
  try {
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
    return logs[dateStr] || {
      date: dateStr,
      blocks: [],
      isCommitted: false,
      isReviewed: false
    };
  } catch (e) {
    return {
      date: dateStr,
      blocks: [],
      isCommitted: false,
      isReviewed: false
    };
  }
}

export function saveDay(dateStr, dayLog) {
  initStorage();
  try {
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
    logs[dateStr] = dayLog;
    localStorage.setItem(DAY_LOGS_KEY, JSON.stringify(logs));
    
    // Recalculate integrity score based on last 24 entries
    calculateIntegrityHealth();

    window.dispatchEvent(new CustomEvent('tempo_logs_changed', { detail: { date: dateStr, log: dayLog } }));
  } catch (e) {
    console.error('Error saving day log:', e);
  }
}

export function calculateIntegrityHealth() {
  initStorage();
  try {
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
    const entries = [];
    
    for (const date in logs) {
      if (logs[date] && logs[date].blocks) {
        logs[date].blocks.forEach(block => {
          if (block.status === 'completed' || block.status === 'missed') {
            entries.push({
              status: block.status,
              loggedAt: block.loggedAt || `${date}T00:00:00.000Z`
            });
          }
        });
      }
    }

    // Default to 100 if no entries
    let score = 100;
    if (entries.length > 0) {
      // Sort descending by logged time (newest first)
      entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
      const last24 = entries.slice(0, 24);
      const completedCount = last24.filter(e => e.status === 'completed').length;
      score = Math.round((completedCount / last24.length) * 100);
    }

    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {
      diamonds: 5,
      streak: 0,
      lastPlanDate: '',
      lastReviewDate: '',
      streakFreezeActive: false,
      unlockedBadges: [],
      equippedBadge: null,
      integrityScore: 100,
      milestonesClaimed: []
    };
    
    if (profile.integrityScore !== score) {
      profile.integrityScore = score;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('tempo_profile_changed', { detail: profile }));
    }
    return score;
  } catch (e) {
    console.error('Error calculating integrity health:', e);
    return 100;
  }
}

export function getAllDays() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export function exportJSON() {
  const data = {
    profile: getProfile(),
    customReasons: getCustomReasons(),
    dayLogs: getAllDays()
  };
  return JSON.stringify(data, null, 2);
}

export function importJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.profile && data.customReasons && data.dayLogs) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
      localStorage.setItem(REASONS_KEY, JSON.stringify(data.customReasons));
      localStorage.setItem(DAY_LOGS_KEY, JSON.stringify(data.dayLogs));
      // Reload page to re-initialize everything cleanly
      window.location.reload();
      return true;
    }
  } catch (e) {
    console.error('Import failed:', e);
  }
  return false;
}
