// Modules/dayModal.js
import { getDay, saveDay, getProfile, saveProfile } from './storage.js';
import { playSuccessSound, playPivotSound, showConfirm, showToast } from './notifications.js';
import { addXp, triggerEODRecap } from './gamification.js';
import { calculateMilitaryRank } from './ranks.js';

export function openDayModal(dateStr) {
  const modal = document.getElementById('day-modal');
  const content = document.getElementById('day-modal-content');
  const backdrop = document.getElementById('day-modal-backdrop');

  if (!modal || !content) return;

  modal.classList.remove('hidden');

  // Close handlers
  const closeModal = () => {
    modal.classList.add('hidden');
    // Re-render path view to update state icons
    window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'path' }));
  };

  backdrop.onclick = closeModal;

  renderModalContent(dateStr, content, closeModal);
}

function renderModalContent(dateStr, container, closeFn) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dayLog = getDay(dateStr);
  const profile = getProfile();

  const isFuture = dateStr > todayStr;
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;

  // Premium friendly date formatting
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  let relativeLabel = "";
  if (isToday) {
    relativeLabel = "Today";
  } else if (dateStr === new Date(Date.now() + 86400000).toISOString().split('T')[0]) {
    relativeLabel = "Tomorrow";
  } else if (dateStr === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
    relativeLabel = "Yesterday";
  }

  const dateFormatted = `${dayNames[d.getUTCDay()]}, ${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const displayTitle = relativeLabel ? `${relativeLabel} &middot; ${dateFormatted}` : dateFormatted;

  const currentHour = new Date().getHours();

  // Slots references
  const slots = dayLog.slots;

  // Build the tabular template
  container.innerHTML = `
    <div class="modal-header-row">
      <span class="modal-date-title">📅 ${displayTitle}</span>
      <button class="btn-close" id="modal-close-btn">&times;</button>
    </div>
    
    <div id="modal-body-container" class="modal-body-scroll" style="padding-top: 10px;">
      
      <!-- Unified Schedule Table -->
      <div class="schedule-table-container">
        <table class="schedule-table">
          <tbody>
            <!-- Satisfaction top row (colspan=2 across time and schedule inputs) -->
            <tr class="satisfaction-row">
              <td class="col-time">0000-2400</td>
              <td class="col-schedule" colspan="2" style="padding-right: 12px;">
                <input type="text" class="slot-txt-input satisfaction-input" 
                       data-index="0" 
                       value="${slots[0].text || ''}" 
                       placeholder="Click here to log Satisfaction (e.g. Fully Satisfied, Good flow)">
              </td>
            </tr>
            
            <!-- 24 Hourly Rows -->
            ${slots.slice(1).map((slot, i) => {
              const idx = i + 1;
              const startHour = i;
              
              // Determine past, running, future for Today
              let hourPast = isPast || (isToday && startHour < currentHour);
              let hourRunning = isToday && startHour === currentHour;
              
              // Editing rules
              const isEditable = isFuture || (isToday && startHour > currentHour);
              
              // Status rules
              const hasText = slot.text && slot.text.trim() !== "";
              const isStatusClickable = hasText && hourPast;

              // Action button classes
              const tickActive = slot.status === 'completed' ? 'active' : '';
              const crossActive = slot.status === 'missed' ? 'active' : '';

              return `
                <tr class="hour-row ${hourRunning ? 'running-hour' : ''}">
                  <td class="col-time">${slot.time}</td>
                  <td class="col-schedule">
                    <input type="text" class="slot-txt-input hourly-schedule-input" 
                           data-index="${idx}" 
                           value="${slot.text || ''}" 
                           placeholder="${isEditable ? 'Type schedule...' : (hasText ? '' : 'No schedule')}"
                           ${isEditable ? '' : 'disabled'}>
                  </td>
                  <td class="col-status">
                    ${hasText ? `
                      <div class="status-btn-group">
                        <button class="status-btn btn-tick ${tickActive}" 
                                data-index="${idx}" 
                                data-status="completed" 
                                ${isStatusClickable ? '' : 'disabled'}
                                title="${isStatusClickable ? 'Mark Completed' : 'LOCKED (Hour not passed)'}">✓</button>
                        <button class="status-btn btn-cross ${crossActive}" 
                                data-index="${idx}" 
                                data-status="missed" 
                                ${isStatusClickable ? '' : 'disabled'}
                                title="${isStatusClickable ? 'Mark Missed' : 'LOCKED (Hour not passed)'}">✗</button>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Action Panel / Reviewed Banner -->
      <div id="modal-action-panel" style="margin-top: 20px; padding-bottom: 20px;"></div>
    </div>
  `;

  // Bind close buttons
  container.querySelector('#modal-close-btn').addEventListener('click', closeFn);

  // Bind inputs save event
  const inputs = container.querySelectorAll('.slot-txt-input');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.getAttribute('data-index'));
      slots[idx].text = input.value;
      saveDay(dateStr, dayLog);
      // Re-render to update the status column buttons if schedule text toggled empty/non-empty
      renderModalContent(dateStr, container, closeFn);
    });
  });

  // Bind status button clicks
  const statusButtons = container.querySelectorAll('.status-btn');
  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const action = btn.getAttribute('data-status');
      
      const currentStatus = slots[idx].status || 'pending';
      let newStatus = 'pending';

      if (action === 'completed') {
        newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        if (newStatus === 'completed') {
          playSuccessSound();
          showToast("Task completed! +10 XP & +1 💎", "success");
          
          // Reward standard task rewards
          const p = getProfile();
          p.diamonds += 1;
          saveProfile(p);
          addXp(10);
        }
      } else if (action === 'missed') {
        newStatus = currentStatus === 'missed' ? 'pending' : 'missed';
        if (newStatus === 'missed') {
          playPivotSound();
          showToast("Diverged logged! +1 💎 Honesty Bonus", "info");
          
          // Award 1 diamond honesty reward
          const p = getProfile();
          p.diamonds += 1;
          saveProfile(p);
        }
      }

      slots[idx].status = newStatus;
      slots[idx].loggedAt = new Date().toISOString();
      saveDay(dateStr, dayLog);
      
      renderModalContent(dateStr, container, closeFn);
    });
  });

  // Render Lock button or status banner at bottom
  const actionPanel = container.querySelector('#modal-action-panel');
  if (actionPanel) {
    const scheduledHours = slots.slice(1).filter(s => s.text && s.text.trim() !== "");
    const allReviewed = scheduledHours.length > 0 && scheduledHours.every(s => s.status === 'completed' || s.status === 'missed');
    
    if (dayLog.isReviewed) {
      actionPanel.innerHTML = `
        <div class="day-locked-banner card-3d">
          🎉 Day locked & reviewed! Streak: <strong>${profile.streak} days</strong>
        </div>
      `;
    } else if (allReviewed && (isToday || isPast)) {
      actionPanel.innerHTML = `
        <button id="lock-day-review-btn" class="btn btn-success btn-3d btn-full btn-lg">
          🔒 Sign & Lock Day Review
        </button>
      `;

      actionPanel.querySelector('#lock-day-review-btn').addEventListener('click', async () => {
        const confirm = await showConfirm("Sign and lock this day review? This secures your streak.");
        if (confirm) {
          dayLog.isReviewed = true;
          saveDay(dateStr, dayLog);

          const p = getProfile();
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          // Streak check
          if (p.lastReviewDate === yesterdayStr) {
            p.streak += 1;
          } else if (p.lastReviewDate === dateStr) {
            // Already synced
          } else {
            if (p.streakFreezeActive) {
              p.streakFreezeActive = false;
              showToast("❄️ Streak Freeze consumed to protect streak!", "info");
            } else {
              p.streak = 1;
            }
          }

          p.lastReviewDate = dateStr;
          p.diamonds += 1; // Standard review reward

          // Milestone check
          let claimMilestone = false;
          let rewardAmt = 0;
          const milestoneKey = `streak_${p.streak}`;
          if ([7, 15, 30].includes(p.streak) && !p.milestonesClaimed.includes(milestoneKey)) {
            claimMilestone = true;
            p.milestonesClaimed.push(milestoneKey);
            rewardAmt = p.streak === 7 ? 10 : p.streak === 15 ? 25 : 50;
            p.diamonds += rewardAmt;
          }

          if (p.streak > p.highestStreak) {
            p.highestStreak = p.streak;
          }

          saveProfile(p);
          calculateMilitaryRank();

          if (claimMilestone) {
            alert(`🏆 MILESTONE REACHED! You earned +${rewardAmt} 💎 for a ${p.streak}-Day streak!`);
          }

          // Trigger End of Day recap screen
          triggerEODRecap(dateStr, closeFn);
        }
      });
    } else if (scheduledHours.length === 0) {
      actionPanel.innerHTML = `
        <p class="hint" style="text-align: center;">
          ${isEditableDay(isToday, isFuture) ? 'Write down tasks for the hourly slots to build your schedule.' : 'No tasks scheduled on this day.'}
        </p>
      `;
    } else {
      const pendingCount = scheduledHours.filter(s => s.status === 'pending').length;
      actionPanel.innerHTML = `
        <p class="hint" style="text-align: center; color: var(--duo-blue); font-weight: bold;">
          🕒 ${pendingCount} task${pendingCount > 1 ? 's' : ''} pending completion reviews as hours pass.
        </p>
      `;
    }
  }
}

function isEditableDay(isToday, isFuture) {
  return isToday || isFuture;
}
