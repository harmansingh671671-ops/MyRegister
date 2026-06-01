// Modules/dayModal.js
import { getDay, saveDay, getProfile, saveProfile } from './storage.js';
import { playSuccessSound, playPivotSound, showConfirm, showToast } from './notifications.js';
import { addXp, triggerEODRecap } from './gamification.js';
import { calculateMilitaryRank } from './ranks.js';
import { renderMascotWidget } from './mascot.js';

let isNavigatingWithEnter = false;

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
  
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const isTomorrow = dateStr === tomorrowStr;

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

  // Render the structural outer template
  const scheduled = slots.slice(1).filter(s => s.text && s.text.trim() !== "");
  const completed = scheduled.filter(s => s.status === 'completed').length;
  const rate = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;

  let heroGradient = 'linear-gradient(135deg, #1cb0f6 0%, #1899d6 100%)';
  let statusText = "Today's Agenda";

  if (isFuture) {
    if (isTomorrow) {
      heroGradient = 'linear-gradient(135deg, #00cd9c 0%, #1cb0f6 100%)';
      statusText = "Planning Tomorrow";
    } else {
      heroGradient = 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)';
      statusText = "Future Schedule";
    }
  } else if (isPast) {
    if (scheduled.length === 0) {
      heroGradient = 'linear-gradient(135deg, #a1a8a9 0%, #4f585a 100%)';
      statusText = "No Tasks Scheduled";
    } else if (rate === 100) {
      heroGradient = 'linear-gradient(135deg, #58cc02 0%, #46a302 100%)';
      statusText = "100% Perfect Completion";
    } else if (rate > 0) {
      heroGradient = 'linear-gradient(135deg, #ff9600 0%, #e68500 100%)';
      statusText = `${rate}% Tasks Completed`;
    } else {
      heroGradient = 'linear-gradient(135deg, #ff4b4b 0%, #ea2b2b 100%)';
      statusText = "0% Tasks Completed";
    }
  }

  container.innerHTML = `
    <div class="modal-hero" style="background: ${heroGradient}; color: white; padding: 18px 20px; display: flex; align-items: center; gap: 14px; border-radius: 20px 20px 0 0; position: relative;">
      <button class="btn-back" id="modal-close-btn" aria-label="Go back" style="color: white; background: rgba(0,0,0,0.2); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <div>
        <span class="modal-date-title" style="margin: 0; font-size: 16px; font-weight: 800; display: block; line-height: 1.2;">📅 ${displayTitle}</span>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 3px; font-weight: 600;">${statusText}</div>
      </div>
    </div>
    
    <div id="modal-body-container" class="modal-body-scroll">
      
      <!-- Interactive Mascot Coach Header -->
      <div id="modal-mascot-container" style="margin-bottom: 15px;"></div>

      <!-- Satisfaction Row Card -->
      <div class="satisfaction-card card-3d" style="margin-bottom: 20px; padding: 12px 16px; background-color: rgba(28, 176, 246, 0.05); display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 2px solid var(--duo-blue); border-radius: 18px; box-shadow: 0 3px 0 var(--border-color);">
        <div style="font-family: var(--font-header); font-weight: 800; font-size: 11px; color: var(--duo-blue); white-space: nowrap; letter-spacing: 0.5px;">
          🌟 0000-2400
        </div>
        <input type="text" class="slot-txt-input satisfaction-input" 
               data-index="0" 
               value="${slots[0].text || ''}" 
               placeholder="How satisfied are you with your day?"
               ${dayLog.isReviewed ? 'disabled' : ''}
               style="flex: 1; font-weight: 600; padding: 4px 8px; border-radius: 8px;">
      </div>

      <!-- Vertical Timeline Path Trail -->
      <div class="timeline-trail-list">
        ${slots.slice(1).map((slot, i) => {
          const idx = i + 1;
          const startHour = i;
          
          // Determine past, running, future
          let hourPast = isPast || (isToday && startHour < currentHour);
          let hourRunning = isToday && startHour === currentHour;
          
          // Editing rules: Yesterday, Today, and Tomorrow's slots
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const isYesterday = dateStr === yesterdayStr;
          const isEditable = isToday || isTomorrow || isYesterday;
          
          // Status rules
          const hasText = slot.text && slot.text.trim() !== "";
          const isStatusClickable = hasText && hourPast;

          // Determine custom placeholders based on editable state and day position
          let placeholderText = "No schedule";
          if (isEditable) {
            placeholderText = "Type schedule...";
          } else if (dateStr > tomorrowStr) {
            placeholderText = "Locked";
          } else if (hasText) {
            placeholderText = "";
          }

          // Active markers
          const tickActive = slot.status === 'completed' ? 'active' : '';
          const crossActive = slot.status === 'missed' ? 'active' : '';

          return `
            <div class="timeline-row ${hourRunning ? 'running-hour' : ''}">
              <!-- Left Timestamp & Node Connector -->
              <div class="timeline-left">
                <span class="time-badge">${slot.time}</span>
                <div class="timeline-node-container">
                  <span class="timeline-node-bullet ${slot.status} ${hasText ? 'scheduled' : 'empty'} ${hourRunning ? 'running' : ''}"></span>
                </div>
              </div>
              
              <!-- Timeline Schedule Card -->
              <div class="timeline-card ${slot.status}-card">
                <div class="card-input-wrapper">
                  <input type="text" class="slot-txt-input hourly-schedule-input" 
                         data-index="${idx}" 
                         value="${slot.text || ''}" 
                         placeholder="${placeholderText}"
                         ${isEditable ? '' : 'disabled'}>
                </div>
                
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
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Action Panel / Lock Button -->
      <div id="modal-action-panel" style="margin-top: 20px; padding-bottom: 20px;"></div>
    </div>
  `;

  // Render Mascot widget dynamically inside modal header
  const mascotBox = container.querySelector('#modal-mascot-container');
  if (mascotBox) {
    let mascotMood = "normal";
    if (isFuture) mascotMood = "planning";
    else {
      const scheduled = slots.slice(1).filter(s => s.text && s.text.trim() !== "");
      const completed = scheduled.filter(s => s.status === 'completed').length;
      const rate = scheduled.length > 0 ? (completed / scheduled.length) * 100 : 0;
      if (dayLog.isReviewed || isPast) {
        mascotMood = rate >= 70 ? "happy" : "sad";
      } else {
        mascotMood = "normal";
      }
    }
    renderMascotWidget(mascotBox, mascotMood);
  }

  // Bind close button
  container.querySelector('#modal-close-btn').addEventListener('click', closeFn);

  // Bind text inputs save events & Enter key navigation
  const inputs = container.querySelectorAll('.slot-txt-input');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      if (isNavigatingWithEnter) return;
      
      const idx = parseInt(input.getAttribute('data-index'));
      slots[idx].text = input.value;
      saveDay(dateStr, dayLog);
      renderModalContent(dateStr, container, closeFn);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const idx = parseInt(input.getAttribute('data-index'));
        slots[idx].text = input.value;
        saveDay(dateStr, dayLog);
        
        e.preventDefault();

        const nextIdx = idx + 1;
        const nextInput = container.querySelector(`.slot-txt-input[data-index="${nextIdx}"]`);
        if (nextInput && !nextInput.disabled) {
          isNavigatingWithEnter = true;
          renderModalContent(dateStr, container, closeFn);
          
          const newNextInput = container.querySelector(`.slot-txt-input[data-index="${nextIdx}"]`);
          if (newNextInput) {
            newNextInput.focus();
          }
          setTimeout(() => {
            isNavigatingWithEnter = false;
          }, 50);
        } else {
          renderModalContent(dateStr, container, closeFn);
        }
      }
    });
  });

  // Bind status chimes toggles
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
          addXp(10);
          showToast("Task completed! +10 XP (+1 💎 yet to credit)", "success");
        } else {
          showToast("Task reset to pending.", "info");
        }
      } else if (action === 'missed') {
        newStatus = currentStatus === 'missed' ? 'pending' : 'missed';
        if (newStatus === 'missed') {
          playPivotSound();
          showToast("Diverged logged! (+1 💎 honesty bonus yet to credit)", "info");
        } else {
          showToast("Task reset to pending.", "info");
        }
      }

      slots[idx].status = newStatus;
      slots[idx].loggedAt = new Date().toISOString();
      saveDay(dateStr, dayLog);
      
      renderModalContent(dateStr, container, closeFn);
    });
  });

  // Render bottom locking panels
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
          // Count yet-to-credit diamonds for this day (completed and missed slots plus step bonus if any)
          const dayDiamonds = slots.slice(1).filter(s => s.status === 'completed' || s.status === 'missed').length + (dayLog.stepBonusDiamonds || 0);

          dayLog.isReviewed = true;
          saveDay(dateStr, dayLog);

          const p = getProfile();
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          // Streak verification
          if (p.lastReviewDate === yesterdayStr) {
            p.streak += 1;
          } else if (p.lastReviewDate === dateStr) {
            // No action needed
          } else {
            if (p.streakFreezeActive) {
              p.streakFreezeActive = false;
              showToast("❄️ Streak Freeze consumed to protect streak!", "info");
            } else {
              p.streak = 1;
            }
          }

          p.lastReviewDate = dateStr;
          
          // Credit day diamonds to the permanent balance!
          p.diamonds += dayDiamonds;
          showToast(`🎉 Day locked! +${dayDiamonds} 💎 credited to your account!`, "success");

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

          triggerEODRecap(dateStr, closeFn);
        }
      });
    } else if (scheduledHours.length === 0) {
      actionPanel.innerHTML = `
        <p class="hint" style="text-align: center;">
          ${isEditableDay(isToday, isTomorrow) ? 'Write down tasks for the hourly slots to build your schedule.' : 'No tasks scheduled on this day.'}
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

function isEditableDay(isToday, isTomorrow) {
  return isToday || isTomorrow;
}
