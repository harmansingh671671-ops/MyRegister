// Modules/gamification.js
import { getProfile, saveProfile, getAllDays, getDay } from './storage.js';
import { playUnlockSound, playSuccessSound, showToast } from './notifications.js';

// Calculate cumulative XP needed for a level
// Linear system: Level L requires L * 100 XP to advance to L+1.
export function getLevelFromXp(xp) {
  // Let's use: Level = Math.floor(xp / 100) + 1
  return Math.floor(xp / 100) + 1;
}

export function getXpInCurrentLevel(xp) {
  return xp % 100;
}

export function getXpRequiredForNextLevel(level) {
  return 100;
}

// Add XP to the user's profile and handle Level-Up celebrations
export function addXp(amount) {
  const profile = getProfile();
  const oldLevel = profile.level;
  
  profile.xp += amount;
  profile.level = getLevelFromXp(profile.xp);

  // Check for daily XP record
  const todayStr = new Date().toISOString().split('T')[0];
  // Calculate today's XP from day logs if needed, or track it dynamically. 
  // Let's just track daily peak XP.
  
  if (profile.level > oldLevel) {
    playUnlockSound();
    triggerLevelUpModal(profile.level);
  }

  saveProfile(profile);
  return profile.level > oldLevel;
}

// Level Up Modal Celebration Overlay
function triggerLevelUpModal(newLevel) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-modal alert-modal-overlay';
  overlay.id = 'level-up-modal';
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card card-3d animate-pop level-up-card" style="text-align: center; max-width: 320px; padding: 30px;">
      <div class="level-up-stars">✨⭐✨</div>
      <div class="level-badge-large">${newLevel}</div>
      <h2 style="font-family: var(--font-header); margin-top: 15px;">LEVEL UP!</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">You reached Level ${newLevel}! Keep up the consistent schedule blocks.</p>
      <button class="btn btn-primary btn-3d btn-full" id="close-lvl-btn">Awesome!</button>
    </div>
  `;
  document.querySelector('.phone-screen-content').appendChild(overlay);

  overlay.querySelector('#close-lvl-btn').onclick = () => {
    overlay.remove();
  };
}

// Bot Competitors Names and Baseline Config
const BOT_NAMES = [
  "Focus Snail 🐌", "Habit Koala 🐨", "Streak Panda 🐼", "Sloth Planner 🦥",
  "Pomodoro Penguin 🐧", "Consistent Cat 🐱", "Routine Rabbit 🐰",
  "Deep Work Fox 🦊", "Flow Lion 🦁", "Chronotype Owl 🦉", "Planner Poodle 🐩"
];

// Initialize weekly leaderboard with 9 bot players
export function initWeeklyLeaderboard(forceReset = false) {
  const profile = getProfile();
  if (profile.weeklyLeaderboard && profile.weeklyLeaderboard.length > 0 && !forceReset) {
    return profile.weeklyLeaderboard;
  }

  const leagueBaseXp = {
    "Bronze": 50,
    "Silver": 200,
    "Gold": 500,
    "Diamond": 1000
  };

  const base = leagueBaseXp[profile.leagueTier] || 50;
  
  // Choose random bots
  const shuffled = [...BOT_NAMES].sort(() => 0.5 - Math.random());
  const selectedBots = shuffled.slice(0, 9);

  const leaderboard = [
    { name: `${profile.name || "You"} (You)`, xp: profile.xp, isUser: true }
  ];

  selectedBots.forEach(bot => {
    // Generate a random XP score around the base league tier
    const botXp = base + Math.floor(Math.random() * (base * 1.5));
    leaderboard.push({ name: bot, xp: botXp, isUser: false });
  });

  // Sort descending
  leaderboard.sort((a, b) => b.xp - a.xp);

  profile.weeklyLeaderboard = leaderboard;
  if (!profile.lastLeagueReset) {
    profile.lastLeagueReset = new Date().toISOString();
  }
  saveProfile(profile);

  return leaderboard;
}

// Simulate bot progress in the background
export function updateLeaderboard() {
  const profile = getProfile();
  if (!profile.weeklyLeaderboard || profile.weeklyLeaderboard.length === 0) {
    initWeeklyLeaderboard();
    return;
  }

  let userRow = profile.weeklyLeaderboard.find(r => r.isUser);
  if (userRow) {
    userRow.xp = profile.xp;
  }

  // 30% chance for each bot to gain some XP points
  let updated = false;
  profile.weeklyLeaderboard.forEach(row => {
    if (!row.isUser) {
      if (Math.random() < 0.3) {
        const increment = 10 + Math.floor(Math.random() * 25);
        row.xp += increment;
        updated = true;
      }
    }
  });

  if (updated) {
    profile.weeklyLeaderboard.sort((a, b) => b.xp - a.xp);
    saveProfile(profile);
  }
}

// Check league promotion/demotion triggers
export function checkLeagueEndOfWeek(force = false) {
  const profile = getProfile();
  
  // Calculate if 7 days elapsed since last reset
  const now = new Date();
  const resetDate = profile.lastLeagueReset ? new Date(profile.lastLeagueReset) : new Date();
  const diffTime = Math.abs(now - resetDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7 && !force) {
    return; // Not yet time
  }

  // Update leaderboard one last time to sync user XP
  let userRow = profile.weeklyLeaderboard.find(r => r.isUser);
  if (userRow) userRow.xp = profile.xp;
  profile.weeklyLeaderboard.sort((a, b) => b.xp - a.xp);

  // Find user rank (0-indexed)
  const userRankIndex = profile.weeklyLeaderboard.findIndex(r => r.isUser);
  const rank = userRankIndex + 1; // 1-indexed

  const tiers = ["Bronze", "Silver", "Gold", "Diamond"];
  const currentTierIndex = tiers.indexOf(profile.leagueTier);

  let msg = "";
  let reward = 0;

  if (rank <= 3) {
    // Promote
    const nextTierIndex = Math.min(tiers.length - 1, currentTierIndex + 1);
    const nextTier = tiers[nextTierIndex];
    
    reward = rank === 1 ? 50 : rank === 2 ? 30 : 20;
    profile.diamonds += reward;

    if (nextTier !== profile.leagueTier) {
      msg = `🏆 LEAGUE PROMOTION! You finished Rank #${rank} and advanced to the ${nextTier} League! +${reward} 💎 awarded.`;
      profile.leagueTier = nextTier;
    } else {
      msg = `🏆 CHAMPION REWARD! You won Rank #${rank} in the ${profile.leagueTier} League! +${reward} 💎 awarded.`;
    }
  } else if (rank >= 8) {
    // Demote
    const prevTierIndex = Math.max(0, currentTierIndex - 1);
    const prevTier = tiers[prevTierIndex];
    if (prevTier !== profile.leagueTier) {
      msg = `⚠️ DEMOTED! You finished Rank #${rank} and dropped to the ${prevTier} League. Stay consistent to bounce back!`;
      profile.leagueTier = prevTier;
    } else {
      msg = `League reset complete. You finished Rank #${rank}. Log tasks daily to climb standings!`;
    }
  } else {
    // Stay same
    msg = `League reset complete! You finished Rank #${rank} and maintained your spot in the ${profile.leagueTier} League.`;
  }

  // Show League Result Modal
  triggerLeagueResultModal(rank, profile.leagueTier, reward, msg);

  // Reset user's XP in leaderboard, generate new bots
  profile.lastLeagueReset = new Date().toISOString();
  saveProfile(profile);
  
  // Re-generate bots with new XP targets
  initWeeklyLeaderboard(true);
}

// League Result Recap Modal
function triggerLeagueResultModal(rank, tier, reward, message) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-modal alert-modal-overlay';
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card card-3d animate-pop league-result-card" style="text-align: center; max-width: 340px; padding: 25px;">
      <span style="font-size: 55px; display: block; margin-bottom: 10px;">🛡️</span>
      <h3 style="font-family: var(--font-header); font-size: 20px;">League Week Ended</h3>
      <div style="background: var(--bg-dark); padding: 10px; border-radius: 8px; font-weight: bold; margin: 12px 0;">
        Rank: #${rank} | League: ${tier}
      </div>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 15px;">${message}</p>
      <button class="btn btn-primary btn-3d btn-full btn-sm" id="close-league-result-btn">Got it</button>
    </div>
  `;
  document.querySelector('.phone-screen-content').appendChild(overlay);
  overlay.querySelector('#close-league-result-btn').onclick = () => overlay.remove();
}

// End of Day Recap screen (beautiful shareable Wordle-like UI)
export function triggerEODRecap(dateStr, closeParentModalFn) {
  const dayLog = getDay(dateStr);
  const profile = getProfile();
  
  const blocks = dayLog.blocks;
  const total = blocks.length;
  const completed = blocks.filter(b => b.status === 'completed').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate XP gained and diamonds earned today
  let diamondsEarned = 1; // 1 for planning + 1 for review
  let xpGained = 0;
  
  blocks.forEach(b => {
    if (b.status === 'completed') {
      const mult = dayLog.morningBonusActive ? 2 : 1;
      const baseXP = b.difficulty === 'hard' ? 30 : b.difficulty === 'medium' ? 20 : 10;
      xpGained += baseXP * mult;
      
      const baseGems = b.difficulty === 'hard' ? 3 : b.difficulty === 'medium' ? 2 : 1;
      diamondsEarned += baseGems;
    }
  });

  // Calculate emoji blocks sequence
  const gridEmojis = blocks.map(b => {
    if (b.status === 'completed') return "🟩";
    if (b.status === 'missed') return "🟥";
    if (b.status === 'shifted') return "🟨";
    return "⬛";
  }).join('');

  // Choose motivational copy based on compliance
  let motivationalText = "The couch won today. Tomorrow's a different story.";
  let avatar = "🦉💔";
  if (rate >= 90) {
    motivationalText = "Perfect execution! You entered pure flow state today.";
    avatar = "🦉🔥";
  } else if (rate >= 70) {
    motivationalText = "Solid work! A consistent push to build momentum.";
    avatar = "🦉✨";
  } else if (rate >= 50) {
    motivationalText = "Honest efforts. Adapt your buffer times to improve.";
    avatar = "🦉💡";
  }

  // Render Recap Overlay
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-modal alert-modal-overlay';
  overlay.id = 'eod-recap-modal';
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card card-3d animate-pop recap-modal-card" style="max-width: 360px; padding: 25px; text-align: center;">
      <span style="font-size: 60px; display: block; margin-bottom: 10px;">${avatar}</span>
      <h2 style="font-family: var(--font-header);">Daily Recap</h2>
      <p style="font-size: 13px; color: var(--text-hint); margin-top: -4px;">${dateStr}</p>
      
      <div class="recap-score-circle">
        <span class="score-percent">${rate}%</span>
        <span class="score-label">Compliance</span>
      </div>

      <p class="recap-quote">"${motivationalText}"</p>

      <div style="display: flex; gap: 8px; margin: 15px 0;">
        <div style="flex:1; background:var(--bg-dark); border:2px solid var(--border-color); padding:8px; border-radius:8px;">
          <span style="font-size:11px; color:var(--text-hint);">XP GAINED</span>
          <h4 style="margin:2px 0;">+${xpGained} XP</h4>
        </div>
        <div style="flex:1; background:var(--bg-dark); border:2px solid var(--border-color); padding:8px; border-radius:8px;">
          <span style="font-size:11px; color:var(--text-hint);">DIAMONDS</span>
          <h4 style="margin:2px 0;">+${diamondsEarned} 💎</h4>
        </div>
        <div style="flex:1; background:var(--bg-dark); border:2px solid var(--border-color); padding:8px; border-radius:8px;">
          <span style="font-size:11px; color:var(--text-hint);">STREAK</span>
          <h4 style="margin:2px 0;">${profile.streak} 🔥</h4>
        </div>
      </div>

      <div style="font-size:16px; letter-spacing:4px; margin-bottom:15px; font-weight:bold;">
        ${gridEmojis || 'No blocks scheduled'}
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary btn-3d" id="recap-share-btn" style="flex: 1;">📋 Share</button>
        <button class="btn btn-success btn-3d" id="recap-done-btn" style="flex: 1;">Close</button>
      </div>
    </div>
  `;

  document.querySelector('.phone-screen-content').appendChild(overlay);

  overlay.querySelector('#recap-done-btn').onclick = () => {
    overlay.remove();
    if (closeParentModalFn) closeParentModalFn();
  };

  overlay.querySelector('#recap-share-btn').onclick = () => {
    const shareText = `Tempo Day Review 📅\nLevel: ${profile.level} ⭐ | Streak: ${profile.streak} 🔥\nDaily Compliance: ${rate}%\nActivity Board: ${gridEmojis || 'None'}\nBuild honesty habits with Tempo!`;
    navigator.clipboard.writeText(shareText).then(() => {
      showToast("Copied recap text to clipboard! 🎉", "success");
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  };
}
