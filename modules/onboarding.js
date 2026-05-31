// Modules/onboarding.js
import { getProfile, saveProfile } from './storage.js';

export function renderOnboarding(container, onComplete) {
  let step = 1;
  let goalsList = [];

  function createCustomDropdown(id, placeholder, options, onChange) {
    let selectedValue = "";
    const html = `
      <div class="custom-select" id="${id}">
        <div class="custom-select-trigger card-3d">
          <span class="trigger-text">${placeholder}</span>
          <span class="trigger-arrow">▼</span>
        </div>
        <div class="custom-select-menu hidden card-3d">
          <ul class="custom-select-list">
            ${options.map(opt => `<li data-value="${opt.value}">${opt.label}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    return {
      html,
      init: (elContainer) => {
        const el = elContainer.querySelector(`#${id}`);
        if (!el) return;
        const trigger = el.querySelector('.custom-select-trigger');
        const menu = el.querySelector('.custom-select-menu');
        const listItems = el.querySelectorAll('.custom-select-list li');
        const textSpan = el.querySelector('.trigger-text');
        
        trigger.onclick = (e) => {
          e.stopPropagation();
          document.querySelectorAll('.custom-select-menu').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
          });
          menu.classList.toggle('hidden');
        };
        
        listItems.forEach(item => {
          item.onclick = (e) => {
            e.stopPropagation();
            selectedValue = item.getAttribute('data-value');
            textSpan.textContent = item.textContent;
            textSpan.classList.add('selected');
            menu.classList.add('hidden');
            if (onChange) onChange(selectedValue);
          };
        });
      },
      getValue: () => selectedValue
    };
  }

  const closeDropdowns = () => {
    document.querySelectorAll('.custom-select-menu').forEach(menu => {
      menu.classList.add('hidden');
    });
  };
  document.addEventListener('click', closeDropdowns);

  function renderStep() {
    if (step === 1) {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 100 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));
      const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
      const months = [
        { value: "01", label: "Jan" },
        { value: "02", label: "Feb" },
        { value: "03", label: "Mar" },
        { value: "04", label: "Apr" },
        { value: "05", label: "May" },
        { value: "06", label: "Jun" },
        { value: "07", label: "Jul" },
        { value: "08", label: "Aug" },
        { value: "09", label: "Sep" },
        { value: "10", label: "Oct" },
        { value: "11", label: "Nov" },
        { value: "12", label: "Dec" }
      ];

      const daySelect = createCustomDropdown("ob-dob-day", "Day", days);
      const monthSelect = createCustomDropdown("ob-dob-month", "Month", months);
      const yearSelect = createCustomDropdown("ob-dob-year", "Year", years);

      container.innerHTML = `
        <div class="onboarding-card card-3d animate-pop">
          <div class="onboarding-header">
            <h2>🦉 Welcome to Odyssey!</h2>
            <p>Let's personalize your accountability path. What should we call you?</p>
          </div>

          <div class="onboarding-body">
            <div class="input-group">
              <label for="ob-name">Your Name</label>
              <input type="text" id="ob-name" placeholder="e.g. John Doe" class="card-3d" />
            </div>

            <div class="input-group">
              <label>Date of Birth</label>
              <div class="dob-select-grid">
                ${daySelect.html}
                ${monthSelect.html}
                ${yearSelect.html}
              </div>
            </div>
            
            <p class="onboarding-notice">Your data is stored strictly locally in your browser's localStorage. Offline-first, privacy-first.</p>
          </div>

          <div class="onboarding-footer">
            <button id="ob-next-btn" class="btn btn-primary btn-3d btn-full">Continue ➡️</button>
          </div>
        </div>
      `;

      daySelect.init(container);
      monthSelect.init(container);
      yearSelect.init(container);

      // Bind next click
      container.querySelector('#ob-next-btn').onclick = () => {
        const nameInput = container.querySelector('#ob-name').value.trim();
        const dayVal = daySelect.getValue();
        const monthVal = monthSelect.getValue();
        const yearVal = yearSelect.getValue();

        if (!nameInput) {
          alert("Please enter your name to get started!");
          return;
        }
        if (!dayVal || !monthVal || !yearVal) {
          alert("Please select your complete Date of Birth!");
          return;
        }

        // Save progress to temp memory and go to step 2
        window.tempo_ob_name = nameInput;
        window.tempo_ob_dob = `${yearVal}-${monthVal}-${dayVal}`;
        step = 2;
        renderStep();
      };
    } else if (step === 2) {
      container.innerHTML = `
        <div class="onboarding-card card-3d animate-pop" style="max-height: 90%; overflow-y: auto;">
          <div class="onboarding-header">
            <h2>🎯 Prioritize Your Goals</h2>
            <p>Define your core focuses. Drag the goal blocks or use the arrows to set their priority.</p>
          </div>

          <div class="onboarding-body">
            <!-- Add Goal Form -->
            <div class="onboarding-add-goal-form">
              <input type="text" id="ob-goal-input" placeholder="e.g. Get 1cr package or run a marathon" class="card-3d" />
              <button id="ob-add-goal-btn" class="btn btn-secondary btn-3d">Add</button>
            </div>

            <!-- Priority Goals List -->
            <ul class="onboarding-goals-list" id="goals-sortable-list">
              <!-- Injected dynamically -->
            </ul>
          </div>

          <div class="onboarding-footer">
            <button id="ob-finish-btn" class="btn btn-success btn-3d btn-full">Save & Get Started! 🚀</button>
          </div>
        </div>
      `;

      // Bind actions
      container.querySelector('#ob-add-goal-btn').onclick = () => {
        const goalInput = container.querySelector('#ob-goal-input');
        const text = goalInput.value.trim();
        if (text) {
          goalsList.push(text);
          goalInput.value = '';
          renderGoalsList();
        }
      };

      container.querySelector('#ob-finish-btn').onclick = () => {
        const profile = getProfile();
        profile.hasCompletedOnboarding = true;
        profile.name = window.tempo_ob_name;
        profile.dob = window.tempo_ob_dob;
        
        // Save goals with explicit priority ranks
        profile.goals = goalsList.map((g, idx) => ({
          id: `goal_${Date.now()}_${idx}`,
          text: g,
          priority: idx + 1
        }));
        
        // Start counting today
        const today = new Date();
        profile.createdDate = today.toISOString().split('T')[0];
        
        saveProfile(profile);
        onComplete();
      };

      // Initial list render
      renderGoalsList();
    }
  }

  function renderGoalsList() {
    const listEl = container.querySelector('#goals-sortable-list');
    if (!listEl) return;

    if (goalsList.length === 0) {
      listEl.innerHTML = `<li class="goal-empty-placeholder">No goals added yet. Add some above to start!</li>`;
      return;
    }

    listEl.innerHTML = goalsList.map((goal, idx) => `
      <li class="goal-draggable-item card-3d" draggable="true" data-index="${idx}">
        <div class="goal-left">
          <div class="goal-drag-handle">☰</div>
          <span class="goal-number-badge">${idx + 1}</span>
          <span class="goal-text">${goal}</span>
        </div>
        <div class="goal-actions">
          <div class="arrow-buttons">
            <button class="arrow-btn move-up-btn" data-index="${idx}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="arrow-btn move-down-btn" data-index="${idx}" title="Move Down" ${idx === goalsList.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <button class="goal-remove-btn" data-index="${idx}" title="Remove Goal">&times;</button>
        </div>
      </li>
    `).join('');

    // Bind remove buttons
    listEl.querySelectorAll('.goal-remove-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        goalsList.splice(index, 1);
        renderGoalsList();
      };
    });

    // Bind move arrows (for mobile compatibility)
    listEl.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        if (index > 0) {
          const temp = goalsList[index];
          goalsList[index] = goalsList[index - 1];
          goalsList[index - 1] = temp;
          renderGoalsList();
        }
      };
    });

    listEl.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        if (index < goalsList.length - 1) {
          const temp = goalsList[index];
          goalsList[index] = goalsList[index + 1];
          goalsList[index + 1] = temp;
          renderGoalsList();
        }
      };
    });

    // --- HTML5 Drag and Drop Sorting Listeners ---
    listEl.querySelectorAll('.goal-draggable-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        // Serialize the reordered DOM back into the goalsList array
        const domItems = [...listEl.querySelectorAll('.goal-draggable-item')];
        goalsList = domItems.map(di => di.querySelector('.goal-text').textContent);
        renderGoalsList();
      });
    });

    listEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingEl = listEl.querySelector('.dragging');
      if (!draggingEl) return;

      const siblings = [...listEl.querySelectorAll('.goal-draggable-item:not(.dragging)')];
      
      const nextSibling = siblings.find(sibling => {
        const rect = sibling.getBoundingClientRect();
        const offset = e.clientY - rect.top - rect.height / 2;
        return offset < 0;
      });

      listEl.insertBefore(draggingEl, nextSibling);
    });
  }

  // Start the flow
  renderStep();
}
