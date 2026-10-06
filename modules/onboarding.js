// Modules/onboarding.js - Modern UI Version
import { getProfile, saveProfile } from './storage.js';
import { sanitizeHTML } from './security.js';

export function renderOnboarding(container, onComplete) {
  let step = 1;
  let goalsList = [];

  // Clear container
  container.innerHTML = '';

  // Add onboarding-specific styles
  container.classList.add('onboarding-container');

  function renderStep() {
    if (step === 1) {
      // Personal Info Step
      container.innerHTML = `
        <div class="onboarding-step glass-card animate-fade-in">
          <div class="onboarding-header">
            <div class="onboarding-progress">
              <div class="progress-step active">1</div>
              <div class="progress-line"></div>
              <div class="progress-step">2</div>
              <div class="progress-line"></div>
              <div class="progress-step">3</div>
            </div>
            <h2 class="onboarding-title">
              <i class="fas fa-rocket"></i>
              <span>Welcome to Odyssey!</span>
            </h2>
            <p class="onboarding-subtitle">Let's get started with your productivity journey</p>
          </div>

          <div class="onboarding-content">
            <div class="form-group">
              <label class="form-label">What should we call you?</label>
              <input type="text" id="ob-name" class="form-input" placeholder="Enter your name">
            </div>

            <div class="form-group">
              <label class="form-label">When were you born?</label>
              <div class="birthday-inputs">
                <select id="ob-month" class="form-input">
                  <option value="">Month</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select id="ob-day" class="form-input">
                  <option value="">Day</option>
                  ${Array.from({length: 31}, (_, i) => `<option value="${String(i+1).padStart(2, '0')}">${i+1}</option>`).join('')}
                </select>
                <select id="ob-year" class="form-input">
                  <option value="">Year</option>
                  ${Array.from({length: 100}, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return `<option value="${year}">${year}</option>`;
                  }).join('')}
                </select>
              </div>
            </div>

            <p class="onboarding-notice">
              <i class="fas fa-shield-alt"></i>
              <span>Your data is stored locally and never shared</span>
            </p>
          </div>

          <div class="onboarding-footer">
            <button class="btn btn-primary btn-lg" onclick="nextStep()">
              <span>Continue</span>
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;

      // Bind next button
      window.nextStep = () => {
        const nameInput = document.getElementById('ob-name');
        const monthInput = document.getElementById('ob-month');
        const dayInput = document.getElementById('ob-day');
        const yearInput = document.getElementById('ob-year');

        if (!nameInput.value.trim()) {
          showError('Please enter your name');
          return;
        }
        if (!monthInput.value || !dayInput.value || !yearInput.value) {
          showError('Please select your complete date of birth');
          return;
        }

        // Save progress
        window.tempo_ob_name = nameInput.value.trim();
        window.tempo_ob_dob = `${yearInput.value}-${monthInput.value}-${dayInput.value}`;
        step = 2;
        renderStep();
      };

    } else if (step === 2) {
      // Goals Step
      container.innerHTML = `
        <div class="onboarding-step glass-card animate-fade-in">
          <div class="onboarding-header">
            <div class="onboarding-progress">
              <div class="progress-step done">1</div>
              <div class="progress-line done"></div>
              <div class="progress-step active">2</div>
              <div class="progress-line"></div>
              <div class="progress-step">3</div>
            </div>
            <h2 class="onboarding-title">
              <i class="fas fa-bullseye"></i>
              <span>Set Your Goals</span>
            </h2>
            <p class="onboarding-subtitle">What do you want to achieve? Add your top priorities</p>
          </div>

          <div class="onboarding-content">
            <div class="goals-input">
              <input type="text" id="ob-goal-input" class="form-input" placeholder="e.g., Get fit, Learn a new skill, Build a business...">
              <button class="btn btn-primary" onclick="addGoal()">
                <i class="fas fa-plus"></i>
                <span>Add</span>
              </button>
            </div>

            <div class="goals-list" id="goals-list">
              ${goalsList.length === 0 ? '<p class="empty-message">No goals added yet. Start by adding one above!</p>' : ''}
            </div>

            <div class="goal-tips">
              <div class="tip">
                <i class="fas fa-lightbulb"></i>
                <span>Tip: Focus on 3-5 main goals for best results</span>
              </div>
            </div>
          </div>

          <div class="onboarding-footer">
            <button class="btn btn-secondary" onclick="prevStep()">
              <i class="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>
            <button class="btn btn-primary btn-lg" onclick="nextStep()" ${goalsList.length === 0 ? 'disabled' : ''}>
              <span>Continue</span>
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;

      // Bind actions
      window.addGoal = () => {
        const input = document.getElementById('ob-goal-input');
        const text = input.value.trim();
        if (text) {
          goalsList.push(text);
          input.value = '';
          renderGoalsList();
        }
      };

      window.prevStep = () => {
        step = 1;
        renderStep();
      };

      window.nextStep = () => {
        if (goalsList.length === 0) {
          showError('Please add at least one goal');
          return;
        }
        step = 3;
        renderStep();
      };

      renderGoalsList();

    } else if (step === 3) {
      // Review & Complete Step
      container.innerHTML = `
        <div class="onboarding-step glass-card animate-fade-in">
          <div class="onboarding-header">
            <div class="onboarding-progress">
              <div class="progress-step done">1</div>
              <div class="progress-line done"></div>
              <div class="progress-step done">2</div>
              <div class="progress-line done"></div>
              <div class="progress-step active">3</div>
            </div>
            <h2 class="onboarding-title">
              <i class="fas fa-check-circle"></i>
              <span>Almost Done!</span>
            </h2>
            <p class="onboarding-subtitle">Review your information and start your journey</p>
          </div>

          <div class="onboarding-content">
            <div class="review-card">
              <div class="review-item">
                <div class="review-label">
                  <i class="fas fa-user"></i>
                  <span>Name</span>
                </div>
                <div class="review-value">${sanitizeHTML(window.tempo_ob_name || 'Not set')}</div>
              </div>
              <div class="review-item">
                <div class="review-label">
                  <i class="fas fa-birthday-cake"></i>
                  <span>Birthday</span>
                </div>
                <div class="review-value">${sanitizeHTML(window.tempo_ob_dob ? new Date(window.tempo_ob_dob).toLocaleDateString() : 'Not set')}</div>
              </div>
              <div class="review-item">
                <div class="review-label">
                  <i class="fas fa-bullseye"></i>
                  <span>Goals (${goalsList.length})</span>
                </div>
                <div class="review-goals">
                  ${goalsList.map(goal => `<span class="goal-tag">${sanitizeHTML(goal)}</span>`).join('')}
                </div>
              </div>
            </div>

            <div class="onboarding-features">
              <h4>What you'll get:</h4>
              <ul class="features-list">
                <li><i class="fas fa-check"></i> Personalized habit tracking</li>
                <li><i class="fas fa-check"></i> Daily progress monitoring</li>
                <li><i class="fas fa-check"></i> Achievement system with ranks</li>
                <li><i class="fas fa-check"></i> Social features (coming soon)</li>
              </ul>
            </div>
          </div>

          <div class="onboarding-footer">
            <button class="btn btn-secondary" onclick="prevStep()">
              <i class="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>
            <button class="btn btn-success btn-lg" onclick="completeOnboarding()">
              <i class="fas fa-rocket"></i>
              <span>Start Journey</span>
            </button>
          </div>
        </div>
      `;

      window.prevStep = () => {
        step = 2;
        renderStep();
      };

      window.completeOnboarding = () => {
        const profile = getProfile();
        profile.hasCompletedOnboarding = true;
        profile.name = window.tempo_ob_name;
        profile.dob = window.tempo_ob_dob;
        
        // Save goals
        profile.goals = goalsList.map((g, idx) => ({
          id: `goal_${Date.now()}_${idx}`,
          text: g,
          priority: idx + 1
        }));
        
        // Start counting today
        const today = new Date();
        profile.createdDate = today.toISOString().split('T')[0];
        
        saveProfile(profile);
        
        // Show welcome toast
        setTimeout(() => {
          showToast('Welcome to Odyssey! Your journey begins now!', 'success', 5000);
        }, 500);
        
        if (onComplete) onComplete();
      };
    }
  }

  function renderGoalsList() {
    const listEl = document.getElementById('goals-list');
    if (!listEl) return;

    if (goalsList.length === 0) {
      listEl.innerHTML = '<p class="empty-message">No goals added yet. Start by adding one above!</p>';
      return;
    }

    listEl.innerHTML = goalsList.map((goal, idx) => `
      <div class="goal-item glass-card">
        <div class="goal-content">
          <span class="goal-number">${idx + 1}</span>
          <span class="goal-text">${sanitizeHTML(goal)}</span>
        </div>
        <button class="goal-remove" onclick="removeGoal(${idx})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    // Update next button state
    const nextBtn = document.querySelector('.btn-primary:not(.btn-lg)');
    if (nextBtn) {
      nextBtn.disabled = goalsList.length === 0;
    }
  }

  function showError(message) {
    // Create error display
    const errorEl = document.createElement('div');
    errorEl.className = 'onboarding-error animate-fade-in';
    errorEl.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${sanitizeHTML(message)}</span>
    `;
    
    // Find a place to display it
    const container = document.querySelector('.onboarding-content');
    if (container) {
      // Remove existing errors
      container.querySelectorAll('.onboarding-error').forEach(el => el.remove());
      container.appendChild(errorEl);
      
      // Remove after 3 seconds
      setTimeout(() => {
        errorEl.classList.add('fade-out');
        setTimeout(() => errorEl.remove(), 300);
      }, 3000);
    }
  }

  window.removeGoal = (index) => {
    goalsList.splice(index, 1);
    renderGoalsList();
  };

  // Start the flow
  renderStep();
}
