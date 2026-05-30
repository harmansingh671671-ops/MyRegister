// Modules/planner.js
import { getDay, saveDay, getProfile, saveProfile } from './storage.js';
import { showConfirm } from './notifications.js';

function getTomorrowDateStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function renderPlanner(container) {
  const dateStr = getTomorrowDateStr();
  const dayLog = getDay(dateStr);
  const profile = getProfile();

  container.innerHTML = `
    <div class="view-header">
      <h2>📝 Plan Your Tomorrow</h2>
      <p class="subtitle">Set your intentions hour-by-hour. Be realistic and align focus with your energy levels.</p>
    </div>

    <div class="planner-layout">
      <!-- Left Column: Planning Form & Templates -->
      <div class="planner-sidebar">
        <div class="card card-3d">
          <h3>⚡ Quick Templates</h3>
          <p class="hint">Tap a template to add a typical focus block quickly.</p>
          <div class="template-grid">
            <button class="btn btn-secondary btn-3d template-btn" data-title="Deep Coding" data-category="Work" data-duration="120" data-energy="high">💻 Deep Coding (2h)</button>
            <button class="btn btn-secondary btn-3d template-btn" data-title="Study Session" data-category="Study" data-duration="90" data-energy="high">📚 Study (1.5h)</button>
            <button class="btn btn-secondary btn-3d template-btn" data-title="Admin & Email" data-category="Admin" data-duration="60" data-energy="low">📧 Admin Tasks (1h)</button>
            <button class="btn btn-secondary btn-3d template-btn" data-title="Gym / Cardio" data-category="Health" data-duration="60" data-energy="medium">🏃 Workout (1h)</button>
            <button class="btn btn-secondary btn-3d template-btn" data-title="Mindful Wind-down" data-category="Leisure" data-duration="60" data-energy="low">🧘 Leisure (1h)</button>
            <button class="btn btn-secondary btn-3d template-btn" data-title="Deep Sleep" data-category="Sleep" data-duration="480" data-energy="low">🛌 Sleep (8h)</button>
          </div>
        </div>

        <div class="card card-3d planner-form-card">
          <h3>➕ Add Custom Block</h3>
          <form id="block-form" class="planner-form">
            <div class="form-group">
              <label for="block-title">Task Title</label>
              <input type="text" id="block-title" placeholder="e.g., Learn French on Duolingo" required autocomplete="off">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="block-start">Start Time</label>
                <input type="time" id="block-start" required>
              </div>
              <div class="form-group">
                <label for="block-end">End Time</label>
                <input type="time" id="block-end" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="block-category">Category</label>
                <select id="block-category" required>
                  <option value="Study">📚 Study</option>
                  <option value="Work">💻 Work</option>
                  <option value="Sleep">🛌 Sleep</option>
                  <option value="Health">🏃 Health</option>
                  <option value="Leisure">🧘 Leisure</option>
                  <option value="Admin">📧 Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label for="block-energy">Expected Energy</label>
                <select id="block-energy" required>
                  <option value="high">🔥 High Energy</option>
                  <option value="medium">⚡ Medium Energy</option>
                  <option value="low">💤 Low Energy</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-3d btn-full">Add to Timeline</button>
          </form>
        </div>
      </div>

      <!-- Right Column: Timeline Visualizer -->
      <div class="planner-main">
        <div class="card card-3d timeline-container-card">
          <div class="timeline-header-row">
            <h3>📅 Schedule for ${dateStr}</h3>
            <span class="badge badge-date">Tomorrow</span>
          </div>

          <div id="overlap-warning" class="warning-alert hidden">
            ⚠️ Warning: Some blocks overlap in time. Please adjust.
          </div>

          <div id="timeline-list" class="timeline-list">
            <!-- Timeline items will be injected here -->
          </div>

          <div class="planner-actions">
            ${dayLog.isCommitted 
              ? `<div class="committed-banner">🔒 This schedule is locked and committed. See you tomorrow!</div>` 
              : `<button id="commit-schedule-btn" class="btn btn-success btn-3d btn-lg btn-full">✍️ Sign & Commit Schedule</button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Internal state
  let currentBlocks = [...dayLog.blocks];

  const timelineList = container.querySelector('#timeline-list');
  const blockForm = container.querySelector('#block-form');
  const overlapWarning = container.querySelector('#overlap-warning');

  // Render the timeline list sorted by start time
  function renderTimelineItems() {
    currentBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Check for overlaps
    let hasOverlap = false;
    for (let i = 0; i < currentBlocks.length - 1; i++) {
      if (currentBlocks[i].endTime > currentBlocks[i+1].startTime) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) {
      overlapWarning.classList.remove('hidden');
    } else {
      overlapWarning.classList.add('hidden');
    }

    if (currentBlocks.length === 0) {
      timelineList.innerHTML = `
        <div class="empty-state">
          <p>Your timeline is empty. Add blocks to design your tomorrow!</p>
        </div>
      `;
      return;
    }

    timelineList.innerHTML = currentBlocks.map((block, index) => {
      let energyClass = 'energy-low';
      let energyEmoji = '💤';
      if (block.energy === 'high') {
        energyClass = 'energy-high';
        energyEmoji = '🔥';
      } else if (block.energy === 'medium') {
        energyClass = 'energy-med';
        energyEmoji = '⚡';
      }

      return `
        <div class="timeline-item card-3d" data-index="${index}">
          <div class="timeline-time">
            <span class="time-start">${block.startTime}</span>
            <span class="time-arrow">↓</span>
            <span class="time-end">${block.endTime}</span>
          </div>
          <div class="timeline-content-card ${block.category.toLowerCase()}-category">
            <div class="timeline-details">
              <span class="timeline-title">${block.title}</span>
              <div class="timeline-metadata">
                <span class="tag-category">${block.category}</span>
                <span class="tag-energy ${energyClass}">${energyEmoji} ${block.energy.toUpperCase()}</span>
              </div>
            </div>
            ${!dayLog.isCommitted ? `
              <button class="delete-block-btn" data-index="${index}" title="Remove Block">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach delete listeners
    if (!dayLog.isCommitted) {
      timelineList.querySelectorAll('.delete-block-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'));
          currentBlocks.splice(idx, 1);
          saveCurrentBlocks();
        });
      });
    }
  }

  function saveCurrentBlocks() {
    dayLog.blocks = currentBlocks;
    saveDay(dateStr, dayLog);
    renderTimelineItems();
  }

  // Handle custom block submission
  blockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (dayLog.isCommitted) return;

    const title = container.querySelector('#block-title').value;
    const startTime = container.querySelector('#block-start').value;
    const endTime = container.querySelector('#block-end').value;
    const category = container.querySelector('#block-category').value;
    const energy = container.querySelector('#block-energy').value;

    if (startTime >= endTime) {
      alert("End time must be after start time.");
      return;
    }

    const newBlock = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      startTime,
      endTime,
      title,
      category,
      energy,
      status: 'pending'
    };

    currentBlocks.push(newBlock);
    saveCurrentBlocks();
    
    // Reset title only
    container.querySelector('#block-title').value = '';
    container.querySelector('#block-title').focus();
  });

  // Handle template quick-adds
  container.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (dayLog.isCommitted) return;

      const title = btn.getAttribute('data-title');
      const category = btn.getAttribute('data-category');
      const duration = parseInt(btn.getAttribute('data-duration'));
      const energy = btn.getAttribute('data-energy');

      // Determine a smart start time: after the last block, or starting at 08:00 if no blocks exist
      let startHour = 8;
      let startMin = 0;
      if (currentBlocks.length > 0) {
        currentBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
        const lastBlock = currentBlocks[currentBlocks.length - 1];
        const parts = lastBlock.endTime.split(':');
        startHour = parseInt(parts[0]);
        startMin = parseInt(parts[1]);
      }

      // Add 5 min buffer
      startMin += 5;
      if (startMin >= 60) {
        startHour = (startHour + 1) % 24;
        startMin %= 60;
      }

      // Calculate end time
      let endHour = startHour + Math.floor((startMin + duration) / 60);
      let endMin = (startMin + duration) % 60;
      endHour = endHour % 24;

      const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const newBlock = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        startTime: formatTime(startHour, startMin),
        endTime: formatTime(endHour, endMin),
        title,
        category,
        energy,
        status: 'pending'
      };

      currentBlocks.push(newBlock);
      saveCurrentBlocks();
    });
  });

  // Handle commit schedule
  const commitBtn = container.querySelector('#commit-schedule-btn');
  if (commitBtn) {
    commitBtn.addEventListener('click', async () => {
      if (currentBlocks.length === 0) {
        alert("Please add at least one schedule block before committing.");
        return;
      }

      const yes = await showConfirm("Are you ready to commit this schedule? Once signed, you cannot modify blocks directly until the reflection phase.");
      if (yes) {
        // Mark committed
        dayLog.isCommitted = true;
        saveDay(dateStr, dayLog);

        // Update profile lastPlanDate
        profile.lastPlanDate = dateStr;
        
        // Award 1 diamond for committing plan the night before
        profile.diamonds += 1;
        
        saveProfile(profile);

        // Success message & re-render
        alert("✍️ Commitment Contract signed! You earned +1 💎. See you tomorrow morning!");
        window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'dashboard' }));
      }
    });
  }

  // Initial timeline render
  renderTimelineItems();
}
