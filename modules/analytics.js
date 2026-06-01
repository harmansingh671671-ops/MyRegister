// Modules/analytics.js
import { getAllDays, getProfile, getDay } from './storage.js';
import { initWeeklyLeaderboard, updateLeaderboard, checkLeagueEndOfWeek } from './gamification.js';

export function renderAnalytics(container) {
  let activeSubTab = sessionStorage.getItem('tempo_analytics_subtab') || 'performance';

  const renderBaseHTML = () => {
    container.innerHTML = `
      <div class="view-header">
        <h2>📊 Performance & Standing</h2>
      </div>

      <!-- Sub tab links -->
      <div class="analytics-sub-tabs">
        <button class="sub-tab-btn ${activeSubTab === 'performance' ? 'active' : ''}" data-subtab="performance">📊 Stats</button>
        <button class="sub-tab-btn ${activeSubTab === 'league' ? 'active' : ''}" data-subtab="league">🏆 League</button>
        <button class="sub-tab-btn ${activeSubTab === 'integrity' ? 'active' : ''}" data-subtab="integrity">⛓️ Habit Chain</button>
      </div>

      <!-- Sub view viewport -->
      <div id="analytics-sub-content"></div>
    `;

    const subContent = container.querySelector('#analytics-sub-content');

    // Bind sub-tabs clicks
    container.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubTab = btn.getAttribute('data-subtab');
        sessionStorage.setItem('tempo_analytics_subtab', activeSubTab);

        container.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderSubView(subContent);
      });
    });

    renderSubView(subContent);
  };

  const renderSubView = (contentArea) => {
    if (activeSubTab === 'performance') {
      renderPerformanceView(contentArea);
    } else if (activeSubTab === 'league') {
      renderLeagueView(contentArea);
    } else if (activeSubTab === 'integrity') {
      renderIntegrityView(contentArea);
    }
  };

  renderBaseHTML();
}

// VIEW 1: PERFORMANCE ANALYTICS VIEW
function renderPerformanceView(container) {
  const history = getAllDays();
  
  // Last 7 days keys
  const today = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  // Compile statistics
  const categoryHours = { Study: 0, Work: 0, Sleep: 0, Health: 0, Leisure: 0, Admin: 0 };
  const categoryStats = {
    Study: { total: 0, completed: 0 },
    Work: { total: 0, completed: 0 },
    Sleep: { total: 0, completed: 0 },
    Health: { total: 0, completed: 0 },
    Leisure: { total: 0, completed: 0 },
    Admin: { total: 0, completed: 0 }
  };

  const hourStats = Array(24).fill(0).map(() => ({ total: 0, completed: 0 }));
  let overallCompleted = 0;
  let overallTotal = 0;

  last7Days.forEach(dateStr => {
    const log = history[dateStr];
    if (log && log.blocks) {
      log.blocks.forEach(block => {
        const [sh, sm] = block.startTime.split(':').map(Number);
        const [eh, em] = block.endTime.split(':').map(Number);
        const durationHours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        
        const cat = block.category;
        if (categoryHours[cat] !== undefined) {
          categoryHours[cat] += durationHours;
          categoryStats[cat].total++;
          if (block.status === 'completed') {
            categoryStats[cat].completed++;
          }
        }

        // Hour-by-hour analytics
        const hourBin = sh;
        hourStats[hourBin].total++;
        if (block.status === 'completed') {
          hourStats[hourBin].completed++;
        }

        overallTotal++;
        if (block.status === 'completed') {
          overallCompleted++;
        }
      });
    }
  });

  const complianceRate = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  container.innerHTML = `
    <!-- Stats Summary Rows -->
    <div class="analytics-summary-grid">
      <div class="card card-3d stat-summary-card">
        <div class="stat-left">
          <div class="stat-icon-wrapper" style="background: rgba(88, 204, 2, 0.15); color: var(--duo-green);">📈</div>
          <div class="stat-info">
            <h4>Compliance Rate</h4>
            <span class="stat-description">Planned completions over the last 7 days</span>
          </div>
        </div>
        <div class="stat-right">
          <div class="stat-large">${complianceRate}%</div>
        </div>
      </div>

      <div class="card card-3d stat-summary-card">
        <div class="stat-left">
          <div class="stat-icon-wrapper" style="background: rgba(28, 176, 246, 0.15); color: var(--duo-blue);">💤</div>
          <div class="stat-info">
            <h4>Avg Sleep Duration</h4>
            <span class="stat-description">Recommended: 7-8 hours per night</span>
          </div>
        </div>
        <div class="stat-right">
          <div class="stat-large" id="avg-sleep-val">0h</div>
        </div>
      </div>

      <div class="card card-3d stat-summary-card">
        <div class="stat-left">
          <div class="stat-icon-wrapper" style="background: rgba(255, 150, 0, 0.15); color: var(--duo-orange);">🎯</div>
          <div class="stat-info">
            <h4>Primary Focus</h4>
            <span class="stat-description">Most time-allocated category</span>
          </div>
        </div>
        <div class="stat-right">
          <div class="stat-large" id="primary-focus-val">None</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="analytics-charts-layout">
      <!-- Category distribution chart -->
      <div class="card card-3d chart-card">
        <h3>⏱️ Time Investment (Hours)</h3>
        <canvas id="category-chart" width="360" height="230"></canvas>
      </div>

      <!-- Chronotype peak chart -->
      <div class="card card-3d chart-card">
        <h3>📈 Focus Peak by Hour of Day</h3>
        <canvas id="chronotype-chart" width="360" height="230"></canvas>
      </div>
    </div>

    <!-- Habit Coach advice -->
    <div class="card card-3d coach-card">
      <div class="coach-header">
        <span class="coach-avatar">🦉</span>
        <div>
          <h3>Odyssey AI Habit Coach</h3>
          <p class="hint">Tips derived from your weekly block patterns.</p>
        </div>
      </div>
      <div class="coach-advice-list" id="coach-advice-list">
        <!-- Rendered via JS -->
      </div>
    </div>
  `;

  // Draw Category Hours Chart
  drawCategoryChart(categoryHours);

  // Draw Focus Peaks Chart
  drawChronotypeChart(hourStats);

  // Compile sleep and focus metrics
  const avgSleep = Math.round((categoryHours.Sleep / 7) * 10) / 10;
  container.querySelector('#avg-sleep-val').textContent = `${avgSleep}h`;

  let maxCategory = 'None';
  let maxHours = 0;
  Object.keys(categoryHours).forEach(cat => {
    if (cat !== 'Sleep' && categoryHours[cat] > maxHours) {
      maxHours = categoryHours[cat];
      maxCategory = cat;
    }
  });
  container.querySelector('#primary-focus-val').textContent = maxCategory;

  // Coach logic
  const coachList = container.querySelector('#coach-advice-list');
  const advice = [];

  if (avgSleep < 6.8) {
    advice.push({
      type: 'warning',
      text: `⚠️ <strong>Under-sleeping detected:</strong> You average only ${avgSleep}h of sleep. Plan an 8-hour sleep block tonight.`
    });
  } else {
    advice.push({
      type: 'success',
      text: `🛌 <strong>Great sleep hygiene:</strong> You average ${avgSleep}h of sleep. Consistency here supports peak cognitive stamina.`
    });
  }

  let worstHour = -1;
  let worstRate = 1.1;
  hourStats.forEach((stat, h) => {
    if (stat.total >= 2) {
      const rate = stat.completed / stat.total;
      if (rate < worstRate) {
        worstRate = rate;
        worstHour = h;
      }
    }
  });

  if (worstHour !== -1 && worstRate < 0.6) {
    advice.push({
      type: 'info',
      text: `⏰ <strong>Focus slump slot:</strong> Around ${String(worstHour).padStart(2, '0')}:00, compliance falls to ${Math.round(worstRate * 100)}%. Place administrative tasks rather than high-focus deep work blocks here.`
    });
  }

  let highestFrictionCategory = null;
  let highestFrictionCount = 0;
  Object.keys(categoryStats).forEach(cat => {
    const total = categoryStats[cat].total;
    const missed = total - categoryStats[cat].completed;
    if (missed > highestFrictionCount) {
      highestFrictionCount = missed;
      highestFrictionCategory = cat;
    }
  });

  if (highestFrictionCategory && highestFrictionCount > 0) {
    advice.push({
      type: 'warning',
      text: `🔥 <strong>High-Friction area:</strong> Your "${highestFrictionCategory}" blocks had ${highestFrictionCount} missed items. Split these tasks into smaller, less intimidating 20-minute windows.`
    });
  }

  coachList.innerHTML = advice.map(ad => `
    <div class="coach-advice-item advice-${ad.type}">
      <span class="advice-bullet">${ad.type === 'success' ? '✅' : ad.type === 'warning' ? '⚠️' : '💡'}</span>
      <p>${ad.text}</p>
    </div>
  `).join('');
}

// VIEW 2: WEEKLY LEAGUE VIEW
function renderLeagueView(container) {
  // Sync bot scores and fetch leaderboard
  updateLeaderboard();
  const profile = getProfile();
  const list = initWeeklyLeaderboard();

  // Find user placement
  const userRank = list.findIndex(r => r.isUser) + 1;

  container.innerHTML = `
    <div class="card card-3d league-banner">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span class="league-shield">🛡️</span>
          <span class="league-tier-name">${profile.leagueTier} League Standings</span>
        </div>
        <div class="league-rank-pill">Your Rank: <strong>#${userRank}</strong></div>
      </div>
      <p class="hint" style="margin-top: 8px;">Top 3 promote to next league tier at end of week. Bottom 3 face demotion. Standings update when you log completions.</p>
    </div>

    <!-- Leaderboard list -->
    <div class="card card-3d league-leaderboard-card">
      <div class="leaderboard-header-row">
        <span>Competitor</span>
        <span>Weekly XP</span>
      </div>
      
      <div class="leaderboard-rows-list">
        ${list.map((row, idx) => {
          const rank = idx + 1;
          let rankBadge = `${rank}`;
          if (rank === 1) rankBadge = "🥇";
          else if (rank === 2) rankBadge = "🥈";
          else if (rank === 3) rankBadge = "🥉";

          const rowClass = row.isUser ? 'leaderboard-row user-highlight-row' : 'leaderboard-row';
          const promotionZone = rank <= 3 ? 'promo-zone-indicator' : rank >= 8 ? 'demoto-zone-indicator' : '';

          return `
            <div class="${rowClass} ${promotionZone}">
              <div class="leaderboard-competitor-left">
                <span class="row-rank-num">${rankBadge}</span>
                <span class="row-player-name">${row.name}</span>
              </div>
              <div class="leaderboard-competitor-right">
                <span class="row-player-xp">${row.xp} XP</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Simulator debug section -->
    <div class="card card-3d league-debug-card" style="text-align: center; border-color: var(--duo-blue);">
      <h4>⚙️ Simulator Debug Panel</h4>
      <p class="hint">Manually end the league week to trigger promotions, demotions, and diamond rewards instantly.</p>
      <button class="btn btn-primary btn-3d btn-sm btn-full" id="debug-end-week-btn" style="margin-top:10px;">⚡ Simulate Weekly League Reset</button>
    </div>
  `;

  // Bind weekly reset debug button
  container.querySelector('#debug-end-week-btn').addEventListener('click', () => {
    checkLeagueEndOfWeek(true); // force reset
    renderLeagueView(container); // reload
  });
}

// VIEW 3: HABITS CHAIN & HEATMAP VIEW
function renderIntegrityView(container) {
  const history = getAllDays();
  const profile = getProfile();

  // Compile calendar cell records
  const today = new Date();
  const cells = [];
  
  // Pull previous 30 calendar days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = getDay(dateStr);
    cells.push({
      dateStr,
      dayNum: d.getDate(),
      log
    });
  }

  // Compile missed reasons counts
  const reasonsCounts = {};
  let totalMissed = 0;
  let totalCompleted = 0;

  for (const date in history) {
    if (history[date] && history[date].blocks) {
      history[date].blocks.forEach(b => {
        if (b.status === 'completed') {
          totalCompleted++;
        } else if (b.status === 'missed') {
          totalMissed++;
          const reason = b.missReason || '📱 Distracted';
          reasonsCounts[reason] = (reasonsCounts[reason] || 0) + 1;
        }
      });
    }
  }

  // Sort skip reasons by frequency
  const sortedReasons = Object.keys(reasonsCounts).map(reason => {
    return { reason, count: reasonsCounts[reason] };
  }).sort((a, b) => b.count - a.count);

  container.innerHTML = `
    <!-- Glowing Heatmap Calendar Grid -->
    <div class="card card-3d heatmap-card">
      <h3>⛓️ \"Don't Break the Chain\" Heatmap</h3>
      
      <div class="heatmap-grid-layout">
        ${cells.map(c => {
          let cellClass = 'heatmap-cell-unplanned';
          let tooltipText = `${c.dateStr}: No schedule planned`;
          
          if (c.log && c.log.isCommitted) {
            if (c.log.isReviewed) {
              const blocks = c.log.blocks;
              const total = blocks.length;
              const completed = blocks.filter(b => b.status === 'completed').length;
              const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              tooltipText = `${c.dateStr}: ${rate}% compliance (${completed}/${total} blocks)`;
              
              if (rate === 100) cellClass = 'heatmap-cell-perfect';
              else if (rate >= 75) cellClass = 'heatmap-cell-good';
              else if (rate >= 50) cellClass = 'heatmap-cell-medium';
              else cellClass = 'heatmap-cell-low';
            } else {
              cellClass = 'heatmap-cell-pending';
              tooltipText = `${c.dateStr}: Pending review sign-off`;
            }
          } else {
            // Check if past date
            const todayStr = new Date().toISOString().split('T')[0];
            if (c.dateStr < todayStr) {
              cellClass = 'heatmap-cell-skipped';
              tooltipText = `${c.dateStr}: Day skipped completely`;
            }
          }

          return `
            <div class="heatmap-cell ${cellClass}" title="${tooltipText}">
              ${c.dayNum}
            </div>
          `;
        }).join('')}
      </div>

      <div class="heatmap-legend-row">
        <span class="leg-item"><span class="leg-box heatmap-cell-perfect"></span> 100%</span>
        <span class="leg-item"><span class="leg-box heatmap-cell-good"></span> &gt;75%</span>
        <span class="leg-item"><span class="leg-box heatmap-cell-medium"></span> &gt;50%</span>
        <span class="leg-item"><span class="leg-box heatmap-cell-low"></span> &lt;50%</span>
        <span class="leg-item"><span class="leg-box heatmap-cell-skipped"></span> Skip</span>
      </div>
    </div>

    <!-- Skip Reason Analysis Card -->
    <div class="card card-3d skip-analysis-card">
      <h3>📊 Skip Reason Analysis</h3>
      
      <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold; font-size:12px;">
        <span>Blocks completed: <span style="color:var(--duo-green); font-size:14px;">${totalCompleted}</span></span>
        <span>Blocks missed: <span style="color:var(--duo-red); font-size:14px;">${totalMissed}</span></span>
      </div>

      <div class="skip-reasons-bars-list">
        ${sortedReasons.length === 0 ? `
          <div class="empty-state" style="padding:15px 0;"><p>No skipped blocks recorded. Flawless discipline!</p></div>
        ` : sortedReasons.map(item => {
          const percent = totalMissed > 0 ? Math.round((item.count / totalMissed) * 100) : 0;
          return `
            <div class="skip-reason-bar-row">
              <div class="bar-label-row">
                <span class="reason-name-txt">${item.reason}</span>
                <span class="reason-count-txt">${item.count} times (${percent}%)</span>
              </div>
              <div class="bar-track-bg">
                <div class="bar-fill-indicator" style="width: ${percent}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// CANVAS DRAW CHART HELPERS
function drawCategoryChart(data) {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);

  const categories = Object.keys(data);
  const values = Object.values(data);
  const maxVal = Math.max(...values, 5);

  const paddingLeft = 70;
  const paddingTop = 20;
  const paddingRight = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const colors = {
    Study: '#1cb0f6',
    Work: '#ff9600',
    Sleep: '#858585',
    Health: '#58cc02',
    Leisure: '#ff4b4b',
    Admin: '#ffc800'
  };

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const x = paddingLeft + (chartWidth / steps) * i;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop);
    ctx.lineTo(x, height - paddingBottom);
    ctx.stroke();

    ctx.fillStyle = '#afafaf';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const gridVal = Math.round((maxVal / steps) * i * 10) / 10;
    ctx.fillText(`${gridVal}h`, x, height - paddingBottom + 15);
  }

  const barSpacing = chartHeight / categories.length;
  const barHeight = barSpacing * 0.6;

  categories.forEach((cat, index) => {
    const val = data[cat];
    const barWidth = (val / maxVal) * chartWidth;
    const y = paddingTop + index * barSpacing + (barSpacing - barHeight) / 2;

    ctx.fillStyle = '#3f3f3f';
    ctx.beginPath();
    ctx.roundRect(paddingLeft, y, chartWidth, barHeight, 4);
    ctx.fill();

    ctx.fillStyle = colors[cat] || '#afafaf';
    ctx.beginPath();
    ctx.roundRect(paddingLeft, y, barWidth, barHeight, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(cat, paddingLeft - 8, y + barHeight / 2 + 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(val * 10) / 10}h`, Math.max(paddingLeft + barWidth + 5, paddingLeft + 5), y + barHeight / 2 + 4);
  });
}

function drawChronotypeChart(hourStats) {
  const canvas = document.getElementById('chronotype-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const paddingLeft = 35;
  const paddingTop = 25;
  const paddingRight = 15;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const bins = hourStats.map((stat, h) => {
    const rate = stat.total > 0 ? stat.completed / stat.total : 0;
    return { hour: h, rate: rate, count: stat.total };
  });

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = paddingTop + (chartHeight / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = '#afafaf';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - i * 20}%`, paddingLeft - 6, y + 3);
  }

  const binWidth = chartWidth / 24;
  for (let h = 0; h < 24; h += 4) {
    const x = paddingLeft + h * binWidth + binWidth / 2;
    ctx.fillStyle = '#afafaf';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${h}:00`, x, height - paddingBottom + 12);
  }

  ctx.beginPath();
  let firstPoint = true;

  bins.forEach(bin => {
    if (bin.count > 0) {
      const x = paddingLeft + bin.hour * binWidth + binWidth / 2;
      const y = paddingTop + chartHeight - (bin.rate * chartHeight);
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
  });

  ctx.strokeStyle = '#58cc02';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  bins.forEach(bin => {
    if (bin.count > 0) {
      const x = paddingLeft + bin.hour * binWidth + binWidth / 2;
      const y = paddingTop + chartHeight - (bin.rate * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffc800';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  });
}
