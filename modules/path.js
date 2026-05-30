// Modules/path.js
import { getDay, getProfile } from './storage.js';
import { openDayModal } from './dayModal.js';
import { showPrompt } from './notifications.js';
import { renderMascotWidget } from './mascot.js';
import { RANKS } from './ranks.js';

export function renderPath(container) {
  const profile = getProfile();
  const today = new Date();
  const activeRankName = profile.militaryRank || "Civilian";
  const rankObj = RANKS.find(r => r.name === activeRankName) || RANKS[0];
  const badgeEmoji = rankObj ? rankObj.badge : "🍃";


  const todayStr = today.toISOString().split('T')[0];
  const tomVal = new Date(); tomVal.setDate(today.getDate() + 1);
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
  const themes = ["red", "green", "blue", "gold", "orange"];
  
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

  // Render Layout: Sticky top stats bar, Sticky active unit banner, and Winding Sections
  container.innerHTML = `
    <!-- Top Stats Row (Exact Duolingo Replica) -->
    <div class="duo-top-bar">
      <div class="duo-stat" title="Active Section">
        <span class="stat-icon">🏁</span>
        <span class="stat-text text-secondary" id="header-section-num">1</span>
      </div>
      <div class="duo-stat text-xp" title="Level">
        <span class="stat-icon">${badgeEmoji}</span>
        <span class="stat-text header-level-val">${activeRankName}</span>
      </div>
      <div class="duo-stat text-streak" title="Streak">
        <span class="stat-icon">🔥</span>
        <span class="stat-text header-streak-val">${profile.streak}</span>
      </div>
      <div class="duo-stat text-gem" title="Gems">
        <span class="stat-icon">💎</span>
        <span class="stat-text header-diamond-val">${profile.diamonds}</span>
      </div>
      <div class="duo-stat text-heart" title="Integrity Health (Last 24 entries)">
        <span class="stat-icon">💖</span>
        <span class="stat-text">${profile.integrityScore}%</span>
      </div>
    </div>

    <!-- SINGLE STICKY UNIT HEADER BANNER (Locks to top of map section) -->
    <div class="duo-unit-banner sticky-unit-banner" id="sticky-unit-banner">
      <div class="unit-banner-content">
        <h3 class="unit-title-heading" id="sticky-unit-title" style="display:flex; align-items:center; gap:8px;">
          <span id="sticky-unit-title-text">Week 1</span>
          <span class="rename-pencil-icon" id="sticky-rename-btn" style="cursor:pointer; font-size:14px; opacity:0.8;" title="Rename Week">✏️</span>
        </h3>
      </div>
      <button class="unit-guidebook-btn" id="sticky-guidebook-btn" title="Open Guidebook">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="3" width="14" height="18" rx="2"></rect>
          <line x1="3" y1="7" x2="6" y2="7"></line>
          <line x1="3" y1="12" x2="6" y2="12"></line>
          <line x1="3" y1="17" x2="6" y2="17"></line>
          <line x1="10" y1="8" x2="16" y2="8"></line>
          <line x1="10" y1="12" x2="16" y2="12"></line>
          <line x1="10" y1="16" x2="16" y2="16"></line>
        </svg>
      </button>
    </div>



    <!-- Mascot Coach Row -->
    <div id="path-mascot-container" style="padding: 16px 16px 0 16px;"></div>

    <!-- Scrollable Winding Path sections -->
    <div class="path-sections-list">
      ${sections.map((sec, idx) => `
        <div class="week-section theme-${sec.theme}" data-week="${sec.num}" id="week-section-${sec.num}">
          
          <!-- Section Divider (Header/Footer transition matching 2nd photo) -->
          ${idx > 0 ? `<div class="section-divider">${sec.name} <span class="rename-pencil-icon" data-week="${sec.num}" style="cursor:pointer; font-size:12px; margin-left:6px; opacity:0.8;" title="Rename Week">✏️</span></div>` : ''}

          <!-- Winding nodes path trail -->
          <div class="path-trail-container">
            <svg class="path-line-svg section-svg-path" data-week="${sec.num}"></svg>
            <div class="path-nodes-list section-nodes-trail" data-week="${sec.num}">
              <!-- Nodes injected dynamically -->
            </div>
          </div>
        </div>
      `).join('')}

      <!-- LOCKED SECTION AT END -->
      <div class="duo-locked-section card-3d">
        <div class="locked-section-badge">UP NEXT</div>
        <h3>🔒 Week ${totalWeeks + 1}: Habit Mastery</h3>
        <p class="hint">Master strict energy sequencing, deep flow entry states, and buffer time budgeting.</p>
      </div>
    </div>

    <!-- Trophy Weekly Report Modal -->
    <div id="trophy-modal" class="fullscreen-modal hidden">
      <div class="modal-backdrop" id="trophy-backdrop"></div>
      <div class="modal-card card-3d animate-pop" style="max-width: 440px; padding: 30px;">
        <span style="font-size:70px; display:block; margin-bottom:15px; animation: floatAvatar 1.5s ease-in-out infinite alternate;">🏆</span>
        <h3 id="trophy-modal-title" style="font-family:var(--font-header); font-size:24px; margin-bottom:10px;">Week Review</h3>
        <div id="trophy-modal-body" style="font-size:14px; color:var(--text-secondary); line-height:1.5; margin-bottom:20px; text-align:left;">
          <!-- Injected -->
        </div>
        <button id="close-trophy-btn" class="btn btn-primary btn-3d btn-full btn-sm">Got it!</button>
      </div>
    </div>
  `;

  // Render individual nodes for each week section
  sections.forEach(sec => {
    const listEl = container.querySelector(`.section-nodes-trail[data-week="${sec.num}"]`);
    if (!listEl) return;

    const nodeData = sec.dates.map((dateStr, index) => {
      const dayLog = getDay(dateStr);
      const isTomorrow = dateStr === tomorrowStr;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > tomorrowStr;

      let nodeType = 'locked';
      let icon = '🔒';
      let tooltip = 'Locked';

      if (isTomorrow) {
        if (dayLog.isCommitted) {
          nodeType = 'committed';
          icon = '📝';
          tooltip = 'Schedule Committed';
        } else {
          nodeType = 'plan';
          icon = '✍️';
          tooltip = 'Plan Tomorrow';
        }
      } else if (isToday) {
        nodeType = 'active';
        icon = '⭐';
        tooltip = 'Active Today';
      } else if (isPast) {
        if (dayLog.isCommitted && dayLog.isReviewed) {
          nodeType = 'reviewed';
          icon = '👑';
          tooltip = 'Reviewed';
        } else if (dayLog.isCommitted && !dayLog.isReviewed) {
          nodeType = 'pending-review';
          icon = '❓';
          tooltip = 'Pending Review';
        } else {
          nodeType = 'skipped';
          icon = '💀';
          tooltip = 'Day Skipped';
        }
      } else if (isFuture) {
        nodeType = 'future';
        const FUTURE_DAY_ICONS = {
          0: "🛌", // Sunday
          1: "💻", // Monday
          2: "📚", // Tuesday
          3: "🏃", // Wednesday
          4: "⚡", // Thursday
          5: "🎯", // Friday
          6: "🧘"  // Saturday
        };
        const nodeDayOfWeek = new Date(dateStr + 'T00:00:00Z').getUTCDay();
        icon = FUTURE_DAY_ICONS[nodeDayOfWeek] || "📅";
        tooltip = 'Future Planning Locked';
      }

      const xOffset = Math.sin(index * 1.1) * 65;

      return {
        dateStr,
        index,
        nodeType,
        icon,
        tooltip,
        xOffset,
        isToday
      };
    });

    let nodesHtml = nodeData.map(node => {
      let displayLabel = node.dateStr;
      const d = new Date(node.dateStr);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      if (node.dateStr === tomorrowStr) displayLabel = "Tomorrow";
      else if (node.dateStr === todayStr) displayLabel = "Today";
      else {
        const yesterdayDate = new Date(); yesterdayDate.setDate(today.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        if (node.dateStr === yesterdayStr) {
          displayLabel = "Yesterday";
        } else {
          displayLabel = `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
        }
      }

      const inlineStyle = node.isToday 
        ? `background: conic-gradient(var(--theme-color) ${todayProgress}%, transparent ${todayProgress}%);`
        : '';

      return `
        <div class="path-node-wrapper" style="transform: translateX(${node.xOffset}px);">
          ${node.isToday ? `<div class="owl-avatar-path">🦉</div>` : ''}
          ${node.isToday ? `
            <div class="today-progress-ring-container" style="width: 90px; height: 80px; ${inlineStyle}"></div>
            <button class="day-node node-active" data-date="${node.dateStr}" title="${node.tooltip}">
              <span class="node-icon">${node.icon}</span>
            </button>
          ` : `
            <button class="day-node node-${node.nodeType}" data-date="${node.dateStr}" title="${node.tooltip}">
              <span class="node-icon">${node.icon}</span>
            </button>
          `}
        </div>
      `;
    }).join('');

    // Append Trophy Node at the end of each section
    const trophyOffset = Math.sin(sec.dates.length * 1.1) * 65;
    const trophySideClass = trophyOffset < 0 ? 'side-right' : 'side-left';
    nodesHtml += `
      <div class="path-node-wrapper trophy-wrapper" style="transform: translateX(${trophyOffset}px);">
        <button class="day-node node-trophy card-3d" data-week="${sec.num}" title="Week Review Trophy">
          <span class="node-icon">🏆</span>
        </button>
        <div class="node-label ${trophySideClass}">
          <span class="label-date">Week ${sec.num} Trophy</span>
          <span class="label-status">Tap to unlock report</span>
        </div>
      </div>
    `;

    listEl.innerHTML = nodesHtml;
  });

  // Bind day clicks
  container.querySelectorAll('.day-node:not(.node-trophy)').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.getAttribute('data-date');
      openDayModal(date);
    });
  });

  // Bind Trophy clicks
  const trophyModal = container.querySelector('#trophy-modal');
  const trophyTitle = container.querySelector('#trophy-modal-title');
  const trophyBody = container.querySelector('#trophy-modal-body');
  
  container.querySelectorAll('.node-trophy').forEach(btn => {
    btn.addEventListener('click', () => {
      const weekNum = parseInt(btn.getAttribute('data-week'));
      openTrophyModal(weekNum, trophyModal, trophyTitle, trophyBody);
    });
  });

  container.querySelector('#close-trophy-btn').onclick = () => trophyModal.classList.add('hidden');
  container.querySelector('#trophy-backdrop').onclick = () => trophyModal.classList.add('hidden');

  // Render Mascot widget
  const mascotBox = container.querySelector('#path-mascot-container');
  if (mascotBox) {
    let mood = 'normal';
    const total = todayLog.blocks.length;
    const completed = todayLog.blocks.filter(b => b.status === 'completed').length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    if (todayLog.isReviewed) {
      mood = rate >= 70 ? 'happy' : 'sad';
    } else {
      const yesterdayDate = new Date(); yesterdayDate.setDate(today.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      const yesterdayLog = getDay(yesterdayStr);
      if (yesterdayLog.isCommitted && !yesterdayLog.isReviewed) {
        mood = 'sad';
      }
    }
    renderMascotWidget(mascotBox, mood);
  }



  // --- STICKY UNIT HEADER SCROLL LISTENER ---
  const viewport = document.querySelector('.view-viewport');
  const stickyBanner = container.querySelector('#sticky-unit-banner');
  const stickyTitleText = container.querySelector('#sticky-unit-title-text');
  const stickyGuideBtn = container.querySelector('#sticky-guidebook-btn');
  const stickyRenameBtn = container.querySelector('#sticky-rename-btn');

  function updateStickyHeader(sec) {
    if (!stickyBanner || !stickyTitleText) return;
    stickyTitleText.textContent = sec.name;
    stickyGuideBtn.setAttribute('data-week', sec.num);

    let themeColor = 'var(--duo-red)';
    let themeColorBottom = 'var(--duo-red-bottom)';
    if (sec.theme === 'green') {
      themeColor = 'var(--duo-green)';
      themeColorBottom = 'var(--duo-green-bottom)';
    } else if (sec.theme === 'blue') {
      themeColor = 'var(--duo-blue)';
      themeColorBottom = 'var(--duo-blue-bottom)';
    } else if (sec.theme === 'gold') {
      themeColor = 'var(--duo-gold)';
      themeColorBottom = 'var(--duo-gold-bottom)';
    } else if (sec.theme === 'orange') {
      themeColor = 'var(--duo-orange)';
      themeColorBottom = 'var(--duo-orange-bottom)';
    }
    
    stickyBanner.style.backgroundColor = themeColor;
    stickyBanner.style.boxShadow = `0 6px 0 ${themeColorBottom}`;

    // Dynamically update the top stats bar active section number
    const sectionNumEl = container.querySelector('#header-section-num');
    if (sectionNumEl) {
      sectionNumEl.textContent = sec.num;
    }
  }

  // Bind Guidebook clicks on sticky header
  stickyGuideBtn.onclick = () => {
    window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'stats' }));
  };

  // Bind Rename click on sticky banner
  if (stickyRenameBtn) {
    stickyRenameBtn.onclick = async (e) => {
      e.stopPropagation();
      const weekNum = stickyGuideBtn.getAttribute('data-week') || 1;
      const currentName = profile.weekNames[weekNum] || `Week ${weekNum}`;
      const newName = await showPrompt(`Rename Week ${weekNum}:`, currentName, "Rename Week");
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed) {
          if (!profile.weekNames) profile.weekNames = {};
          profile.weekNames[weekNum] = trimmed;
          saveProfile(profile);
          renderPath(container);
        }
      }
    };
  }

  // Bind Rename clicks on inline dividers
  container.querySelectorAll('.section-divider .rename-pencil-icon').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const weekNum = btn.getAttribute('data-week');
      const currentName = profile.weekNames[weekNum] || `Week ${weekNum}`;
      const newName = await showPrompt(`Rename Week ${weekNum}:`, currentName, "Rename Week");
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed) {
          if (!profile.weekNames) profile.weekNames = {};
          profile.weekNames[weekNum] = trimmed;
          saveProfile(profile);
          renderPath(container);
        }
      }
    };
  });

  if (viewport) {
    viewport.addEventListener('scroll', () => {
      const sectionsList = container.querySelectorAll('.week-section');
      const viewportRect = viewport.getBoundingClientRect();
      
      // Calculate top bounds dynamically based on top bar + sticky banner height
      const topBarHeight = 60;
      const bannerHeight = stickyBanner ? stickyBanner.offsetHeight : 80;
      const threshold = topBarHeight + bannerHeight;

      let activeSec = sections[0];
      
      sectionsList.forEach((secEl, idx) => {
        const rect = secEl.getBoundingClientRect();
        const relativeTop = rect.top - viewportRect.top;
        // Trigger switch when section top scrolls past the threshold
        if (relativeTop <= threshold) {
          activeSec = sections[idx];
        }
      });
      
      updateStickyHeader(activeSec);
    });
  }

  // Initial header sync
  updateStickyHeader(sections[0]);

  // Render SVG connecting roads for each week section
  setTimeout(() => {
    sections.forEach(sec => {
      const svgEl = container.querySelector(`.section-svg-path[data-week="${sec.num}"]`);
      const listEl = container.querySelector(`.section-nodes-trail[data-week="${sec.num}"]`);
      if (svgEl && listEl) {
        drawSectionRoad(listEl, svgEl, sec.theme);
      }
    });

    // Auto scroll to Today node
    const activeNode = container.querySelector('.node-active');
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 1200);
}

function drawSectionRoad(listEl, svg, themeColor) {
  return;
}

function openTrophyModal(weekNum, modal, title, body) {
  modal.classList.remove('hidden');
  title.textContent = `🏆 Week ${weekNum} Summary Report`;

  if (weekNum === 1) {
    body.innerHTML = `
      <div style="background:var(--bg-dark); padding:12px; border-radius:12px; margin-bottom:12px;">
        <span style="font-size:12px; color:var(--text-hint);">FOUNDATIONS PHASE</span>
        <h4 style="margin:4px 0;">Routine Compliance: <strong>72%</strong></h4>
      </div>
      <p style="margin-bottom:10px;">You began your journey building foundation routines. Submitting entries honestly helped map out your initial focus benchmarks.</p>
      <ul style="padding-left:20px; font-size:13px; display:flex; flex-direction:column; gap:6px;">
        <li>💻 Work focus blocks logged: <strong>14 hours</strong></li>
        <li>🛌 Sleep averages: <strong>7.2 hours/night</strong></li>
        <li>💡 Coach Tip: Your morning focus remains high. Safeguard this slot.</li>
      </ul>
    `;
  } else if (weekNum === 2) {
    body.innerHTML = `
      <div style="background:var(--bg-dark); padding:12px; border-radius:12px; margin-bottom:12px;">
        <span style="font-size:12px; color:var(--text-hint);">ACCOUNTABILITY PHASE</span>
        <h4 style="margin:4px 0;">Routine Compliance: <strong>85%</strong></h4>
      </div>
      <p style="margin-bottom:10px;">Excellent progress! By immediately adapting and logging entries honestly, you secured a higher efficiency score.</p>
      <ul style="padding-left:20px; font-size:13px; display:flex; flex-direction:column; gap:6px;">
        <li>📚 Study focus blocks logged: <strong>18 hours</strong></li>
        <li>🏃 Workout slots completed: <strong>6 blocks</strong></li>
        <li>💡 Coach Tip: Evening fatigue is under control. Keep logs honest.</li>
      </ul>
    `;
  } else {
    body.innerHTML = `
      <div style="background:var(--bg-dark); padding:12px; border-radius:12px; margin-bottom:12px;">
        <span style="font-size:12px; color:var(--text-hint);">FUTURE PHASE (LOCKED)</span>
        <h4 style="margin:4px 0;">Status: <strong>Planned / Pending</strong></h4>
      </div>
      <p>This week is active or locked in the future. Complete your entries for this week to unlock the summary metrics!</p>
    `;
  }
}
