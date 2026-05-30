import { getProfile, saveProfile, getCustomReasons, addCustomReason, removeCustomReason, exportJSON, importJSON } from './storage.js';
import { showConfirm } from './notifications.js';
import { renderIntegrityPanel } from './integrity.js';

export function renderSettings(container) {
  container.innerHTML = `
    <div class="view-header">
      <h2>⚙️ Settings & Configuration</h2>
      <p class="subtitle">Customize accountability reasons and manage local database backups.</p>
    </div>

    <div class="settings-layout-grid">
      <!-- Left Box: Profile Card -->
      <div class="card card-3d">
        <h3>👤 Account Profile</h3>
        <p class="hint">Your personal details and priority goals saved in this local profile.</p>
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Name:</strong> <span id="profile-display-name"></span></div>
          <div><strong>Date of Birth:</strong> <span id="profile-display-dob"></span></div>
          <div><strong>Account Created:</strong> <span id="profile-display-created"></span></div>
          <div style="margin-top: 10px;">
            <strong>Your Priority Goals:</strong>
            <ul id="profile-display-goals" style="list-style: none; margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
              <!-- Goals listed -->
            </ul>
          </div>
          <button id="settings-reset-ob-btn" class="btn btn-secondary btn-3d btn-full btn-sm" style="margin-top: 12px; background: var(--bg-hover); border-color: var(--border-color);">🔄 Reset Account & Onboarding</button>
        </div>
      </div>

      <!-- Center Box: Custom Reasons -->
      <div class="card card-3d">
        <h3>🧠 Custom Miss Reasons</h3>
        <p class="hint">Create reasons you actually experience. This removes app judgment and keeps reflection highly personal.</p>
        
        <div class="settings-reasons-wrapper">
          <ul id="settings-reasons-list" class="reasons-list-ui">
            <!-- Rendered in JS -->
          </ul>
          
          <form id="settings-add-reason-form" class="add-reason-form">
            <input type="text" id="settings-new-reason-input" placeholder="e.g. 🥱 Over-committed / Burnout" required autocomplete="off">
            <button type="submit" class="btn btn-primary btn-3d">Add</button>
          </form>
        </div>
      </div>

      <!-- Right Box: Data Controls -->
      <div class="card card-3d">
        <h3>📂 Data Ownership & Privacy</h3>
        <p class="hint">Download or restore all database records. Tempo runs entirely in your sandbox browser.</p>
        
        <div class="settings-backup-controls" style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
          <button id="settings-export-btn" class="btn btn-secondary btn-3d btn-full">⬇️ Export Backup (JSON)</button>
          
          <div class="import-wrapper">
            <label for="settings-import-input" class="btn btn-secondary btn-3d btn-full btn-import-label">⬆️ Import Backup</label>
            <input type="file" id="settings-import-input" accept=".json" style="display: none;">
          </div>

          <button id="settings-wipe-btn" class="btn btn-danger btn-3d btn-full btn-sm">🗑️ Permanently Wipe All Data</button>
        </div>
      </div>
    </div>
    <!-- Device Integrity Simulator -->
    <div id="settings-integrity-container" style="margin-top: 20px;"></div>
  `;

  const listContainer = container.querySelector('#settings-reasons-list');
  const addForm = container.querySelector('#settings-add-reason-form');
  const addInput = container.querySelector('#settings-new-reason-input');

  const renderProfileInfo = () => {
    const profile = getProfile();
    container.querySelector('#profile-display-name').textContent = profile.name || 'Not set';
    container.querySelector('#profile-display-dob').textContent = profile.dob || 'Not set';
    container.querySelector('#profile-display-created').textContent = profile.createdDate || 'Not set';

    const goalsContainer = container.querySelector('#profile-display-goals');
    if (profile.goals && profile.goals.length > 0) {
      const sortedGoals = [...profile.goals].sort((a, b) => a.priority - b.priority);
      goalsContainer.innerHTML = sortedGoals.map(g => `
        <li style="background: var(--bg-dark); border: 2px solid var(--border-color); padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="background: var(--duo-blue); color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;">${g.priority}</span>
          <span style="font-size: 13px; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${g.text}</span>
        </li>
      `).join('');
    } else {
      goalsContainer.innerHTML = `<li class="hint">No goals created yet.</li>`;
    }
  };

  container.querySelector('#settings-reset-ob-btn').onclick = async () => {
    const yes = await showConfirm("Resetting will wipe your current name, DOB, and goals, and take you back to the onboarding wizard. Continue?");
    if (yes) {
      const profile = getProfile();
      profile.hasCompletedOnboarding = false;
      profile.name = '';
      profile.dob = '';
      profile.goals = [];
      profile.createdDate = '';
      profile.weekNames = {};
      saveProfile(profile);
      // Navigate to onboarding
      window.dispatchEvent(new CustomEvent('tempo_navigate', { detail: 'onboarding' }));
    }
  };

  const renderList = () => {
    const list = getCustomReasons();
    listContainer.innerHTML = list.map(r => `
      <li>
        <span>${r}</span>
        <button class="delete-reason-btn s-del-btn" data-reason="${r}">&times;</button>
      </li>
    `).join('');

    listContainer.querySelectorAll('.s-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = btn.getAttribute('data-reason');
        removeCustomReason(r);
        renderList();
      });
    });
  };

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = addInput.value;
    if (addCustomReason(val)) {
      addInput.value = '';
      renderList();
    }
  });

  // Backup Export
  container.querySelector('#settings-export-btn').addEventListener('click', () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Backup Import
  const fileInput = container.querySelector('#settings-import-input');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imported = importJSON(evt.target.result);
      if (imported) {
        alert("✅ Backup restored successfully! Reloading page...");
      } else {
        alert("❌ Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  });

  // Wipe Data
  container.querySelector('#settings-wipe-btn').addEventListener('click', async () => {
    const yes = await showConfirm("⚠️ Are you sure you want to permanently clear all logs, streaks, and settings? This cannot be undone!");
    if (yes) {
      localStorage.clear();
      window.location.reload();
    }
  });

  renderList();
  renderProfileInfo();

  // Render Integrity Panel
  const integrityContainer = container.querySelector('#settings-integrity-container');
  if (integrityContainer) {
    renderIntegrityPanel(integrityContainer);
  }
}
