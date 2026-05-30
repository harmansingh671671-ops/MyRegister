// Modules/reflection.js
import { getDay, saveDay, getProfile, saveProfile, getCustomReasons, addCustomReason, removeCustomReason, exportJSON, importJSON } from './storage.js';
import { playSuccessSound, playPivotSound, playUnlockSound, showConfirm } from './notifications.js';

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDateStr() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export function renderReflection(container) {
  const todayStr = getTodayDateStr();
  const dayLog = getDay(todayStr);
  const profile = getProfile();

  // Load custom reasons
  const customReasons = getCustomReasons();

  container.innerHTML = `
    <div class="view-header">
      <h2>🦉 Evening Reflection Ritual</h2>
      <p class="subtitle">Confirm what actually happened today. Honesty builds awareness.</p>
    </div>

    <div class="reflection-layout">
      <!-- Left Column: Settings, Data Backup, and Custom Reasons -->
      <div class="reflection-sidebar">
        <div class="card card-3d">
          <h3>📂 Control Your Data</h3>
          <p class="hint">Export your logs to a JSON file or restore a backup. Your data never leaves your device.</p>
          <div class="backup-actions">
            <button id="export-data-btn" class="btn btn-secondary btn-3d btn-full">⬇️ Export Backup (JSON)</button>
            
            <div class="import-wrapper">
              <label for="import-file-input" class="btn btn-secondary btn-3d btn-full btn-import-label">⬆️ Import Backup</label>
              <input type="file" id="import-file-input" accept=".json" style="display: none;">
            </div>

            <button id="clear-data-btn" class="btn btn-danger btn-3d btn-full btn-sm">🗑️ Wipe All Local Data</button>
          </div>
        </div>

        <div class="card card-3d">
          <h3>⚙️ Customize Miss Reasons</h3>
          <p class="hint">Create personal options for why blocks get missed.</p>
          <div class="custom-reasons-manager">
            <ul id="reasons-list-ui" class="reasons-list-ui">
              <!-- Rendered via JS -->
            </ul>
            <form id="add-reason-form" class="add-reason-form">
              <input type="text" id="new-reason-input" placeholder="e.g. 🥱 Low motivation" required autocomplete="off">
              <button type="submit" class="btn btn-primary btn-3d">Add</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Right Column: Swipe/Review Timeline -->
      <div class="reflection-main">
        <div class="card card-3d reflection-timeline-card">
          <h3>📅 Review Tasks for ${todayStr}</h3>
          
          <div id="reflection-timeline-list" class="reflection-timeline-list">
            <!-- Items injected here -->
          </div>

          <div class="reflection-actions">
            ${dayLog.isReviewed 
              ? `<div class="reviewed-banner">🎉 Day completed and reviewed! Streak preserved.</div>` 
              : `<button id="submit-review-btn" class="btn btn-success btn-3d btn-lg btn-full">🔒 Submit Day Review</button>`
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Milestone Celebration Overlay -->
    <div id="celebration-overlay" class="fullscreen-modal hidden">
      <div class="modal-backdrop"></div>
      <div class="celebration-card card-3d animate-pop">
        <div class="flame-effect">🔥</div>
        <h2 id="celebration-title">7-Day Streak!</h2>
        <p id="celebration-desc">You are building a massive habit of daily reflection.</p>
        <div class="celebration-reward" id="celebration-reward-val">+10 💎</div>
        <button id="close-celebration-btn" class="btn btn-success btn-3d">Let's Go!</button>
      </div>
    </div>
  `;

  const timelineList = container.querySelector('#reflection-timeline-list');
  const reasonsListUi = container.querySelector('#reasons-list-ui');
  const addReasonForm = container.querySelector('#add-reason-form');
  const submitReviewBtn = container.querySelector('#submit-review-btn');

  // Renders the list of custom reasons with delete triggers
  function renderReasonsList() {
    const list = getCustomReasons();
    reasonsListUi.innerHTML = list.map(r => `
      <li>
        <span>${r}</span>
        <button class="delete-reason-btn" data-reason="${r}">&times;</button>
      </li>
    `).join('');

    reasonsListUi.querySelectorAll('.delete-reason-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = btn.getAttribute('data-reason');
        removeCustomReason(r);
        renderReasonsList();
      });
    });
  }

  addReasonForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = container.querySelector('#new-reason-input');
    const val = input.value;
    if (addCustomReason(val)) {
      input.value = '';
      renderReasonsList();
    }
  });

  // Local state of blocks for review
  let blocks = [...dayLog.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  function renderReviewBlocks() {
    if (blocks.length === 0) {
      timelineList.innerHTML = `
        <div class="empty-state">
          <p>No tasks scheduled today to review.</p>
        </div>
      `;
      if (submitReviewBtn) submitReviewBtn.disabled = true;
      return;
    }

    timelineList.innerHTML = blocks.map((block, index) => {
      let cardClass = 'status-pending';
      let actionButtons = '';

      if (block.status === 'completed') {
        cardClass = 'status-completed';
      } else if (block.status === 'missed') {
        cardClass = 'status-missed';
      } else if (block.status === 'shifted') {
        cardClass = 'status-shifted';
      }

      if (!dayLog.isReviewed) {
        actionButtons = `
          <div class="review-row-actions">
            <button class="btn btn-success btn-3d btn-sm mark-row-complete" data-index="${index}">✅ Got it Done</button>
            <button class="btn btn-danger btn-3d btn-sm mark-row-miss" data-index="${index}">❌ Missed / Off-task</button>
          </div>
        `;
      }

      return `
        <div class="reflection-row-card card-3d ${cardClass}">
          <div class="reflection-row-header">
            <span class="row-time">${block.startTime} - ${block.endTime}</span>
            <span class="row-title">${block.title}</span>
            <span class="row-badge">${block.status.toUpperCase()}</span>
          </div>
          
          ${block.status === 'missed' ? `
            <div class="row-reason-box">
              <strong>Reason:</strong> ${block.missReason || 'Not logged yet'}
              ${!dayLog.isReviewed ? `<button class="btn btn-secondary btn-3d btn-xs edit-row-reason" data-index="${index}">✍️ Change</button>` : ''}
            </div>
          ` : ''}

          ${actionButtons}
        </div>
      `;
    }).join('');

    // Attach row button listeners
    if (!dayLog.isReviewed) {
      timelineList.querySelectorAll('.mark-row-complete').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'));
          blocks[idx].status = 'completed';
          blocks[idx].loggedAt = new Date().toISOString();
          saveDayLog();
        });
      });

      timelineList.querySelectorAll('.mark-row-miss').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'));
          promptReasonForBlock(idx);
        });
      });

      timelineList.querySelectorAll('.edit-row-reason').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'));
          promptReasonForBlock(idx);
        });
      });
    }
  }

  function promptReasonForBlock(idx) {
    const block = blocks[idx];
    const reasons = getCustomReasons();
    
    // Renders custom reasons dynamically into the row card
    const containerRow = timelineList.children[idx];
    containerRow.innerHTML = `
      <div class="reflection-row-header">
        <span class="row-time">${block.startTime} - ${block.endTime}</span>
        <span class="row-title">${block.title}</span>
        <span class="row-badge">SELECT REASON (STEP-LOCK)</span>
      </div>
      <div class="reasons-selection-flow">
        <p class="hint">Why did you diverge?</p>
        <div class="reasons-grid-sm">
          ${reasons.map(r => `
            <button class="btn btn-secondary btn-3d btn-sm select-reason-item" data-reason="${r}">${r}</button>
          `).join('')}
        </div>
      </div>
    `;

    containerRow.querySelectorAll('.select-reason-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const reason = btn.getAttribute('data-reason');
        blocks[idx].status = 'missed';
        blocks[idx].missReason = reason;
        blocks[idx].loggedAt = new Date().toISOString();
        saveDayLog();
      });
    });
  }

  function saveDayLog() {
    dayLog.blocks = blocks;
    saveDay(todayStr, dayLog);
    renderReviewBlocks();
  }

  // Submit day review
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', () => {
      // Check if all blocks are reviewed (no 'pending' status)
      const hasPending = blocks.some(b => b.status === 'pending');
      if (hasPending) {
        alert("Please mark all blocks as Completed or Missed before locking the day review.");
        return;
      }

      // Lock review
      dayLog.isReviewed = true;
      saveDay(todayStr, dayLog);

      // --- STREAK UPDATE MECHANICS ---
      const yesterdayStr = getYesterdayDateStr();
      const yesterdayLog = getDay(yesterdayStr);
      
      const p = getProfile();
      
      // Streak rules:
      // If lastReviewDate was yesterday, increment streak.
      // If lastReviewDate was today, ignore (already updated).
      // Otherwise, reset streak to 1 (starting fresh) unless streakFreezeActive is active.
      if (p.lastReviewDate === yesterdayStr) {
        p.streak += 1;
      } else if (p.lastReviewDate === todayStr) {
        // already reviewed today, keep streak as-is
      } else {
        // Streak broken
        if (p.streakFreezeActive) {
          p.streakFreezeActive = false; // consume freeze
          p.streak += 1; // save streak
          alert("❄️ Streak Freeze consumed! Your streak has been protected.");
        } else {
          p.streak = 1; // start new streak
        }
      }

      p.lastReviewDate = todayStr;
      
      // Earn 1 Diamond for completing the evening review
      p.diamonds += 1;

      // Check milestones
      let triggerMilestone = false;
      let milestoneTitle = "";
      let milestoneDesc = "";
      let milestoneReward = 0;
      let milestoneKey = `streak_${p.streak}`;

      if ([7, 15, 30].includes(p.streak) && !p.milestonesClaimed.includes(milestoneKey)) {
        triggerMilestone = true;
        p.milestonesClaimed.push(milestoneKey);
        
        if (p.streak === 7) {
          milestoneTitle = "7-Day Streak! 🎯";
          milestoneDesc = "Consistency master! You reviewed your schedule every day for a week.";
          milestoneReward = 10;
        } else if (p.streak === 15) {
          milestoneTitle = "15-Day Streak! 🚀";
          milestoneDesc = "Unstoppable integrity! Two full weeks of scheduling and reflecting.";
          milestoneReward = 25;
        } else if (p.streak === 30) {
          milestoneTitle = "30-Day Streak! 👑";
          milestoneDesc = "Life-changing alignment! One month of full self-awareness.";
          milestoneReward = 50;
        }
        
        p.diamonds += milestoneReward;
      }

      saveProfile(p);

      if (triggerMilestone) {
        showCelebration(milestoneTitle, milestoneDesc, milestoneReward);
      } else {
        alert("🎉 Review locked! You earned +1 💎. Keep up the honest alignment!");
        window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'dashboard' }));
      }
    });
  }

  // Milestone Celebration Overlay Logic
  const overlay = container.querySelector('#celebration-overlay');
  function showCelebration(title, desc, reward) {
    playUnlockSound();
    container.querySelector('#celebration-title').textContent = title;
    container.querySelector('#celebration-desc').textContent = desc;
    container.querySelector('#celebration-reward-val').textContent = `+${reward} 💎`;
    overlay.classList.remove('hidden');

    container.querySelector('#close-celebration-btn').addEventListener('click', () => {
      overlay.classList.add('hidden');
      window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'dashboard' }));
    });
  }

  // --- DATA BACKUP TRIGGERS ---
  container.querySelector('#export-data-btn').addEventListener('click', () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = container.querySelector('#import-file-input');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imported = importJSON(evt.target.result);
      if (imported) {
        alert("✅ Data imported successfully! App is reloading...");
      } else {
        alert("❌ Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  });

  container.querySelector('#clear-data-btn').addEventListener('click', async () => {
    const yes = await showConfirm("⚠️ WARNING: This will permanently wipe all your schedules, streak records, shop purchases, and custom reasons. This action cannot be undone! Are you absolutely sure?");
    if (yes) {
      localStorage.clear();
      window.location.reload();
    }
  });

  // Initial loads
  renderReasonsList();
  renderReviewBlocks();
}
