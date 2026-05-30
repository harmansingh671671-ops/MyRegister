// Modules/dayModal.js
import { getDay, saveDay, getProfile, saveProfile, getCustomReasons, getAllDays } from './storage.js';
import { playSuccessSound, playPivotSound, playUnlockSound, showConfirm } from './notifications.js';
import { addXp, triggerEODRecap } from './gamification.js';
import { calculateMilitaryRank } from './ranks.js';

const PRESETS = {
  deepwork: [
    { startTime: "09:00", endTime: "11:00", title: "💻 Deep Coding", category: "Work", energy: "high", difficulty: "hard", status: "pending" },
    { startTime: "11:15", endTime: "12:15", title: "📧 Emails & Sync", category: "Admin", energy: "medium", difficulty: "easy", status: "pending" },
    { startTime: "13:30", endTime: "15:30", title: "💻 Project Dev", category: "Work", energy: "high", difficulty: "medium", status: "pending" },
    { startTime: "16:00", endTime: "17:00", title: "🏃 Gym Workout", category: "Health", energy: "medium", difficulty: "medium", status: "pending" },
    { startTime: "22:30", endTime: "06:30", title: "🛌 Night Rest", category: "Sleep", energy: "low", difficulty: "easy", status: "pending" }
  ],
  study: [
    { startTime: "08:30", endTime: "10:30", title: "📚 Study Slot 1", category: "Study", energy: "high", difficulty: "hard", status: "pending" },
    { startTime: "11:00", endTime: "13:00", title: "📚 Study Slot 2", category: "Study", energy: "high", difficulty: "hard", status: "pending" },
    { startTime: "14:00", endTime: "15:30", title: "📚 Review & Notes", category: "Study", energy: "medium", difficulty: "medium", status: "pending" },
    { startTime: "16:30", endTime: "18:00", title: "🧘 Outdoor Walk", category: "Leisure", energy: "low", difficulty: "easy", status: "pending" },
    { startTime: "23:00", endTime: "07:00", title: "🛌 Overnight Sleep", category: "Sleep", energy: "low", difficulty: "easy", status: "pending" }
  ],
  health: [
    { startTime: "07:00", endTime: "08:00", title: "🏃 Morning Cardio", category: "Health", energy: "medium", difficulty: "medium", status: "pending" },
    { startTime: "09:00", endTime: "12:00", title: "💻 Daily Focus Work", category: "Work", energy: "high", difficulty: "hard", status: "pending" },
    { startTime: "13:30", endTime: "15:00", title: "🧘 Reading & Rest", category: "Leisure", energy: "low", difficulty: "easy", status: "pending" },
    { startTime: "16:00", endTime: "17:30", title: "📧 Admin Tasks", category: "Admin", energy: "medium", difficulty: "easy", status: "pending" },
    { startTime: "22:00", endTime: "06:00", title: "🛌 Restful Sleep", category: "Sleep", energy: "low", difficulty: "easy", status: "pending" }
  ]
};

let activeTimerInterval = null;

export function openDayModal(dateStr) {
  const modal = document.getElementById('day-modal');
  const content = document.getElementById('day-modal-content');
  const backdrop = document.getElementById('day-modal-backdrop');

  if (!modal || !content) return;

  // Clear any existing timer
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
  }

  modal.classList.remove('hidden');

  // Close handlers
  const closeModal = () => {
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
    }
    modal.classList.add('hidden');
    // Re-render path view to update state icons
    window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'path' }));
  };

  backdrop.onclick = closeModal;

  // Render view depending on date
  renderModalContent(dateStr, content, closeModal);
}

function renderModalContent(dateStr, container, closeFn) {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const dayLog = getDay(dateStr);
  const profile = getProfile();

  // Helper date flags
  const isFuture = dateStr > todayStr;
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;

  // Premium friendly date formatting
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  let relativeLabel = "";
  if (dateStr === todayStr) {
    relativeLabel = "Today";
  } else if (dateStr === tomorrowStr) {
    relativeLabel = "Tomorrow";
  } else {
    const yesterdayDate = new Date(); yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) {
      relativeLabel = "Yesterday";
    }
  }

  const dateFormatted = `${dayNames[d.getUTCDay()]}, ${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const displayTitle = relativeLabel ? `${relativeLabel} &middot; ${dateFormatted}` : dateFormatted;

  // Base Modal Container Structure
  container.innerHTML = `
    <div class="modal-header-row">
      <span class="modal-date-title">📅 ${displayTitle}</span>
      <button class="btn-close" id="modal-close-btn">&times;</button>
    </div>
    <div id="modal-body-container" class="modal-body-scroll"></div>
  `;

  container.querySelector('#modal-close-btn').addEventListener('click', closeFn);
  const body = container.querySelector('#modal-body-container');

  // --- CASE 1: FUTURE PLANNER ---
  if (isFuture) {
    renderFuturePlanner(dateStr, dayLog, profile, body, closeFn);
  } 
  // --- CASE 2: TODAY ACTIVE DASHBOARD ---
  else if (isToday) {
    renderTodayDashboard(dateStr, dayLog, profile, body, closeFn);
  }
  // --- CASE 3: PAST REFLECTION & REVIEW ---
  else if (isPast) {
    renderPastReview(dateStr, dayLog, profile, body, closeFn);
  }
}

// FUTURE PLANNER RENDERING
function renderFuturePlanner(dateStr, dayLog, profile, container, closeFn) {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  container.innerHTML = `
    <div class="modal-section-info">
      <h3>📝 Intentional Planning</h3>
      <p class="hint">Plan your hour-by-hour goals. Align expectations with your predicted energy levels.</p>
    </div>

    <div class="modal-planner-grid">
      <!-- Input Panel -->
      <div class="modal-planner-panel card-3d">
        
        <!-- Day Presets Selector -->
        <h4 style="margin-top: 0;">📅 Full Day Presets</h4>
        <div class="modal-presets-row" style="margin-bottom: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-3d btn-xs preset-btn" data-preset="deepwork">💻 Deep Work</button>
          <button class="btn btn-secondary btn-3d btn-xs preset-btn" data-preset="study">📚 Study Marathon</button>
          <button class="btn btn-secondary btn-3d btn-xs preset-btn" data-preset="health">🏃 Balanced Health</button>
        </div>

        <h4>⚡ Quick Templates</h4>
        <div class="modal-templates-row">
          <button class="btn btn-secondary btn-3d btn-xs t-btn" data-title="Deep Coding" data-category="Work" data-duration="120" data-energy="high">💻 Code (2h)</button>
          <button class="btn btn-secondary btn-3d btn-xs t-btn" data-title="Study Session" data-category="Study" data-duration="90" data-energy="high">📚 Study (1.5h)</button>
          <button class="btn btn-secondary btn-3d btn-xs t-btn" data-title="Workout" data-category="Health" data-duration="60" data-energy="medium">🏃 Gym (1h)</button>
          <button class="btn btn-secondary btn-3d btn-xs t-btn" data-title="Sleep Block" data-category="Sleep" data-duration="480" data-energy="low">🛌 Sleep (8h)</button>
        </div>

        <form id="modal-block-form" class="modal-planner-form" style="margin-top:12px;">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" id="m-block-title" placeholder="e.g. Study Chemistry" required autocomplete="off">
          </div>
          <div class="form-row">
            <div class="form-group"><label>Start</label><input type="time" id="m-block-start" required></div>
            <div class="form-group"><label>End</label><input type="time" id="m-block-end" required></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select id="m-block-category" required>
                <option value="Study">📚 Study</option>
                <option value="Work">💻 Work</option>
                <option value="Sleep">🛌 Sleep</option>
                <option value="Health">🏃 Health</option>
                <option value="Leisure">🧘 Leisure</option>
                <option value="Admin">📧 Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Expected Energy</label>
              <select id="m-block-energy" required>
                <option value="high">🔥 High</option>
                <option value="medium">⚡ Med</option>
                <option value="low">💤 Low</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label>Difficulty Rating</label>
              <select id="m-block-difficulty" required>
                <option value="easy">⭐ Easy (+10 XP / +1 💎)</option>
                <option value="medium">⭐⭐ Medium (+20 XP / +2 💎)</option>
                <option value="hard">⭐⭐⭐ Hard (+30 XP / +3 💎)</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-3d btn-full btn-sm">Add Block</button>
        </form>
      </div>

      <!-- Schedule Timeline -->
      <div class="modal-planner-timeline">
        <div id="m-overlap-warning" class="warning-alert hidden">⚠️ Warning: Some blocks overlap in time.</div>
        <div id="m-buffer-warning" class="buffer-suggestion hidden" style="margin-bottom:10px; background:rgba(28,176,246,0.15); border:2px solid var(--duo-blue); padding:10px; border-radius:12px; font-size:11px; color:#ffffff; font-weight:600; text-align:center;">
          💡 Tip: Add a 10-15m buffer gap between back-to-back blocks to reduce fatigue.
        </div>
        <div id="m-timeline-list" class="timeline-list"></div>
        <div class="modal-commit-box">
          ${dayLog.isCommitted 
            ? `<div class="committed-banner">🔒 Schedule committed & locked.</div>` 
            : `<button id="m-commit-btn" class="btn btn-success btn-3d btn-full">✍️ Commit & Lock Schedule</button>`
          }
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#modal-block-form');
  const timeline = container.querySelector('#m-timeline-list');
  const overlapWarning = container.querySelector('#m-overlap-warning');
  const bufferWarning = container.querySelector('#m-buffer-warning');
  const commitBtn = container.querySelector('#m-commit-btn');
  
  let currentBlocks = [...dayLog.blocks];

  const renderList = () => {
    currentBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Overlaps & Gaps Check
    let overlap = false;
    let gapSuggestion = false;
    
    for (let i = 0; i < currentBlocks.length - 1; i++) {
      if (currentBlocks[i].endTime > currentBlocks[i+1].startTime) {
        overlap = true;
      }
      if (currentBlocks[i].endTime === currentBlocks[i+1].startTime) {
        // back-to-back blocks (except sleep)
        if (currentBlocks[i].category !== "Sleep" && currentBlocks[i+1].category !== "Sleep") {
          gapSuggestion = true;
        }
      }
    }
    
    overlap ? overlapWarning.classList.remove('hidden') : overlapWarning.classList.add('hidden');
    gapSuggestion ? bufferWarning.classList.remove('hidden') : bufferWarning.classList.add('hidden');

    if (currentBlocks.length === 0) {
      timeline.innerHTML = `<div class="empty-state"><p>Add tasks to build schedule.</p></div>`;
      if (commitBtn) commitBtn.disabled = true;
      return;
    }
    if (commitBtn) commitBtn.disabled = false;

    timeline.innerHTML = currentBlocks.map((b, idx) => {
      const diffStars = b.difficulty === 'hard' ? '⭐⭐⭐' : b.difficulty === 'medium' ? '⭐⭐' : '⭐';
      return `
        <div class="timeline-item">
          <div class="timeline-time">${b.startTime}<br>↓<br>${b.endTime}</div>
          <div class="timeline-content-card ${b.category.toLowerCase()}-category">
            <div style="flex:1;">
              <strong style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span>${b.title}</span>
                <span style="font-size:10px; opacity:0.85;">${diffStars}</span>
              </strong>
              <div style="font-size:10px; color:var(--text-secondary); margin-top:4px;">
                ${b.category} &middot; ${b.energy === 'high' ? '🔥' : b.energy === 'medium' ? '⚡' : '💤'} ${b.energy.toUpperCase()}
              </div>
            </div>
            ${!dayLog.isCommitted ? `<button class="delete-block-btn m-del-btn" data-index="${idx}">&times;</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    timeline.querySelectorAll('.m-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-index'));
        currentBlocks.splice(i, 1);
        dayLog.blocks = currentBlocks;
        saveDay(dateStr, dayLog);
        renderList();
      });
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (dayLog.isCommitted) return;

    const title = container.querySelector('#m-block-title').value;
    const startTime = container.querySelector('#m-block-start').value;
    const endTime = container.querySelector('#m-block-end').value;
    const category = container.querySelector('#m-block-category').value;
    const energy = container.querySelector('#m-block-energy').value;
    const difficulty = container.querySelector('#m-block-difficulty').value;

    if (startTime >= endTime) {
      alert("End time must be after start time.");
      return;
    }

    currentBlocks.push({
      id: Math.random().toString(36).substring(2, 9),
      startTime, endTime, title, category, energy, difficulty, status: 'pending'
    });
    dayLog.blocks = currentBlocks;
    saveDay(dateStr, dayLog);
    renderList();

    container.querySelector('#m-block-title').value = '';
    container.querySelector('#m-block-title').focus();
  });

  // Dynamic Day presets loaders
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (dayLog.isCommitted) return;
      const type = btn.getAttribute('data-preset');
      const mockBlocks = PRESETS[type] || [];
      currentBlocks = mockBlocks.map(b => ({
        ...b,
        id: Math.random().toString(36).substring(2, 9)
      }));
      dayLog.blocks = currentBlocks;
      saveDay(dateStr, dayLog);
      renderList();
    });
  });

  // Templates
  container.querySelectorAll('.t-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (dayLog.isCommitted) return;
      const title = btn.getAttribute('data-title');
      const category = btn.getAttribute('data-category');
      const duration = parseInt(btn.getAttribute('data-duration'));
      const energy = btn.getAttribute('data-energy');

      let sh = 8, sm = 0;
      if (currentBlocks.length > 0) {
        currentBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
        const last = currentBlocks[currentBlocks.length - 1];
        const pts = last.endTime.split(':').map(Number);
        sh = pts[0]; sm = pts[1] + 5;
        if (sm >= 60) { sh = (sh + 1) % 24; sm %= 60; }
      }

      let eh = sh + Math.floor((sm + duration) / 60);
      let em = (sm + duration) % 60;
      eh = eh % 24;

      const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      currentBlocks.push({
        id: Math.random().toString(36).substring(2, 9),
        startTime: fmt(sh, sm), endTime: fmt(eh, em), title, category, energy, difficulty: 'easy', status: 'pending'
      });
      dayLog.blocks = currentBlocks;
      saveDay(dateStr, dayLog);
      renderList();
    });
  });

  if (commitBtn) {
    commitBtn.addEventListener('click', async () => {
      if (currentBlocks.length === 0) return;
      const yes = await showConfirm("Lock and Commit this schedule? Next reward: +1 💎.");
      if (yes) {
        dayLog.isCommitted = true;
        saveDay(dateStr, dayLog);
        profile.lastPlanDate = dateStr;
        profile.diamonds += 1;

        // Apply Evening Planning bonus (+20 XP, +2 💎) if planning for tomorrow before 10 PM
        let bonusActive = false;
        if (dateStr === tomorrowStr) {
          const hours = new Date().getHours();
          if (hours < 22) { // Before 10 PM
            bonusActive = true;
            profile.diamonds += 2;
          }
        }

        saveProfile(profile);
        
        if (bonusActive) {
          addXp(20);
          alert("🌅 Night Owl Planner! Schedule committed before 10 PM tomorrow: +20 XP & +3 💎 total!");
        } else {
          alert("✍️ Committed! +1 💎 collected.");
        }
        
        closeFn();
      }
    });
  }

  renderList();
}

// TODAY ACTIVE DASHBOARD RENDERING
function renderTodayDashboard(dateStr, dayLog, profile, container, closeFn) {
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const blocks = [...dayLog.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  let activeBlock = null;
  let nextBlock = null;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (currentHM >= b.startTime && currentHM < b.endTime && b.status === 'pending') {
      activeBlock = b;
      nextBlock = blocks[i+1] || null;
      break;
    }
  }
  if (!activeBlock) {
    nextBlock = blocks.find(b => b.startTime > currentHM && b.status === 'pending') || null;
  }

  container.innerHTML = `
    <!-- Top Countdown Panel -->
    <div class="card card-3d today-active-timer-panel">
      ${activeBlock ? `
        <span class="focus-badge pulse">ACTIVE FOCUS NOW</span>
        <h2>${activeBlock.title}</h2>
        <span class="tag-category">${activeBlock.category}</span>
        
        <div class="focus-timer-display" id="m-timer-val">--:--</div>
        
        <div class="focus-actions">
          <button id="m-complete-btn" class="btn btn-success btn-3d btn-full">✅ Complete Block</button>
          <button id="m-miss-btn" class="btn btn-danger btn-3d btn-full">❌ Diverged (Missed)</button>
        </div>
      ` : `
        <div class="owl-sleeping">🦉💤</div>
        <h3>No active focus block right now.</h3>
        ${nextBlock ? `<p>Next task: <strong>${nextBlock.title}</strong> at ${nextBlock.startTime}</p>` : `<p>All schedule blocks complete or none planned!</p>`}
      `}
    </div>

    <!-- Timeline List with direct checks -->
    <div class="card card-3d today-schedule-check-card">
      <h3>📅 Day Schedule & Progress</h3>
      <p class="hint">Check off hourly slots as the day goes by.</p>
      
      <div class="today-checks-list" id="m-today-checklist">
        ${blocks.length === 0 ? `
          <div class="empty-state">
            <p>Schedule is empty. You did not plan today.</p>
            <button id="quick-plan-today-btn" class="btn btn-primary btn-3d btn-sm btn-full">Create Plan Now</button>
          </div>
        ` : blocks.map((b, idx) => {
          let statusLabel = '⏳ Pending';
          let borderClass = 'pending-border';
          if (b.status === 'completed') {
            statusLabel = '✅ Completed';
            borderClass = 'success-border';
          } else if (b.status === 'missed') {
            statusLabel = `❌ Miss: ${b.missReason || 'Diverged'}`;
            borderClass = 'danger-border';
          } else if (b.status === 'shifted') {
            statusLabel = '🔄 Shifted';
            borderClass = 'warning-border';
          }

          return `
            <div class="today-check-item ${borderClass}">
              <div class="check-item-time">${b.startTime} - ${b.endTime}</div>
              <div class="check-item-details">
                <strong>${b.title}</strong>
                <span>${b.category}</span>
              </div>
              <div class="check-item-controls">
                ${b.status === 'pending' ? `
                  <button class="btn btn-success btn-3d btn-xs inline-complete-btn" data-index="${idx}">✅</button>
                  <button class="btn btn-danger btn-3d btn-xs inline-miss-btn" data-index="${idx}">❌</button>
                ` : `
                  <span class="status-indicator-tag">${statusLabel}</span>
                  ${!dayLog.isReviewed ? `<button class="btn btn-secondary btn-3d btn-xs inline-reset-btn" data-index="${idx}">🔄 Reset</button>` : ''}
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="today-review-submit-box">
        ${blocks.length > 0 && !dayLog.isReviewed ? `
          <button id="m-today-lock-review-btn" class="btn btn-success btn-3d btn-full btn-lg">🔒 Sign & Lock Day Review</button>
        ` : dayLog.isReviewed ? `
          <div class="committed-banner">🎉 Today fully reviewed! Streak secured.</div>
        ` : ''}
      </div>
    </div>
  `;

  // Start active countdown
  if (activeBlock) {
    const display = container.querySelector('#m-timer-val');
    const update = () => {
      const rightNow = new Date();
      const currHM = `${String(rightNow.getHours()).padStart(2, '0')}:${String(rightNow.getMinutes()).padStart(2, '0')}`;
      
      if (currHM >= activeBlock.endTime) {
        clearInterval(activeTimerInterval);
        renderTodayDashboard(dateStr, dayLog, profile, container, closeFn); // reload UI
        return;
      }

      const [eh, em] = activeBlock.endTime.split(':').map(Number);
      const eDate = new Date();
      eDate.setHours(eh, em, 0, 0);

      const diff = eDate - rightNow;
      if (diff <= 0) {
        display.textContent = "00:00";
        clearInterval(activeTimerInterval);
        renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    update();
    activeTimerInterval = setInterval(update, 1000);

    // Countdown buttons
    container.querySelector('#m-complete-btn').addEventListener('click', () => {
      handleCompleteBlock(activeBlock, dateStr, dayLog, profile, container, closeFn);
    });

    container.querySelector('#m-miss-btn').addEventListener('click', () => {
      promptMissedFlow(activeBlock, dateStr, dayLog, profile, container, closeFn);
    });
  }

  // Quick plan button
  const quickPlanBtn = container.querySelector('#quick-plan-today-btn');
  if (quickPlanBtn) {
    quickPlanBtn.addEventListener('click', () => {
      dayLog.isCommitted = false;
      saveDay(dateStr, dayLog);
      renderModalContent(dateStr, document.getElementById('day-modal-content'), closeFn);
    });
  }

  // Inline Actions
  container.querySelectorAll('.inline-complete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const block = blocks[idx];
      handleCompleteBlock(block, dateStr, dayLog, profile, container, closeFn);
    });
  });

  container.querySelectorAll('.inline-miss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const block = blocks[idx];
      promptMissedFlow(block, dateStr, dayLog, profile, container, closeFn);
    });
  });

  container.querySelectorAll('.inline-reset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      blocks[idx].status = 'pending';
      dayLog.blocks = blocks;
      saveDay(dateStr, dayLog);
      renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
    });
  });

  // Lock review
  const lockBtn = container.querySelector('#m-today-lock-review-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      const pending = blocks.some(b => b.status === 'pending');
      if (pending) {
        alert("Please mark all blocks as Completed or Missed first.");
        return;
      }
      
      // Perform review closure
      dayLog.isReviewed = true;
      saveDay(dateStr, dayLog);

      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const p = getProfile();

      if (p.lastReviewDate === yesterdayStr) {
        p.streak += 1;
      } else if (p.lastReviewDate === dateStr) {
        // do nothing
      } else {
        if (p.streakFreezeActive) {
          p.streakFreezeActive = false;
          // streak remains protected (does not reset to 1, stays at its current value)
          showToast("❄️ Streak Freeze consumed to protect your streak!", "info");
        } else {
          p.streak = 1;
        }
      }

      p.lastReviewDate = dateStr;
      p.diamonds += 1; // standard reward

      // Milestones check
      let claimMilestone = false;
      let rewardAmt = 0;
      let milestoneKey = `streak_${p.streak}`;
      if ([7, 15, 30].includes(p.streak) && !p.milestonesClaimed.includes(milestoneKey)) {
        claimMilestone = true;
        p.milestonesClaimed.push(milestoneKey);
        rewardAmt = p.streak === 7 ? 10 : p.streak === 15 ? 25 : 50;
        p.diamonds += rewardAmt;
      }

      // Check highest streak record
      if (p.streak > p.highestStreak) {
        p.highestStreak = p.streak;
      }

      saveProfile(p);
      calculateMilitaryRank();

      if (claimMilestone) {
        alert(`🏆 MILESTONE REACHED! You earned +${rewardAmt} 💎 for a ${p.streak}-Day streak!`);
      }
      
      triggerEODRecap(dateStr, closeFn);
    });
  }
}

// PAST REVIEW RENDERING
function renderPastReview(dateStr, dayLog, profile, container, closeFn) {
  const blocks = [...dayLog.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // If day was skipped completely (not committed)
  if (!dayLog.isCommitted) {
    container.innerHTML = `
      <div class="card card-3d skipped-day-warning">
        <span class="owl-sleeping">💀</span>
        <h3>This day was skipped!</h3>
        <p>You did not plan or log schedules on ${dateStr}.</p>
        <p class="hint">Skipped days break your streak. To fix a broken streak, visit the Shop to buy a <strong>Streak Repair Kit</strong>.</p>
        <button id="modal-close-skip-btn" class="btn btn-secondary btn-3d btn-full">Close Details</button>
      </div>
    `;
    container.querySelector('#modal-close-skip-btn').addEventListener('click', closeFn);
    return;
  }

  container.innerHTML = `
    <div class="card card-3d">
      <h3>📅 Reviewing Past Schedule: ${dateStr}</h3>
      <p class="hint">Mark all tasks completed or missed to lock this review and secure your streak.</p>
      
      <div class="today-checks-list" id="m-past-checklist">
        ${blocks.map((b, idx) => {
          let statusLabel = '⏳ Pending';
          let borderClass = 'pending-border';
          if (b.status === 'completed') {
            statusLabel = '✅ Completed';
            borderClass = 'success-border';
          } else if (b.status === 'missed') {
            statusLabel = `❌ Miss: ${b.missReason || 'Diverged'}`;
            borderClass = 'danger-border';
          } else if (b.status === 'shifted') {
            statusLabel = '🔄 Shifted';
            borderClass = 'warning-border';
          }

          return `
            <div class="today-check-item ${borderClass}">
              <div class="check-item-time">${b.startTime} - ${b.endTime}</div>
              <div class="check-item-details">
                <strong>${b.title}</strong>
                <span>${b.category}</span>
              </div>
              <div class="check-item-controls">
                ${b.status === 'pending' ? `
                  <button class="btn btn-success btn-3d btn-xs inline-past-complete" data-index="${idx}">✅</button>
                  <button class="btn btn-danger btn-3d btn-xs inline-past-miss" data-index="${idx}">❌</button>
                ` : `
                  <span class="status-indicator-tag">${statusLabel}</span>
                  ${!dayLog.isReviewed ? `<button class="btn btn-secondary btn-3d btn-xs inline-past-reset" data-index="${idx}">🔄</button>` : ''}
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="today-review-submit-box">
        ${!dayLog.isReviewed ? `
          <button id="m-past-lock-review-btn" class="btn btn-success btn-3d btn-full btn-lg">🔒 Submit & Lock Reflection</button>
        ` : `
          <div class="committed-banner">🎉 Day reviewed and locked.</div>
        `}
      </div>
    </div>
  `;

  // Inline Handlers for Past logs
  container.querySelectorAll('.inline-past-complete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const block = blocks[idx];
      block.status = 'completed';
      dayLog.blocks = blocks;
      saveDay(dateStr, dayLog);

      const diff = block.difficulty || 'easy';
      const baseXP = diff === 'hard' ? 30 : diff === 'medium' ? 20 : 10;
      const baseGems = diff === 'hard' ? 3 : diff === 'medium' ? 2 : 1;

      const p = getProfile();
      p.diamonds += baseGems;
      saveProfile(p);
      addXp(baseXP);

      renderPastReview(dateStr, dayLog, profile, container, closeFn);
      playSuccessSound();
    });
  });

  container.querySelectorAll('.inline-past-miss').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const block = blocks[idx];
      promptPastMissedFlow(block, idx, dateStr, dayLog, profile, container, closeFn);
    });
  });

  container.querySelectorAll('.inline-past-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      blocks[idx].status = 'pending';
      dayLog.blocks = blocks;
      saveDay(dateStr, dayLog);
      renderPastReview(dateStr, dayLog, profile, container, closeFn);
    });
  });

  const lockBtn = container.querySelector('#m-past-lock-review-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      const pending = blocks.some(b => b.status === 'pending');
      if (pending) {
        alert("Please mark all blocks as Completed or Missed.");
        return;
      }
      
      dayLog.isReviewed = true;
      saveDay(dateStr, dayLog);

      const p = getProfile();
      p.diamonds += 1;
      
      // Update streak if reviewed sequentially
      const yesterdayStr = new Date(new Date(dateStr + 'T00:00:00Z').getTime() - 86400000).toISOString().split('T')[0];
      if (p.lastReviewDate === yesterdayStr) {
        p.streak += 1;
      } else {
        // fresh streak start
        p.streak = 1;
      }
      p.lastReviewDate = dateStr;
      saveProfile(p);
      calculateMilitaryRank();

      alert(`🎉 Past day review completed. Streak: ${p.streak}. +1 💎 awarded.`);
      closeFn();
    });
  }
}

// CORE HELPERS: COMPLETE & MISS FLOWS
function handleCompleteBlock(block, dateStr, dayLog, profile, container, closeFn) {
  playSuccessSound();
  block.status = 'completed';
  block.loggedAt = new Date().toISOString();

  // Check morning bonus activation
  const [sh] = block.startTime.split(':').map(Number);
  const isMorning = sh < 12;
  let morningActivatedNow = false;

  if (isMorning && !dayLog.morningBonusActive) {
    dayLog.morningBonusActive = true;
    morningActivatedNow = true;
  }

  saveDay(dateStr, dayLog);

  // Rewards calculation
  const diff = block.difficulty || 'easy';
  const baseXP = diff === 'hard' ? 30 : diff === 'medium' ? 20 : 10;
  const baseGems = diff === 'hard' ? 3 : diff === 'medium' ? 2 : 1;

  const xpMult = dayLog.morningBonusActive ? 2 : 1;
  const xpReward = baseXP * xpMult;

  profile.diamonds += baseGems;
  saveProfile(profile);

  // Add XP
  addXp(xpReward);

  // Briefly render reward screen inside container
  container.innerHTML = `
    <div class="success-celebration">
      <div class="sparkle-fireworks">✨💎✨</div>
      <h2>Awesome Completion!</h2>
      <p>You stayed focused and honestly checked in.</p>
      <div class="diamond-earn-popup">+${xpReward} XP & +${baseGems} 💎 Earned!</div>
      ${morningActivatedNow ? `<div style="color:var(--duo-blue); font-weight:bold; margin-top:8px;">☀️ Morning Bonus Active! Double XP for rest of today!</div>` : ''}
    </div>
  `;

  setTimeout(() => {
    renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
  }, 1500);
}

function promptMissedFlow(block, dateStr, dayLog, profile, container, closeFn) {
  playPivotSound();
  const reasons = getCustomReasons();

  container.innerHTML = `
    <div class="card card-3d">
      <span class="emoji-checkin">🧘</span>
      <h2>Pivot & Focus</h2>
      <p>No pressure. Why did you diverge from this task?</p>
      <h3 class="modal-task-title">"${block.title}"</h3>
      
      <div class="reasons-list-lock">
        ${reasons.map(r => `<button class="btn btn-secondary btn-3d reason-opt-btn" data-reason="${r}">${r}</button>`).join('')}
      </div>
      <p class="hint">Select a reason to unlock schedule shift pivot controls.</p>
    </div>
  `;

  container.querySelectorAll('.reason-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.getAttribute('data-reason');
      block.status = 'missed';
      block.missReason = r;
      block.loggedAt = new Date().toISOString();
      saveDay(dateStr, dayLog);

      // Award 1 diamond honesty bonus
      profile.diamonds += 1;
      saveProfile(profile);
      playPivotSound();

      // Show proactive pivot choice
      promptProactivePivot(block, dateStr, dayLog, profile, container, closeFn);
    });
  });
}

function promptProactivePivot(block, dateStr, dayLog, profile, container, closeFn) {
  container.innerHTML = `
    <div class="card card-3d">
      <span class="emoji-checkin">🔄</span>
      <h2>Proactive Pivot</h2>
      <p>Honest log registered. You earned <strong>+1 💎 Honesty Reward</strong>!</p>
      <p class="hint">How would you like to adapt the remaining schedule today?</p>
      
      <div class="pivot-actions-grid" style="margin-top:20px;">
        <button id="p-shift-30" class="btn btn-primary btn-3d btn-full">⏰ Shift remaining 30 mins</button>
        <button id="p-shift-60" class="btn btn-primary btn-3d btn-full">⏰ Shift remaining 60 mins</button>
        <button id="p-tomorrow" class="btn btn-secondary btn-3d btn-full">📅 Push remaining to tomorrow</button>
        <button id="p-keep" class="btn btn-danger btn-3d btn-full">🙅 Keep schedule as-is</button>
      </div>
    </div>
  `;

  const remainingShift = (mins) => {
    dayLog.blocks.forEach(b => {
      if (b.status === 'pending' && b.id !== block.id) {
        b.status = 'shifted';
        const [sh, sm] = b.startTime.split(':').map(Number);
        const sDate = new Date(); sDate.setHours(sh, sm + mins);
        b.startTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;

        const [eh, em] = b.endTime.split(':').map(Number);
        const eDate = new Date(); eDate.setHours(eh, em + mins);
        b.endTime = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;
      }
    });
    saveDay(dateStr, dayLog);
    alert(`Remaining schedule shifted by ${mins}m.`);
    renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
  };

  container.querySelector('#p-shift-30').onclick = () => remainingShift(30);
  container.querySelector('#p-shift-60').onclick = () => remainingShift(60);
  
  container.querySelector('#p-tomorrow').onclick = () => {
    const tomStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tomLog = getDay(tomStr);
    
    const rem = dayLog.blocks.filter(b => b.status === 'pending' && b.id !== block.id);
    dayLog.blocks = dayLog.blocks.filter(b => b.status !== 'pending' || b.id === block.id);

    tomLog.blocks.push(...rem.map(b => ({ ...b, status: 'pending' })));
    saveDay(dateStr, dayLog);
    saveDay(tomStr, tomLog);

    alert("Remaining blocks pushed to tomorrow.");
    renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
  };

  container.querySelector('#p-keep').onclick = () => {
    renderTodayDashboard(dateStr, dayLog, profile, container, closeFn);
  };
}

// Past miss prompt helper
function promptPastMissedFlow(block, idx, dateStr, dayLog, profile, container, closeFn) {
  playPivotSound();
  const reasons = getCustomReasons();

  container.innerHTML = `
    <div class="card card-3d">
      <span class="emoji-checkin">🧘</span>
      <h3>Why did you miss this task?</h3>
      <h4 class="modal-task-title">"${block.title}"</h4>
      <div class="reasons-list-lock">
        ${reasons.map(r => `<button class="btn btn-secondary btn-3d reason-past-opt" data-reason="${r}">${r}</button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.reason-past-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      block.status = 'missed';
      block.missReason = btn.getAttribute('data-reason');
      dayLog.blocks[idx] = block;
      saveDay(dateStr, dayLog);
      
      // Honesty award
      profile.diamonds += 1;
      saveProfile(profile);

      renderPastReview(dateStr, dayLog, profile, container, closeFn);
    });
  });
}
