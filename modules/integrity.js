// Modules/integrity.js
import { getProfile, saveProfile, getDay, saveDay } from './storage.js';
import { addXp } from './gamification.js';
import { playSuccessSound, playPivotSound, showToast } from './notifications.js';

let activeFocusInterval = null;
let visibilityHandler = null;

export function renderIntegrityPanel(container) {
  const profile = getProfile();
  
  // Outer Container
  container.innerHTML = `
    <div class="integrity-simulator-card card-3d">
      <div class="integrity-header">
        <h3>🤖 Device Integrity & Sensor Simulator</h3>
        <p class="hint">Simulate native Android background checks (UsageStatsManager, Pedometer, AlarmClock) directly in the browser preview.</p>
      </div>

      <!-- Grid of simulators -->
      <div class="integrity-grid">
        
        <!-- 1. Screen-Off / Focus Timer -->
        <div class="integrity-subcard card-3d" id="focus-sim-box">
          <h4>📴 Screen-Off Focus Session</h4>
          <p class="hint">Simulates locking your phone during task hours. Keep this tab active. Switching tabs violates the contract!</p>
          <div class="sim-timer-display" id="sim-timer-val">00:15</div>
          <button class="btn btn-primary btn-3d btn-full btn-sm" id="start-focus-sim-btn">Start 15s Focus</button>
        </div>

        <!-- 2. Step Goal Sync -->
        <div class="integrity-subcard card-3d">
          <h4>🏃 Fitness Step Sync</h4>
          <p class="hint">Mock step data retrieved from Google Fit / Samsung Health.</p>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <input type="number" id="sim-steps-input" value="8200" style="flex:1; width:50px; text-align:center;" placeholder="Steps">
            <button class="btn btn-secondary btn-3d btn-sm" id="sync-steps-btn">Sync Steps</button>
          </div>
          <p class="hint" style="margin-top:5px; font-size:10px; color:var(--text-hint);">Target: 5k (+10 XP) | 10k (+25 XP, +2 💎)</p>
        </div>

        <!-- 3. Morning Alarm check -->
        <div class="integrity-subcard card-3d">
          <h4>🌅 Alarm Wake-Up Check</h4>
          <p class="hint">Simulates opening the app within 30 minutes of waking up.</p>
          <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span>Alarm set: 07:00 AM</span>
              <span>Checked in: 07:04 AM</span>
            </div>
            <button class="btn btn-secondary btn-3d btn-full btn-xs" id="check-alarm-btn">Verify Alarm Alignment</button>
          </div>
        </div>

      </div>

      <hr class="mascot-divider">

      <!-- Violation Log -->
      <div class="violation-log-box">
        <h4>📋 Integrity Violation Diary</h4>
        <p class="hint">A private list of detected schedule violations, used to optimize focus blocks.</p>
        <div class="violation-table-wrapper">
          <table class="violation-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Task / Context</th>
                <th>Detected Issue</th>
              </tr>
            </thead>
            <tbody id="violation-log-rows">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Bind focus session
  const startBtn = container.querySelector('#start-focus-sim-btn');
  startBtn.onclick = () => {
    startFocusSession(container);
  };

  // Bind steps
  container.querySelector('#sync-steps-btn').onclick = () => {
    const inputVal = parseInt(container.querySelector('#sim-steps-input').value) || 0;
    
    if (inputVal >= 10000) {
      addXp(25);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = getDay(todayStr);
      todayLog.stepBonusDiamonds = 2;
      saveDay(todayStr, todayLog);
      
      playSuccessSound();
      showToast("Step goal crushed! +25 XP (+2 💎 yet to credit)", "success");
    } else if (inputVal >= 5000) {
      addXp(10);
      playSuccessSound();
      showToast("Health milestone reached! +10 XP awarded.", "success");
    } else {
      showToast("Keep walking! Sync when you hit at least 5,000 steps.", "warning");
    }
  };

  // Bind Alarm Check
  container.querySelector('#check-alarm-btn').onclick = () => {
    addXp(15);
    playSuccessSound();
    showToast("Morning alignment verified! Check-in within 5 min. +15 XP.", "success");
  };

  // Render log rows
  renderViolationLogs(container);
}

function renderViolationLogs(container) {
  const profile = getProfile();
  const tbody = container.querySelector('#violation-log-rows');
  if (!tbody) return;

  const logs = profile.violationLog || [];
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-hint);">No violations logged. Absolute honesty!</td></tr>`;
    return;
  }

  // Sort newest first
  const sorted = [...logs].reverse();
  tbody.innerHTML = sorted.map(log => `
    <tr>
      <td>${log.date} ${log.time}</td>
      <td><strong>${log.title}</strong></td>
      <td><span style="color:var(--duo-red); font-weight:bold;">${log.reason}</span></td>
    </tr>
  `).join('');
}

function startFocusSession(container) {
  const box = container.querySelector('#focus-sim-box');
  const timerDisplay = container.querySelector('#sim-timer-val');
  const startBtn = container.querySelector('#start-focus-sim-btn');

  if (activeFocusInterval) {
    // Stop existing
    stopFocusSession(false, container);
    return;
  }

  // UI state change
  startBtn.textContent = "Cancel Focus";
  startBtn.classList.remove('btn-primary');
  startBtn.classList.add('btn-danger');
  box.style.borderColor = 'var(--duo-blue)';

  let remaining = 15;
  timerDisplay.textContent = `00:${String(remaining).padStart(2, '0')}`;

  // Start interval
  activeFocusInterval = setInterval(() => {
    remaining--;
    timerDisplay.textContent = `00:${String(remaining).padStart(2, '0')}`;

    if (remaining <= 0) {
      stopFocusSession(true, container);
    }
  }, 1000);

  // Set up visibility tab listener
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      // VIOLATION DETECTED
      stopFocusSession(false, container, true);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
  
  showToast("Focus session started! Do NOT leave this tab for 15 seconds.", "info");
}

function stopFocusSession(success, container, violated = false) {
  // Clear hooks
  if (activeFocusInterval) {
    clearInterval(activeFocusInterval);
    activeFocusInterval = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }

  const box = container.querySelector('#focus-sim-box');
  const timerDisplay = container.querySelector('#sim-timer-val');
  const startBtn = container.querySelector('#start-focus-sim-btn');

  if (!box || !timerDisplay || !startBtn) return;

  // Restore UI
  startBtn.textContent = "Start 15s Focus";
  startBtn.classList.remove('btn-danger');
  startBtn.classList.add('btn-primary');
  box.style.borderColor = 'var(--border-color)';
  timerDisplay.textContent = "00:15";

  if (success) {
    addXp(15);
    playSuccessSound();
    showToast("Focus session complete! +15 XP awarded.", "success");
  } else if (violated) {
    playPivotSound();
    
    // Log violation
    const profile = getProfile();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentHM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    profile.violationLog.push({
      date: todayStr,
      time: currentHM,
      title: "📴 Screen-off Focus timer",
      reason: "📱 Left tab/Minimized browser"
    });
    saveProfile(profile);

    showToast("Focus broken! Integrity violation logged.", "error");
    renderViolationLogs(container);
  } else {
    showToast("Focus session cancelled.", "warning");
  }
}
