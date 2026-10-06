// Modules/path.js - Modern UI Version
import { getDay, getProfile, getYetToCreditDiamonds, saveDay, saveProfile } from './storage.js';
import { openDayModal } from './dayModal.js';
import { showToast } from './notifications.js';
import { renderMascotWidget } from './mascot.js';
import { RANKS } from './ranks.js';
import { sanitizeHTML } from './security.js';

export function renderPath(container) {
  const profile = getProfile();
  const today = new Date();
  const activeRankName = profile.militaryRank || "Civilian";
  const rankObj = RANKS.find(r => r.name === activeRankName) || RANKS[0];
  const badgeEmoji = rankObj ? rankObj.badge : "\ud83c\udf43";

  const todayStr = today.toISOString().split('T')[0];
  const tomVal = new Date(); 
  tomVal.setDate(today.getDate() + 1);
  const tomorrowStr = tomVal.toISOString().split('T')[0];

  // Calculate Today's completion
  const todayLog = getDay(todayStr);
  const totalBlocks = todayLog.blocks.length;
  const completedBlocks = todayLog.blocks.filter(b => b.status === 'completed').length;
  const todayProgress = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  // Generate date slots starting from user account creation date
  const signupDateStr = profile.createdDate || todayStr;
  const signupDate = new Date(signupDateStr + 'T00:00:00Z');
  
  // Calculate relative day index of today
  const todayDateObj = new Date(todayStr + 'T00:00:00Z');
  const diffTime = todayDateObj.getTime() - signupDate.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  // Today's current week number (1-based)
  const currentWeekNum = Math.floor(elapsedDays / 7) + 1;
  const totalWeeks = Math.max(3, currentWeekNum + 1); // Render at least 3 weeks
  
  const sections = [];
  const themes = ["theme-red", "theme-green", "theme-blue", "theme-gold", "theme-orange"];
  
  for (let w = 1; w <= totalWeeks; w++) {
    const weekDates = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = (w - 1) * 7 + d;
      const dateVal = new Date(signupDate.getTime());
      dateVal.setUTCDate(signupDate.getUTCDate() + dayOffset);
      weekDates.push(dateVal.toISOString().split('T')[0]);
    }
    
    const theme = themes[(w - 1) % themes.length];
    
    // Look up custom week name or default
    const customName = (profile.weekNames && profile.weekNames[w]) || `Week ${w}`;
    
    sections.push({
      num: w,
      name: customName,
      sub: `SECTION ${w}`,
      title: customName,
      theme: theme,
      dates: weekDates
    });
  }

  // Modern UI Container
  container.innerHTML = `
    <div class="path-container-modern">
      <!-- Progress Overview -->
      <div class="progress-overview glass-card animate-fade-in">
        <div class="progress-header">
          <h3 class="progress-title">
            <i class="fas fa-chart-line"></i>
            <span>Weekly Progress</span>
          </h3>
          <div class="progress-stats">
            <div class="progress-stat">
              <span class="stat-number">${todayProgress}%</span>
              <span class="stat-label">Today</span>
            </div>
            <div class="progress-stat">
              <span class="stat-number">${profile.streak}</span>
              <span class="stat-label">Streak</span>
            </div>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${todayProgress}%"></div>
          </div>
          <span class="progress-percentage">${todayProgress}% Complete</span>
        </div>
      </div>

      <!-- Week Sections -->
      <div class="week-sections" id="week-sections">
        ${sections.map((section, idx) => {
          const isCurrentWeek = section.num === currentWeekNum;
          const weekProgress = calculateWeekProgress(section.dates);
          
          return `
            <div class="week-section glass-card animate-fade-in stagger-${idx + 1}" data-week="${section.num}" data-theme="${section.theme}">
              <div class="week-header">
                <div class="week-info">
                  <span class="week-number">Week ${section.num}</span>
                  <h4 class="week-title">${sanitizeHTML(section.name)}</h4>
                  <div class="week-progress">
                    <div class="mini-progress-bar">
                      <div class="mini-progress-fill" style="width: ${weekProgress}%"></div>
                    </div>
                    <span>${weekProgress}%</span>
                  </div>
                </div>
                <div class="week-actions">
                  <button class="week-action-btn rename-btn" data-week="${section.num}" title="Rename Week">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </div>
              <div class="week-days">
                ${section.dates.map((dateStr, dayIdx) => {
                  const dayLog = getDay(dateStr);
                  const isToday = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;
                  const isPast = dateStr < todayStr;
                  const isCompleted = dayLog.isReviewed;
                  const hasSchedule = dayLog.isCommitted;
                  
                  // Calculate day completion percentage
                  const dayBlocks = dayLog.blocks.length;
                  const dayCompleted = dayLog.blocks.filter(b => b.status === 'completed').length;
                  const dayProgress = dayBlocks > 0 ? Math.round((dayCompleted / dayBlocks) * 100) : 0;
                  
                  return `
                    <div class="day-card ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${isCompleted ? 'completed' : ''} ${hasSchedule ? 'scheduled' : ''}" 
                         data-date="${dateStr}" 
                         onclick="openDayModal('${dateStr}')">
                      <div class="day-header">
                        <span class="day-name">${getDayName(dateStr)}</span>
                        <span class="day-date">${formatDate(dateStr)}</span>
                      </div>
                      <div class="day-status">
                        ${isToday ? '<i class="fas fa-sun"></i>' : ''}
                        ${isFuture ? '<i class="fas fa-lock"></i>' : ''}
                        ${isCompleted ? '<i class="fas fa-check-circle"></i>' : ''}
                        ${hasSchedule && !isCompleted ? '<i class="fas fa-clock"></i>' : ''}
                        ${!hasSchedule && !isFuture ? '<i class="fas fa-plus"></i>' : ''}
                      </div>
                      <div class="day-progress">
                        <div class="day-progress-bar">
                          <div class="day-progress-fill" style="width: ${dayProgress}%"></div>
                        </div>
                        <span class="day-percentage">${dayProgress}%</span>
                      </div>
                      ${isToday && dayLog.slots && dayLog.slots.length > 0 ? `
                        <div class="day-preview">
                          ${dayLog.slots.slice(1, 4).map((slot, idx) => {
                            if (slot.text && slot.text.trim()) {
                              return `<span class="preview-task">${sanitizeHTML(slot.text.substring(0, 20))}</span>`;
                            }
                            return '';
                          }).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions animate-fade-in stagger-4">
        <button class="quick-action-btn" onclick="openDayModal('${todayStr}')">
          <i class="fas fa-calendar-day"></i>
          <span>Today's Schedule</span>
        </button>
        <button class="quick-action-btn" onclick="openDayModal('${tomorrowStr}')">
          <i class="fas fa-calendar-plus"></i>
          <span>Plan Tomorrow</span>
        </button>
        <button class="quick-action-btn" onclick="showStats()">
          <i class="fas fa-chart-bar"></i>
          <span>View Stats</span>
        </button>
      </div>
    </div>
  `;

  // Add event listeners for week rename
  document.querySelectorAll('.rename-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const weekNum = parseInt(btn.getAttribute('data-week'));
      const currentName = profile.weekNames && profile.weekNames[weekNum] || `Week ${weekNum}`;
      
      showPrompt(`Rename Week ${weekNum}`, currentName, (newName) => {
        if (newName && newName.trim()) {
          profile.weekNames = profile.weekNames || {};
          profile.weekNames[weekNum] = newName.trim().substring(0, 30);
          saveProfile(profile);
          renderPath(container);
        }
      });
    });
  });

  // Add hover effects to day cards
  document.querySelectorAll('.day-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('hover');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hover');
    });
  });
}

// Helper functions
function calculateWeekProgress(dates) {
  let totalBlocks = 0;
  let completedBlocks = 0;
  
  dates.forEach(dateStr => {
    const dayLog = getDay(dateStr);
    totalBlocks += dayLog.blocks.length;
    completedBlocks += dayLog.blocks.filter(b => b.status === 'completed').length;
  });
  
  return totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
}

function getDayName(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function showStats() {
  const event = new CustomEvent('tempo_navigate', { detail: 'stats' });
  window.dispatchEvent(event);
}

// Make functions available globally for onclick handlers
window.openDayModal = openDayModal;
window.showStats = showStats;
