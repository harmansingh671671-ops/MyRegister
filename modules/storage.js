// Modules/storage.js
// Core data persistence layer with validation and error handling

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
  milestonesClaimed: [],
  hasCompletedOnboarding: false,
  name: '',
  dob: '',
  goals: [],
  createdDate: '',
  weekNames: {},
  xp: 0,
  level: 1,
  leagueTier: 'Bronze',
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
  violationLog: [],
  militaryRank: 'Civilian',
  lastHonestyReminderDate: ''
};

// Validate and sanitize data before storage
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, 500);
}

function validateProfile(profile) {
  const validated = { ...DEFAULT_PROFILE };
  
  if (typeof profile !== 'object' || profile === null) {
    return validated;
  }

  // Validate primitive values
  validated.name = sanitizeString(profile.name || '');
  validated.dob = sanitizeString(profile.dob || '');
  validated.diamonds = Math.max(0, Math.floor(profile.diamonds || 0));
  validated.streak = Math.max(0, Math.floor(profile.streak || 0));
  validated.level = Math.max(1, Math.floor(profile.level || 1));
  validated.xp = Math.max(0, Math.floor(profile.xp || 0));
  validated.integrityScore = Math.max(0, Math.min(100, Math.floor(profile.integrityScore || 100)));
  validated.highestStreak = Math.max(0, Math.floor(profile.highestStreak || 0));
  validated.hasCompletedOnboarding = Boolean(profile.hasCompletedOnboarding);
  validated.streakFreezeActive = Boolean(profile.streakFreezeActive);
  
  // Validate arrays and objects
  validated.milestonesClaimed = Array.isArray(profile.milestonesClaimed) ? profile.milestonesClaimed : [];
  validated.goals = Array.isArray(profile.goals) ? profile.goals.filter(g => typeof g === 'object') : [];
  validated.weekNames = (typeof profile.weekNames === 'object' && profile.weekNames !== null) ? profile.weekNames : {};
  validated.unlockedThemes = Array.isArray(profile.unlockedThemes) ? profile.unlockedThemes : ['default'];
  validated.equippedTheme = ['default', 'dark', 'ocean', 'forest'].includes(profile.equippedTheme) ? profile.equippedTheme : 'default';
  validated.militaryRank = sanitizeString(profile.militaryRank || 'Civilian');
  validated.leagueTier = ['Bronze', 'Silver', 'Gold', 'Diamond'].includes(profile.leagueTier) ? profile.leagueTier : 'Bronze';
  
  // Preserve dates
  validated.lastPlanDate = sanitizeString(profile.lastPlanDate || '');
  validated.lastReviewDate = sanitizeString(profile.lastReviewDate || '');
  validated.createdDate = sanitizeString(profile.createdDate || '');
  validated.lastLeagueReset = sanitizeString(profile.lastLeagueReset || '');
  validated.lastHonestyReminderDate = sanitizeString(profile.lastHonestyReminderDate || '');
  
  return validated;
}

export function initStorage() {
  try {
    if (!localStorage.getItem(PROFILE_KEY)) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    }
    if (!localStorage.getItem(DAY_LOGS_KEY)) {
      localStorage.setItem(DAY_LOGS_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(REASONS_KEY)) {
      localStorage.setItem(REASONS_KEY, JSON.stringify(DEFAULT_MISS_REASONS));
    }
  } catch (e) {
    console.error('Error initializing storage:', e);
  }
}

export function getProfile() {
  initStorage();
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return { ...DEFAULT_PROFILE };
    
    const prof = JSON.parse(stored);
    return validateProfile(prof);
  } catch (e) {
    console.error('Error reading profile:', e);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  try {
    const validated = validateProfile(profile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(validated));
    window.dispatchEvent(new CustomEvent('tempo_profile_changed', { detail: validated }));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function getCustomReasons() {
  initStorage();
  try {
    const stored = localStorage.getItem(REASONS_KEY);
    if (!stored) return [...DEFAULT_MISS_REASONS];
    
    const reasons = JSON.parse(stored);
    return Array.isArray(reasons) ? reasons : [...DEFAULT_MISS_REASONS];
  } catch (e) {
    console.error('Error reading reasons:', e);
    return [...DEFAULT_MISS_REASONS];
  }
}

export function saveCustomReasons(reasons) {
  try {
    if (!Array.isArray(reasons)) return false;
    const sanitized = reasons.map(r => sanitizeString(r)).filter(r => r);
    localStorage.setItem(REASONS_KEY, JSON.stringify(sanitized));
    return true;
  } catch (e) {
    console.error('Error saving reasons:', e);
    return false;
  }
}

export function addCustomReason(reason) {
  try {
    const reasons = getCustomReasons();
    const trimmed = sanitizeString(reason);
    if (trimmed && !reasons.includes(trimmed) && reasons.length < 20) {
      reasons.push(trimmed);
      return saveCustomReasons(reasons);
    }
    return false;
  } catch (e) {
    console.error('Error adding reason:', e);
    return false;
  }
}

export function removeCustomReason(reason) {
  try {
    const reasons = getCustomReasons();
    const filtered = reasons.filter(r => r !== reason);
    saveCustomReasons(filtered);
  } catch (e) {
    console.error('Error removing reason:', e);
  }
}

export function getDay(dateStr) {
  initStorage();
  try {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn('Invalid date format:', dateStr);
      return { date: dateStr, blocks: [], isCommitted: false, isReviewed: false };
    }
    
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
    return logs[dateStr] || {
      date: dateStr,
      blocks: [],
      isCommitted: false,
      isReviewed: false
    };
  } catch (e) {
    console.error('Error reading day:', e);
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn('Invalid date format:', dateStr);
      return;
    }
    
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY)) || {};
    logs[dateStr] = dayLog;
    localStorage.setItem(DAY_LOGS_KEY, JSON.stringify(logs));
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
      if (logs[date] && Array.isArray(logs[date].blocks)) {
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

    let score = 100;
    if (entries.length > 0) {
      entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
      const last24 = entries.slice(0, 24);
      const completedCount = last24.filter(e => e.status === 'completed').length;
      score = Math.round((completedCount / last24.length) * 100);
    }

    const profile = getProfile();
    if (profile.integrityScore !== score) {
      profile.integrityScore = score;
      saveProfile(profile);
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
    const logs = JSON.parse(localStorage.getItem(DAY_LOGS_KEY));
    return (typeof logs === 'object' && logs !== null) ? logs : {};
  } catch (e) {
    console.error('Error reading all days:', e);
    return {};
  }
}

export function exportJSON() {
  try {
    const data = {
      profile: getProfile(),
      customReasons: getCustomReasons(),
      dayLogs: getAllDays()
    };
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('Error exporting data:', e);
    return '';
  }
}

export function importJSON(jsonStr) {
  try {
    if (typeof jsonStr !== 'string') return false;
    
    const data = JSON.parse(jsonStr);
    if (!data.profile || !data.customReasons || !data.dayLogs) {
      return false;
    }
    
    localStorage.setItem(PROFILE_KEY, JSON.stringify(validateProfile(data.profile)));
    localStorage.setItem(REASONS_KEY, JSON.stringify(data.customReasons));
    localStorage.setItem(DAY_LOGS_KEY, JSON.stringify(data.dayLogs));
    window.location.reload();
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
