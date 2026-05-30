// Modules/ranks.js
import { getProfile, saveProfile, getAllDays } from './storage.js';
import { playUnlockSound, showToast } from './notifications.js';

export const RANKS = [
  { name: "Civilian", streak: 0, efficiency: 0, division: "Starter", icon: "Civilian", badge: "🍃" },
  { name: "Sepoy", streak: 15, efficiency: 60, division: "Bronze", icon: "Sepoy", badge: "🎖️" },
  { name: "Lance Naik", streak: 30, efficiency: 70, division: "Bronze", icon: "Lance Naik", badge: "🎖️" },
  { name: "Naik", streak: 45, efficiency: 75, division: "Bronze", icon: "Naik", badge: "🎖️" },
  { name: "Havaldar", streak: 60, efficiency: 75, division: "Bronze", icon: "Havaldar", badge: "🎖️" },
  { name: "Qt. Mstr. Hav.", streak: 75, efficiency: 75, division: "Bronze", icon: "Qt. Mstr. Hav.", badge: "🎖️" },
  { name: "Naib Subedar", streak: 100, efficiency: 80, division: "Silver", icon: "Naib Subedar", badge: "💂" },
  { name: "Subedar", streak: 125, efficiency: 80, division: "Silver", icon: "Subedar", badge: "💂" },
  { name: "Subedar Major", streak: 150, efficiency: 80, division: "Silver", icon: "Subedar Major", badge: "💂" },
  { name: "Lieutenant", streak: 175, efficiency: 82.5, division: "Gold", icon: "Lieutenant", badge: "⚔️" },
  { name: "Captain", streak: 200, efficiency: 82.5, division: "Gold", icon: "Captain", badge: "⚔️" },
  { name: "Major", streak: 225, efficiency: 82.5, division: "Gold", icon: "Major", badge: "⚔️" },
  { name: "Lt. Colonel", streak: 250, efficiency: 85, division: "Gold", icon: "Lt. Colonel", badge: "⚔️", desc: "2nd in Command of the Unit" },
  { name: "Colonel", streak: 280, efficiency: 85, division: "Gold", icon: "Colonel", badge: "⚔️", desc: "Commanding Officer of the Unit" },
  { name: "Brigadier", streak: 320, efficiency: 85, division: "Platinum", icon: "Brigadier", badge: "⭐", desc: "Brigade Commander" },
  { name: "Maj. General", streak: 365, efficiency: 85, division: "Platinum", icon: "Maj. General", badge: "⭐⭐", desc: "Division Commander" },
  { name: "Lt. General", streak: 400, efficiency: 85, division: "Platinum", icon: "Lt. General", badge: "⭐⭐⭐", desc: "Corp Commander" },
  { name: "General", streak: 500, efficiency: 85, division: "Platinum", icon: "General", badge: "👑", desc: "Chief of Army Staff" },
  { name: "Field Marshal", streak: 730, efficiency: 85, division: "GOAT", icon: "Field Marshal", badge: "🏆", desc: "Lifetime Commander (2 Yr Streak)" }
];

export const DIVISIONS = {
  "Starter": { name: "Starter Division", color: "#afafaf" },
  "Bronze": { name: "Bronze Division", color: "#ff9600" },
  "Silver": { name: "Silver Division", color: "#1cb0f6" },
  "Gold": { name: "Gold Division", color: "#ffc800" },
  "Platinum": { name: "Platinum Division", color: "#e09ba6" },
  "GOAT": { name: "GOAT Division", color: "#58cc02" }
};

// Calculate focus efficiency over lifetime
export function calculateLifetimeStats() {
  const history = getAllDays();
  let totalPlannedHours = 0;
  let totalCompletedHours = 0;

  for (const date in history) {
    if (history[date] && history[date].blocks) {
      history[date].blocks.forEach(b => {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        
        totalPlannedHours += duration;
        if (b.status === 'completed') {
          totalCompletedHours += duration;
        }
      });
    }
  }

  const efficiency = totalPlannedHours > 0 ? Math.round((totalCompletedHours / totalPlannedHours) * 1000) / 10 : 0;
  
  return {
    efficiency,
    totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
    totalCompletedHours: Math.round(totalCompletedHours * 10) / 10
  };
}

// Evaluate military promotion
export function calculateMilitaryRank() {
  const profile = getProfile();
  const stats = calculateLifetimeStats();
  
  // Ranks Demotions Guard: we look sequentially to find the highest rank qualified.
  // Since we start from Civilian, we loop through and check if the user qualifies.
  // If their CURRENT rank is already higher in the sequence than the one we are evaluating,
  // we do NOT demote them.
  let activeRankIndex = RANKS.findIndex(r => r.name === (profile.militaryRank || "Civilian"));
  if (activeRankIndex === -1) activeRankIndex = 0;

  let qualifiedRankIndex = 0;

  for (let i = 0; i < RANKS.length; i++) {
    const rank = RANKS[i];
    // Check if user meets streak and efficiency requirements
    const meetsStreak = (profile.streak >= rank.streak) || (profile.highestStreak >= rank.streak);
    const meetsEfficiency = stats.efficiency >= rank.efficiency;

    if (meetsStreak && meetsEfficiency) {
      qualifiedRankIndex = i;
    }
  }

  // Only promote, never demote
  if (qualifiedRankIndex > activeRankIndex) {
    const newRank = RANKS[qualifiedRankIndex];
    profile.militaryRank = newRank.name;
    saveProfile(profile);

    playUnlockSound();
    triggerPromotionModal(newRank);
  }
}

// Promotion Alert Dialog Card
function triggerPromotionModal(newRank) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-modal alert-modal-overlay';
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card card-3d animate-pop promotion-card" style="text-align: center; max-width: 320px; padding: 30px;">
      <div style="font-size: 55px; margin-bottom: 8px;">🎖️💂</div>
      <h2 style="font-family: var(--font-header); font-size: 22px;">MILITARY PROMOTION!</h2>
      <p style="font-size: 11px; color: var(--text-hint); text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-top:-4px;">${newRank.division} Division</p>
      
      <div style="background: var(--bg-dark); border: 2px solid var(--border-color); padding: 12px; border-radius: 12px; font-weight: 800; font-size: 18px; margin: 15px 0; color: var(--duo-gold);">
        ${newRank.badge} ${newRank.name}
      </div>

      <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.4; margin-bottom: 20px;">
        Salute! You have been promoted to <strong>${newRank.name}</strong> for outstanding discipline and honesty!
      </p>
      <button class="btn btn-primary btn-3d btn-full btn-sm" id="close-promotion-btn">Salute & Proceed</button>
    </div>
  `;
  document.querySelector('.phone-screen-content').appendChild(overlay);
  overlay.querySelector('#close-promotion-btn').onclick = () => overlay.remove();
}

// Open Ranks Standings details card modal
export function openRanksModal() {
  // Recalculate rank before showing
  calculateMilitaryRank();

  const modal = document.getElementById('ranks-modal');
  const content = document.getElementById('ranks-modal-content');
  if (!modal || !content) return;

  const profile = getProfile();
  const stats = calculateLifetimeStats();

  const currentRankName = profile.militaryRank || "Civilian";
  const activeRankIndex = RANKS.findIndex(r => r.name === currentRankName);
  const currentRank = RANKS[activeRankIndex === -1 ? 0 : activeRankIndex];
  const currentDiv = DIVISIONS[currentRank.division] || DIVISIONS.Starter;

  modal.classList.remove('hidden');

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  // Close handlers
  modal.querySelector('#ranks-modal-backdrop').onclick = closeModal;

  content.innerHTML = `
    <div class="modal-header-row">
      <span class="modal-date-title">🎖️ Military Rank Standings</span>
      <button class="btn-close" id="ranks-close-btn">&times;</button>
    </div>
    
    <div class="modal-body-scroll" style="padding: 10px 0;">
      <!-- Active Rank Card -->
      <div class="card card-3d" style="background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-hover) 100%); margin-bottom: 16px; padding: 20px; text-align: center; border-color: var(--duo-gold);">
        <div style="font-size: 45px; margin-bottom: 4px;">${currentRank.badge}</div>
        <h3 style="font-family: var(--font-header); font-size: 20px; margin: 4px 0;">${currentRank.name}</h3>
        <span style="font-size: 11px; background: var(--bg-dark); color: ${currentDiv.color}; border: 1.5px solid var(--border-color); padding: 2px 8px; border-radius: 12px; font-weight: bold;">
          ${currentDiv.name}
        </span>

        <div style="display: flex; gap: 10px; margin-top: 15px; text-align: left;">
          <div style="flex:1; background:var(--bg-dark); padding:10px; border-radius:8px; border:1.5px solid var(--border-color);">
            <span style="font-size:10px; color:var(--text-hint); display:block; font-weight:bold; text-transform:uppercase;">Streak record</span>
            <span style="font-size:15px; font-weight:bold;">${Math.max(profile.streak, profile.highestStreak)} days</span>
          </div>
          <div style="flex:1; background:var(--bg-dark); padding:10px; border-radius:8px; border:1.5px solid var(--border-color);">
            <span style="font-size:10px; color:var(--text-hint); display:block; font-weight:bold; text-transform:uppercase;">Focus Efficiency</span>
            <span style="font-size:15px; font-weight:bold; color:var(--duo-green);">${stats.efficiency}%</span>
          </div>
        </div>
      </div>

      <p class="hint" style="margin-bottom: 12px; text-align:center;">Unlock ranks sequentially. Once promoted, you can never be demoted!</p>

      <!-- Scrollable list of ranks by Division -->
      <div class="divisions-list-layout" style="display:flex; flex-direction:column; gap:16px;">
        ${Object.keys(DIVISIONS).map(divKey => {
          const div = DIVISIONS[divKey];
          const divRanks = RANKS.filter(r => r.division === divKey);

          return `
            <div style="border: 2px solid var(--border-color); border-radius: 16px; padding: 12px; background-color: var(--bg-dark);">
              <h4 style="font-family: var(--font-header); font-size: 13px; color: ${div.color}; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                ${div.name}
              </h4>
              
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${divRanks.map(rank => {
                  const rIdx = RANKS.findIndex(r => r.name === rank.name);
                  const isUnlocked = rIdx <= activeRankIndex;
                  const isCurrent = rank.name === currentRankName;
                  
                  // Check details
                  const streakGoal = rank.streak;
                  const effGoal = rank.efficiency;

                  let rowBorder = 'border: 2px solid var(--border-color);';
                  let bg = 'background-color: var(--bg-surface);';
                  if (isCurrent) {
                    rowBorder = 'border: 2.5px solid var(--duo-gold); box-shadow: 0 0 8px rgba(255,200,0,0.15);';
                  } else if (isUnlocked) {
                    rowBorder = 'border: 2px solid var(--border-color); opacity: 0.85;';
                  } else {
                    bg = 'background-color: rgba(20,20,30,0.4);';
                    rowBorder = 'border: 2px dashed var(--border-color); opacity: 0.55;';
                  }

                  return `
                    <div style="${rowBorder} ${bg} padding: 10px 12px; border-radius: 10px; display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:20px;">${rank.badge}</span>
                        <div>
                          <strong style="font-size:12px; color:${isUnlocked ? 'white' : 'var(--text-secondary)'};">${rank.name}</strong>
                          ${rank.desc ? `<div style="font-size:9px; color:var(--text-hint);">${rank.desc}</div>` : ''}
                        </div>
                      </div>
                      <div style="text-align:right; font-size:10px; font-weight:bold; color:var(--text-secondary);">
                        ${isUnlocked 
                          ? '<span style="color:var(--duo-green);">✓ Unlocked</span>' 
                          : `<span>🔥 ${streakGoal}d & 📈 ${effGoal}%</span>`
                        }
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  content.querySelector('#ranks-close-btn').onclick = closeModal;
}
