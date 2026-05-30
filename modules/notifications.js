// Modules/notifications.js
// Audio synthesis, push notifications, and custom toasts/dialogs

import { getProfile } from './storage.js';

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
    
    const profile = getProfile();
    const soundPack = profile.equippedSound || 'default';
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    if (soundPack === 'scifi') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (soundPack === 'zen') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.5);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    } else if (soundPack === 'retro') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.08);
      osc.frequency.setValueAtTime(80, now + 0.15);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.25);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    console.warn('Pivot audio play failed:', e);
  }
}

export function playUnlockSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const profile = getProfile();
    const soundPack = profile.equippedSound || 'default';
    const now = ctx.currentTime;

    if (soundPack === 'scifi') {
      const notes = [600, 800, 1000, 1300, 1600];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.05);
        gainNode.gain.setValueAtTime(0, now + index * 0.05);
        gainNode.gain.linearRampToValueAtTime(0.12, now + index * 0.05 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.15);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + index * 0.05);
        osc.stop(now + index * 0.05 + 0.2);
      });
    } else if (soundPack === 'zen') {
      const freqs = [329.63, 440.00];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        const start = now + index * 0.15;
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.2, start + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.5);
      });
    } else if (soundPack === 'retro') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        const start = now + index * 0.05;
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.08, start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } else {
      const notes = [440.00, 523.25, 659.25, 880.00];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gainNode.gain.setValueAtTime(0, now + index * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.2, now + index * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.2);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.25);
      });
    }
  } catch (e) {
    console.warn('Unlock audio play failed:', e);
  }
}

export async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch (e) {
    console.warn('Notification permission request failed:', e);
    return false;
  }
}

export function sendPushNotification(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2358cc02"><circle cx="12" cy="12" r="10"/></svg>',
      badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><circle cx="12" cy="12" r="10"/></svg>'
    });
    return true;
  } catch (e) {
    console.error('Notification spawn failed:', e);
    return false;
  }
}

function ensureDialogElements() {
  try {
    const parent = document.querySelector('.phone-screen-content');
    if (!parent) return null;

    let toastContainer = parent.querySelector('.app-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'app-toast-container';
      parent.appendChild(toastContainer);
    }

    let dialogOverlay = parent.querySelector('#app-dialog-overlay');
    if (!dialogOverlay) {
      dialogOverlay = document.createElement('div');
      dialogOverlay.id = 'app-dialog-overlay';
      dialogOverlay.innerHTML = `
        <div class="app-dialog-card card-3d">
          <h4 class="app-dialog-title" id="app-dialog-title-el">Title</h4>
          <p class="app-dialog-message" id="app-dialog-message-el">Message</p>
          <input type="text" class="app-dialog-input hidden" id="app-dialog-input-el" placeholder="Enter text...">
          <div class="app-dialog-buttons" id="app-dialog-buttons-el"></div>
        </div>
      `;
      parent.appendChild(dialogOverlay);
    }

    return { toastContainer, dialogOverlay };
  } catch (e) {
    console.error('Dialog element creation failed:', e);
    return null;
  }
}

export function showToast(message, type = 'info') {
  try {
    if (typeof message !== 'string') return;
    
    const elems = ensureDialogElements();
    if (!elems) return;

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '🎉';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span class="app-toast-icon">${icon}</span>
      <span class="app-toast-message">${message.substring(0, 200)}</span>
    `;

    elems.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 50);
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  } catch (e) {
    console.error('Toast creation failed:', e);
  }
}

export function showConfirm(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    try {
      if (typeof message !== 'string' || typeof title !== 'string') {
        resolve(false);
        return;
      }
      
      const elems = ensureDialogElements();
      if (!elems) {
        resolve(false);
        return;
      }

      const { dialogOverlay } = elems;
      const titleEl = dialogOverlay.querySelector('#app-dialog-title-el');
      const msgEl = dialogOverlay.querySelector('#app-dialog-message-el');
      const inputEl = dialogOverlay.querySelector('#app-dialog-input-el');
      const buttonsEl = dialogOverlay.querySelector('#app-dialog-buttons-el');

      titleEl.textContent = title;
      msgEl.textContent = message;
      inputEl.classList.add('hidden');

      buttonsEl.innerHTML = `
        <button class="btn btn-secondary btn-3d btn-full btn-sm" id="confirm-cancel-btn" style="flex:1;">Cancel</button>
        <button class="btn btn-primary btn-3d btn-full btn-sm" id="confirm-ok-btn" style="flex:1;">OK</button>
      `;

      dialogOverlay.classList.add('active');

      const handleResolve = (val) => {
        dialogOverlay.classList.remove('active');
        resolve(val);
      };

      dialogOverlay.querySelector('#confirm-cancel-btn').onclick = () => handleResolve(false);
      dialogOverlay.querySelector('#confirm-ok-btn').onclick = () => handleResolve(true);
    } catch (e) {
      console.error('Confirm dialog error:', e);
      resolve(false);
    }
  });
}

export function showPrompt(message, defaultText = '', title = 'Enter Details') {
  return new Promise((resolve) => {
    try {
      if (typeof message !== 'string' || typeof title !== 'string') {
        resolve(null);
        return;
      }
      
      const elems = ensureDialogElements();
      if (!elems) {
        resolve(null);
        return;
      }

      const { dialogOverlay } = elems;
      const titleEl = dialogOverlay.querySelector('#app-dialog-title-el');
      const msgEl = dialogOverlay.querySelector('#app-dialog-message-el');
      const inputEl = dialogOverlay.querySelector('#app-dialog-input-el');
      const buttonsEl = dialogOverlay.querySelector('#app-dialog-buttons-el');

      titleEl.textContent = title;
      msgEl.textContent = message;
      inputEl.value = String(defaultText);
      inputEl.classList.remove('hidden');
      
      setTimeout(() => inputEl.focus(), 100);

      buttonsEl.innerHTML = `
        <button class="btn btn-secondary btn-3d btn-full btn-sm" id="prompt-cancel-btn" style="flex:1;">Cancel</button>
        <button class="btn btn-primary btn-3d btn-full btn-sm" id="prompt-ok-btn" style="flex:1;">Submit</button>
      `;

      dialogOverlay.classList.add('active');

      const handleResolve = (val) => {
        dialogOverlay.classList.remove('active');
        inputEl.classList.add('hidden');
        resolve(val);
      };

      dialogOverlay.querySelector('#prompt-cancel-btn').onclick = () => handleResolve(null);
      dialogOverlay.querySelector('#prompt-ok-btn').onclick = () => handleResolve(inputEl.value);
      inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') handleResolve(inputEl.value);
      };
    } catch (e) {
      console.error('Prompt dialog error:', e);
      resolve(null);
    }
  });
}

// Global Override of window.alert
if (typeof window !== 'undefined') {
  window.alert = function(msg) {
    let type = 'info';
    const lowercaseMsg = String(msg).toLowerCase();
    if (
      lowercaseMsg.includes('success') || lowercaseMsg.includes('committed') || 
      lowercaseMsg.includes('completed') || lowercaseMsg.includes('earned') || 
      lowercaseMsg.includes('🎉') || lowercaseMsg.includes('✅')
    ) {
      type = 'success';
    } else if (
      lowercaseMsg.includes('warning') || lowercaseMsg.includes('insufficient') || 
      lowercaseMsg.includes('❌') || lowercaseMsg.includes('⚠️')
    ) {
      type = 'warning';
    } else if (
      lowercaseMsg.includes('error') || lowercaseMsg.includes('failed')
    ) {
      type = 'error';
    }
    showToast(msg, type);
  };
}
