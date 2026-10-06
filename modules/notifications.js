// Modules/notifications.js - Modern UI Version
// Audio synthesis, push notifications, and custom toasts/dialogs

import { getProfile } from './storage.js';
import { sanitizeHTML } from './security.js';

let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.warn('Audio context resume failed:', e));
    }
    return audioCtx;
  } catch (e) {
    console.warn('Audio context unavailable:', e);
    return null;
  }
}

// Synthesize custom chimes based on user's equipped sound pack
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const profile = getProfile();
    const soundPack = profile.equippedSound || 'default';
    const now = ctx.currentTime;

    if (soundPack === 'scifi') {
      const freqs = [900, 1100, 1400];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + index * 0.05);
        gainNode.gain.setValueAtTime(0, now + index * 0.05);
        gainNode.gain.linearRampToValueAtTime(0.08, now + index * 0.05 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.04);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + index * 0.05);
        osc.stop(now + index * 0.05 + 0.05);
      });
    } else if (soundPack === 'zen') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (soundPack === 'retro') {
      const notes = [987.77, 1318.51];
      const durations = [0.08, 0.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        const start = now + (index === 0 ? 0 : 0.07);
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.12, start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + durations[index]);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + durations[index]);
      });
    } else {
      const freqs = [523.25, 659.25, 783.99];
      const duration = 0.08;
      const delay = 0.06;
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * delay);
        gainNode.gain.setValueAtTime(0, now + index * delay);
        gainNode.gain.linearRampToValueAtTime(0.15, now + index * delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * delay + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + index * delay);
        osc.stop(now + index * delay + duration);
      });
    }
  } catch (e) {
    console.warn('Audio play blocked or failed:', e);
  }
}

export function playPivotSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const freqs = [440, 550, 660];
    
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      gainNode.gain.setValueAtTime(0, now + index * 0.05);
      gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.05 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.2);
    });
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

export function playUnlockSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const freqs = [880, 1100, 1320, 1760];
    
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);
      gainNode.gain.setValueAtTime(0, now + index * 0.04);
      gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.04 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.3);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.3);
    });
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

// Toast Notification System
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type} animate-fade-in-right`;
  
  // Toast icons
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };
  
  const iconClass = icons[type] || icons.info;
  
  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span class="toast-message">${sanitizeHTML(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add toast to container
  container.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto remove after duration
  const timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
  
  // Close button functionality
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
}

// Prompt Dialog
export function showPrompt(title, defaultValue = '', callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content glass-card animate-pop">
      <div class="modal-header">
        <h3 class="modal-title">${sanitizeHTML(title)}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <input type="text" class="form-input" value="${sanitizeHTML(defaultValue)}" id="prompt-input" autofocus>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">
          Cancel
        </button>
        <button class="btn btn-primary" onclick="confirmPrompt(this)">
          Confirm
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus input
  const input = modal.querySelector('#prompt-input');
  if (input) {
    input.focus();
    input.select();
  }
  
  // Define confirm function
  window.confirmPrompt = function(btn) {
    const modal = btn.closest('.modal');
    const input = modal.querySelector('#prompt-input');
    if (callback && input) {
      callback(input.value);
    }
    modal.remove();
    delete window.confirmPrompt;
  };
  
  // Close on escape
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.remove();
    }
    if (e.key === 'Enter') {
      const input = modal.querySelector('#prompt-input');
      if (callback && input) {
        callback(input.value);
      }
      modal.remove();
    }
  });
}

// Confirm Dialog
export function showConfirm(title, message, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content glass-card animate-pop">
      <div class="modal-header">
        <h3 class="modal-title">${sanitizeHTML(title)}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>${sanitizeHTML(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">
          Cancel
        </button>
        <button class="btn btn-danger" onclick="confirmAction(this)">
          Confirm
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Define confirm function
  window.confirmAction = function(btn) {
    const modal = btn.closest('.modal');
    if (callback) {
      callback(true);
    }
    modal.remove();
    delete window.confirmAction;
  };
  
  // Close on escape
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (callback) callback(false);
      modal.remove();
    }
  });
}

// Request Notification Permission
export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return Promise.resolve(false);
  }
  
  return Notification.requestPermission().then(permission => {
    return permission === 'granted';
  });
}

// Show browser notification
export function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    return Promise.resolve(false);
  }
  
  return Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      const notification = new Notification(sanitizeHTML(title), {
        body: sanitizeHTML(options.body || ''),
        icon: options.icon || '/icon.png',
        ...options
      });
      
      // Close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);
      return true;
    }
    return false;
  });
}
