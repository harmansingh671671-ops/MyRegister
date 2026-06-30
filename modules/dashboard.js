// Modules/dashboard.js
import { getDay, saveDay, getProfile, saveProfile, getCustomReasons, getAllDays } from './storage.js';
import { playSuccessSound, playPivotSound, playUnlockSound } from './notifications.js';
import { checkAndUnlockBadges } from './gamification.js';

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

export function renderDashboard(container) {
  checkAndUnlockBadges();
  const todayStr = getTodayDateStr();
  const dayLog = getDay(todayStr);
  const profile = getProfile();

  // Get active block and upcoming blocks
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Sort blocks by start time
  const blocks = [...dayLog.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  let currentBlock = null;
  let nextBlock = null;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (currentHM >= block.startTime && currentHM < block.endTime && block.status === 'pending') {
      currentBlock = block;
      nextBlock = blocks[i+1] || null;
      break;
    }
  }

  // If no active block is running, find the next pending block of the day
  if (!currentBlock) {
    nextBlock = blocks.find(b => b.startTime > currentHM && b.status === 'pending') || null;
  }

  container.innerHTML = `
    <!-- Top Stats Row (Duolingo style) -->
    <div class="dashboard-stats-row">
      <div class="stat-pill streak-pill" title="Current Daily Streak">
        <span class="stat-icon">🔥</span>
        <span class="stat-val" id="streak-counter-val">${profile.streak}</span>
      </div>
      <div class="stat-pill diamond-pill" title="Your Earned Diamonds">
        <span class="stat-icon">💎</span>
        <span class="stat-val" id="diamond-counter-val">${profile.diamonds}</span>
      </div>
      ${profile.equippedBadge ? `
        <div class="stat-pill badge-pill">
          <span class="stat-icon">🛡️</span>
          <span class="stat-val">${profile.equippedBadge}</span>
        </div>
      ` : ''}
      <button id="open-shop-btn" class="btn btn-secondary btn-3d btn-sm">🛒 Shop</button>
    </div>

    <!-- Privacy Banner -->
    <div class="card card-3d privacy-disclaimer">
      <div class="privacy-disclaimer-content">
        <span class="lock-icon">🔒</span>
        <p><strong>Your logs are 100% private to this browser.</strong> Failures are natural steps to learning. You have no reason to lie to yourself. Only badges and streak length can be shared!</p>
      </div>
    </div>

    <!-- Active Timer View -->
    <div class="dashboard-main-content">
      <div class="card card-3d dashboard-focus-card">
        ${currentBlock ? `
          <div class="focus-header">
            <span class="focus-badge pulse">ACTIVE NOW</span>
            <h2>${currentBlock.title}</h2>
            <div class="timeline-metadata">
              <span class="tag-category">${currentBlock.category}</span>
              <span class="tag-energy energy-${currentBlock.energy}">
                ${currentBlock.energy === 'high' ? '🔥 HIGH' : currentBlock.energy === 'medium' ? '⚡ MED' : '💤 LOW'}
              </span>
            </div>
          </div>
          
          <div class="focus-timer-display" id="focus-timer-val">
            --:--
          </div>

          <div class="focus-actions">
            <button id="focus-complete-btn" class="btn btn-success btn-3d btn-lg">✅ Completed Task</button>
            <button id="focus-miss-btn" class="btn btn-danger btn-3d btn-lg">❌ Diverged (Missed)</button>
          </div>
        ` : `
          <div class="no-active-focus">
            <div class="owl-sleeping">🦉💤</div>
            <h2>No active task scheduled right now.</h2>
            ${nextBlock ? `
              <p>Next up is <strong>${nextBlock.title}</strong> at <strong>${nextBlock.startTime}</strong>.</p>
            ` : `
              <p>You have no more pending tasks for today. Great job planning!</p>
            `}
            <div class="focus-actions">
              <button id="quick-reflect-btn" class="btn btn-primary btn-3d">🔍 Open Day Reflection</button>
            </div>
          </div>
        `}
      </div>

      <!-- Today's Schedule Card -->
      <div class="card card-3d dashboard-schedule-card">
        <h3>📅 Today's Schedule</h3>
        <div class="dashboard-schedule-list">
          ${blocks.length === 0 ? `
            <div class="empty-state">
              <p>No schedule planned for today.</p>
              <button onclick="window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'planner' }))" class="btn btn-primary btn-3d btn-sm">Plan Tomorrow</button>
            </div>
          ` : blocks.map(block => {
            let statusIcon = '⏳';
            let statusClass = 'pending';
            if (block.status === 'completed') {
              statusIcon = '✅';
              statusClass = 'completed';
            } else if (block.status === 'missed') {
              statusIcon = '❌';
              statusClass = 'missed';
            } else if (block.status === 'shifted') {
              statusIcon = '🔄';
              statusClass = 'shifted';
            }

            return `
              <div class="dashboard-schedule-item status-${statusClass}">
                <div class="item-time">${block.startTime} - ${block.endTime}</div>
                <div class="item-details">
                  <div class="item-title">${block.title}</div>
                  <div class="item-sub">${block.category} &middot; ${block.energy}</div>
                </div>
                <div class="item-status" data-id="${block.id}">${statusIcon}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- FULL SCREEN REFLECTION POPUP (Hidden by default) -->
    <div id="reflection-modal" class="fullscreen-modal hidden">
      <div class="modal-backdrop"></div>
      <div class="modal-card card-3d animate-pop" id="modal-card-content">
        <!-- Renders dynamically -->
      </div>
    </div>

    <!-- SHOP MODAL (Hidden by default) -->
    <div id="shop-modal" class="fullscreen-modal hidden">
      <div class="modal-backdrop" id="shop-backdrop"></div>
      <div class="modal-card shop-card card-3d animate-pop">
        <div class="modal-hero" style="background: linear-gradient(135deg, var(--duo-blue) 0%, var(--duo-orange) 100%); color: white; padding: 18px 20px; display: flex; align-items: center; gap: 14px; border-radius: 20px 20px 0 0; position: relative;">
          <button class="btn-back" id="close-shop-btn" aria-label="Go back" style="color: white; background: rgba(0,0,0,0.2); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <span class="modal-date-title" style="margin: 0; font-size: 16px; font-weight: 800; display: block; line-height: 1.2;">🛒 Odyssey Shop</span>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 3px; font-weight: 600;">
              Your Balance: 💎 <span id="shop-diamond-val">${profile.diamonds}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-body-scroll" style="padding: 16px 20px 24px;">
          <div class="shop-grid">
            <!-- Item 1: Streak Repair -->
            <div class="shop-item card-3d">
              <div class="item-badge">RESCUE</div>
              <div class="item-icon">🔧</div>
              <h4>Streak Repair Kit</h4>
              <p>Restores a broken streak. <strong>Requires honest reflection logging.</strong></p>
              <button class="btn btn-primary btn-3d btn-full buy-item-btn" data-item="repair" data-cost="50">Buy for 50 💎</button>
            </div>
            <!-- Item 2: Streak Freeze -->
            <div class="shop-item card-3d">
              <div class="item-badge">SHIELD</div>
              <div class="item-icon">❄️</div>
              <h4>Streak Freeze</h4>
              <p>Protects your streak for tomorrow if you forget to check in.</p>
              <button class="btn btn-primary btn-3d btn-full buy-item-btn" data-item="freeze" data-cost="30">Buy for 30 💎</button>
            </div>
          </div>

          <h3 style="font-family: var(--font-header); font-size: 16px; font-weight: 800; margin: 15px 0 10px;">🛡️ Profile Badges</h3>
          <p class="hint" style="margin-bottom: 12px;">Badges are earned based on your habits and schedule. Once unlocked, you can equip them to your profile banner!</p>
          <div class="shop-badges-grid">
            <div class="badge-item card-3d ${profile.unlockedBadges.includes("Deep Worker") ? '' : 'locked-badge'}" data-badge="Deep Worker">
              <span class="badge-icon">📖</span>
              <h5>Deep Worker</h5>
              <p class="badge-criteria" style="font-size: 10px; color: var(--text-hint); margin: 4px 0 8px;">Complete 5 Focus blocks</p>
              ${profile.unlockedBadges.includes("Deep Worker") ? 
                `<button class="btn btn-secondary btn-3d btn-sm buy-badge-btn" data-badge="Deep Worker">Equip</button>` : 
                `<button class="btn btn-secondary btn-3d btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Locked 🔒</button>`
              }
            </div>
            <div class="badge-item card-3d ${profile.unlockedBadges.includes("Honest Scribe") ? '' : 'locked-badge'}" data-badge="Honest Scribe">
              <span class="badge-icon">✍️</span>
              <h5>Honest Scribe</h5>
              <p class="badge-criteria" style="font-size: 10px; color: var(--text-hint); margin: 4px 0 8px;">Review & lock 3 past days</p>
              ${profile.unlockedBadges.includes("Honest Scribe") ? 
                `<button class="btn btn-secondary btn-3d btn-sm buy-badge-btn" data-badge="Honest Scribe">Equip</button>` : 
                `<button class="btn btn-secondary btn-3d btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Locked 🔒</button>`
              }
            </div>
            <div class="badge-item card-3d ${profile.unlockedBadges.includes("Early Riser") ? '' : 'locked-badge'}" data-badge="Early Riser">
              <span class="badge-icon">🌅</span>
              <h5>Early Riser</h5>
              <p class="badge-criteria" style="font-size: 10px; color: var(--text-hint); margin: 4px 0 8px;">Complete an early morning slot</p>
              ${profile.unlockedBadges.includes("Early Riser") ? 
                `<button class="btn btn-secondary btn-3d btn-sm buy-badge-btn" data-badge="Early Riser">Equip</button>` : 
                `<button class="btn btn-secondary btn-3d btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Locked 🔒</button>`
              }
            </div>
            <div class="badge-item card-3d ${profile.unlockedBadges.includes("Integrity Champion") ? '' : 'locked-badge'}" data-badge="Integrity Champion">
              <span class="badge-icon">👑</span>
              <h5>Integrity Champion</h5>
              <p class="badge-criteria" style="font-size: 10px; color: var(--text-hint); margin: 4px 0 8px;">90%+ compliance & 3 logged days</p>
              ${profile.unlockedBadges.includes("Integrity Champion") ? 
                `<button class="btn btn-secondary btn-3d btn-sm buy-badge-btn" data-badge="Integrity Champion">Equip</button>` : 
                `<button class="btn btn-secondary btn-3d btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Locked 🔒</button>`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- TIMER LOGIC ---
  let timerInterval = null;
  if (currentBlock) {
    const timerVal = container.querySelector('#focus-timer-val');
    
    const updateCountdown = () => {
      const rightNow = new Date();
      const currentHMStr = `${String(rightNow.getHours()).padStart(2, '0')}:${String(rightNow.getMinutes()).padStart(2, '0')}`;
      
      if (currentHMStr >= currentBlock.endTime) {
        // Block completed/expired, trigger reflection!
        clearInterval(timerInterval);
        triggerReflectionModal(currentBlock);
        return;
      }

      // Calculate time remaining
      const [endH, endM] = currentBlock.endTime.split(':').map(Number);
      const endDayTime = new Date();
      endDayTime.setHours(endH, endM, 0, 0);
      
      const diffMs = endDayTime - rightNow;
      if (diffMs <= 0) {
        timerVal.textContent = "00:00";
        clearInterval(timerInterval);
        triggerReflectionModal(currentBlock);
        return;
      }
      
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const diffSecs = Math.floor((diffMs / 1000) % 60);
      timerVal.textContent = `${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    };

    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
  }

  // --- BUTTON CLICKS ---
  if (currentBlock) {
    container.querySelector('#focus-complete-btn').addEventListener('click', () => {
      triggerReflectionModal(currentBlock, 'success');
    });
    container.querySelector('#focus-miss-btn').addEventListener('click', () => {
      triggerReflectionModal(currentBlock, 'missed');
    });
  }

  const quickReflectBtn = container.querySelector('#quick-reflect-btn');
  if (quickReflectBtn) {
    quickReflectBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'reflection' }));
    });
  }

  // --- REFLECTION MODAL LOGIC ---
  const modal = container.querySelector('#reflection-modal');
  const modalCard = container.querySelector('#modal-card-content');

  function triggerReflectionModal(block, preSelectStatus = null) {
    clearInterval(timerInterval);
    modal.classList.remove('hidden');

    if (preSelectStatus === 'success') {
      handleTickSuccess(block);
    } else if (preSelectStatus === 'missed') {
      renderMissedSelection(block);
    } else {
      // Default: Ask first
      renderInitialReflection(block);
    }
  }

  function renderInitialReflection(block) {
    modalCard.innerHTML = `
      <div class="modal-header">
        <span class="emoji-checkin">🦉</span>
        <h2>Mindful Check-in</h2>
        <p>Did you complete your scheduled task?</p>
        <h3 class="modal-task-title">"${block.title}"</h3>
      </div>
      <div class="modal-choices">
        <button id="modal-yes-btn" class="btn btn-success btn-3d btn-lg btn-full">✅ Yes, I Finished It!</button>
        <button id="modal-no-btn" class="btn btn-danger btn-3d btn-lg btn-full">❌ No, I Diverged</button>
      </div>
    `;

    modalCard.querySelector('#modal-yes-btn').addEventListener('click', () => {
      handleTickSuccess(block);
    });
    modalCard.querySelector('#modal-no-btn').addEventListener('click', () => {
      renderMissedSelection(block);
    });
  }

  function handleTickSuccess(block) {
    // 1. Success sound & animation
    playSuccessSound();

    // Trigger local particle/confetti sparkle
    modalCard.innerHTML = `
      <div class="success-celebration">
        <div class="sparkle-fireworks">✨💎✨</div>
        <h2>Incredible Work!</h2>
        <p>You stayed honest and executed your schedule.</p>
        <div class="diamond-earn-popup">+1 💎 Earned!</div>
      </div>
    `;

    // 2. Add rewards to profile
    const p = getProfile();
    p.diamonds += 1;
    saveProfile(p);

    // Update state
    block.status = 'completed';
    block.loggedAt = new Date().toISOString();
    saveDay(todayStr, dayLog);

    // Refresh display values on dashboard
    document.getElementById('diamond-counter-val').textContent = p.diamonds;

    // 3. Fade out modal
    setTimeout(() => {
      modal.classList.add('hidden');
      renderDashboard(container); // reload
    }, 1500);
  }

  function renderMissedSelection(block) {
    // Switch to step-lock missed reason selection
    const reasons = getCustomReasons();
    playPivotSound();

    modalCard.innerHTML = `
      <div class="modal-header">
        <span class="emoji-checkin">🧘</span>
        <h2>Pivot & Grow</h2>
        <p>No judgment. Why did you diverge from this task?</p>
        <h3 class="modal-task-title">"${block.title}"</h3>
      </div>
      
      <div class="reasons-list-lock">
        ${reasons.map((reason, index) => `
          <button class="btn btn-secondary btn-3d reason-select-btn" data-reason="${reason}">${reason}</button>
        `).join('')}
      </div>

      <p class="hint">Select a reason to unlock your schedule control panel.</p>
    `;

    modalCard.querySelectorAll('.reason-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reason = btn.getAttribute('data-reason');
        // Log the missed block honestly
        block.status = 'missed';
        block.missReason = reason;
        block.loggedAt = new Date().toISOString();
        saveDay(todayStr, dayLog);

        // Earn 1 Diamond for HONEST reporting!
        const p = getProfile();
        p.diamonds += 1;
        saveProfile(p);
        document.getElementById('diamond-counter-val').textContent = p.diamonds;

        // Sound trigger
        playPivotSound();

        // Proactive Pivot check
        renderProactivePivotPanel(block);
      });
    });
  }

  function renderProactivePivotPanel(block) {
    modalCard.innerHTML = `
      <div class="modal-header">
        <span class="emoji-checkin">🔄</span>
        <h2>Proactive Comeback</h2>
        <p>You logged honestly and earned <strong>+1 💎 Honesty Reward</strong>!</p>
        <p class="hint">Do you want to adjust the rest of today's schedule?</p>
      </div>

      <div class="pivot-actions-grid">
        <button id="pivot-shift-30" class="btn btn-primary btn-3d btn-full">⏰ Shift remaining 30 mins</button>
        <button id="pivot-shift-60" class="btn btn-primary btn-3d btn-full">⏰ Shift remaining 60 mins</button>
        <button id="pivot-tomorrow" class="btn btn-secondary btn-3d btn-full">📅 Push remaining to tomorrow</button>
        <button id="pivot-keep" class="btn btn-danger btn-3d btn-full">🙅 Keep schedule as-is</button>
      </div>
    `;

    // Calculate shifting remaining blocks
    const applyShift = (mins) => {
      const currentBlocks = dayLog.blocks;
      currentBlocks.forEach(b => {
        if (b.status === 'pending' && b.id !== block.id) {
          b.status = 'shifted';
          
          // Shift start time
          const [sh, sm] = b.startTime.split(':').map(Number);
          const sDate = new Date();
          sDate.setHours(sh, sm + mins);
          b.startTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
          
          // Shift end time
          const [eh, em] = b.endTime.split(':').map(Number);
          const eDate = new Date();
          eDate.setHours(eh, em + mins);
          b.endTime = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;
        }
      });
      saveDay(todayStr, dayLog);
      alert(`Schedule shifted by ${mins} minutes!`);
      modal.classList.add('hidden');
      renderDashboard(container);
    };

    modalCard.querySelector('#pivot-shift-30').addEventListener('click', () => applyShift(30));
    modalCard.querySelector('#pivot-shift-60').addEventListener('click', () => applyShift(60));
    
    modalCard.querySelector('#pivot-tomorrow').addEventListener('click', () => {
      // Move remaining pending blocks to tomorrow's list
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const tomorrowLog = getDay(tomorrowStr);
      
      const remaining = dayLog.blocks.filter(b => b.status === 'pending' && b.id !== block.id);
      dayLog.blocks = dayLog.blocks.filter(b => b.status !== 'pending' || b.id === block.id);
      
      tomorrowLog.blocks.push(...remaining.map(b => ({ ...b, status: 'pending' })));
      
      saveDay(todayStr, dayLog);
      saveDay(tomorrowStr, tomorrowLog);
      
      alert("Remaining tasks pushed to tomorrow's list!");
      modal.classList.add('hidden');
      renderDashboard(container);
    });

    modalCard.querySelector('#pivot-keep').addEventListener('click', () => {
      modal.classList.add('hidden');
      renderDashboard(container);
    });
  }

  // --- SHOP & BADGES CODE ---
  const shopModal = container.querySelector('#shop-modal');
  const openShopBtn = container.querySelector('#open-shop-btn');
  const closeShopBtn = container.querySelector('#close-shop-btn');
  const shopBackdrop = container.querySelector('#shop-backdrop');

  const openShop = () => {
    // Update diamonds in shop display
    container.querySelector('#shop-diamond-val').textContent = getProfile().diamonds;
    shopModal.classList.remove('hidden');
  };

  const closeShop = () => {
    shopModal.classList.add('hidden');
    renderDashboard(container); // reload to show equipped badges
  };

  openShopBtn.addEventListener('click', openShop);
  closeShopBtn.addEventListener('click', closeShop);
  shopBackdrop.addEventListener('click', closeShop);

  // Buy Shop items (Streak Freeze, Streak Repair)
  container.querySelectorAll('.buy-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = getProfile();
      const item = btn.getAttribute('data-item');
      const cost = parseInt(btn.getAttribute('data-cost'));

      if (p.diamonds < cost) {
        alert("❌ Insufficient diamonds! Go log some blocks to earn more.");
        return;
      }

      if (item === 'repair') {
        // Streaks Repair Kit Requirement:
        // Must have at least one honest "missed" log in the database
        const logs = getAllDays();
        let hasHonestMiss = false;
        
        for (const date in logs) {
          if (logs[date].blocks.some(b => b.status === 'missed')) {
            hasHonestMiss = true;
            break;
          }
        }

        if (!hasHonestMiss) {
          alert("❌ Streak Repair Kit locked! To prevent gaming the system, you can only buy this kit if you have logged at least one honest mistake ('cross') in the past. Stay honest to earn redemption!");
          return;
        }

        // Restore streak if broken
        if (p.streak === 0) {
          p.diamonds -= cost;
          p.streak = 1; // restore to 1
          saveProfile(p);
          playUnlockSound();
          alert("🔧 Streak repaired successfully! Your streak is now active at 1. Keep it going!");
          closeShop();
        } else {
          alert("Your streak is not currently broken! No need for repair.");
        }
      } 
      
      else if (item === 'freeze') {
        if (p.streakFreezeActive) {
          alert("Streak Freeze is already active for tomorrow!");
          return;
        }
        p.diamonds -= cost;
        p.streakFreezeActive = true;
        saveProfile(p);
        playUnlockSound();
        alert("❄️ Streak Freeze active! Your streak is protected for tomorrow.");
        closeShop();
      }
    });
  });

  // Equip Badges
  container.querySelectorAll('.buy-badge-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = getProfile();
      const badge = btn.getAttribute('data-badge');

      if (p.unlockedBadges.includes(badge)) {
        // Equip/Unequip
        if (p.equippedBadge === badge) {
          p.equippedBadge = null;
          alert(`Equipped badge removed.`);
        } else {
          p.equippedBadge = badge;
          alert(`"${badge}" badge equipped to your profile banner!`);
        }
        saveProfile(p);
        closeShop();
      }
    });
  });

  // Highlight equipped badges in shop
  const p = getProfile();
  container.querySelectorAll('.buy-badge-btn').forEach(btn => {
    const badge = btn.getAttribute('data-badge');
    if (p.unlockedBadges.includes(badge)) {
      btn.textContent = p.equippedBadge === badge ? 'Equipped' : 'Equip';
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-success');
    }
  });
}
