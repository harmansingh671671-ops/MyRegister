// Modules/shop.js
import { getProfile, saveProfile, getAllDays } from './storage.js';
import { playUnlockSound } from './notifications.js';

export function renderShop(container) {
  const profile = getProfile();

  // Count customizations unlocked (25 total items in shop)
  const totalCustomizations = 25;
  const unlockedCount = 4 // defaults (slate theme, owl mascot, standard outfit, standard sound)
    + (profile.unlockedThemes || []).length
    + (profile.unlockedMascots || []).length
    + (profile.unlockedOutfits || []).length
    + (profile.unlockedSounds || []).length
    + (profile.unlockedBadges || []).length;
  const pct = Math.round((unlockedCount / totalCustomizations) * 100);

  container.innerHTML = `
    <div class="view-header">
      <h2 class="view-main-title">🛒 Shop</h2>
      <p class="view-main-sub">Unlock rewards, custom themes, and accountability shields</p>
      <div class="view-progress-pill">
        <span>${unlockedCount} / ${totalCustomizations} customizations unlocked</span>
        <div class="view-progress-bar">
          <div class="view-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    </div>

    <div class="shop-dashboard-layout" style="display:flex; flex-direction:column; gap:16px;">
      <!-- Balance Card -->
      <div class="card card-3d shop-balance-banner" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, var(--duo-blue), var(--duo-blue-bottom)); color: white; border: none;">
        <span style="font-weight: 700; font-size: 14px;">🛍️ Odyssey Shop Balance</span>
        <div style="font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 4px;">
          <span>💎</span>
          <span id="shop-tab-diamond-val">${profile.diamonds}</span>
        </div>
      </div>

      <!-- Section 1: Streak Utilities -->
      <div class="card card-3d">
        <h3>❄️ Streak Shields & Repairs</h3>
        <div class="shop-grid">
          <div class="shop-item card-3d">
            <div class="item-badge">RESCUE</div>
            <div class="item-icon">🔧</div>
            <h4>Streak Repair Kit</h4>
            <p>Restores a broken streak. <strong>Requires honest reflection logging.</strong></p>
            <button class="btn btn-primary btn-3d btn-full shop-buy-btn" data-item="repair" data-cost="50">Buy for 50 💎</button>
          </div>
          
          <div class="shop-item card-3d">
            <div class="item-badge">SHIELD</div>
            <div class="item-icon">❄️</div>
            <h4>Streak Freeze</h4>
            <p>Protects streak for tomorrow if you miss a check-in.</p>
            <button class="btn btn-primary btn-3d btn-full shop-buy-btn" data-item="freeze" data-cost="30">
              ${profile.streakFreezeActive ? 'Active' : 'Buy for 30 💎'}
            </button>
          </div>
        </div>
      </div>

      <!-- Section 2: App Themes -->
      <div class="card card-3d">
        <h3>🎨 App Style Themes</h3>
        <div class="shop-grid">
          ${renderCosmeticItem("Theme", "default", "default", "Odyssey Slate", "🌑", 0, profile)}
          ${renderCosmeticItem("Theme", "cyberpunk", "unlockedThemes", "Cyberpunk Neon", "🌌", 30, profile)}
          ${renderCosmeticItem("Theme", "forest", "unlockedThemes", "Autumn Forest", "🍁", 20, profile)}
          ${renderCosmeticItem("Theme", "sakura", "unlockedThemes", "Sakura Pink", "🌸", 20, profile)}
        </div>
      </div>

      <!-- Section 3: Mascot Companions -->
      <div class="card card-3d">
        <h3>🐻 Mascot Species</h3>
        <div class="shop-grid">
          ${renderCosmeticItem("Mascot", "owl", "default", "Odyssey Owl", "🦉", 0, profile)}
          ${renderCosmeticItem("Mascot", "bear", "unlockedMascots", "Focus Bear", "🐻", 25, profile)}
          ${renderCosmeticItem("Mascot", "cat", "unlockedMascots", "Smart Cat", "🐱", 25, profile)}
        </div>
      </div>

      <!-- Section 4: Mascot Outfits -->
      <div class="card card-3d">
        <h3>👔 Mascot Skins & Outfits</h3>
        <div class="shop-grid">
          ${renderCosmeticItem("Outfit", "none", "default", "Standard Look", "👕", 0, profile)}
          ${renderCosmeticItem("Outfit", "suit", "unlockedOutfits", "Suit & Tie", "👔", 15, profile)}
          ${renderCosmeticItem("Outfit", "astronaut", "unlockedOutfits", "Astronaut Suit", "🧑‍🚀", 20, profile)}
          ${renderCosmeticItem("Outfit", "visor", "unlockedOutfits", "Cyberpunk Visor", "🕶️", 20, profile)}
          ${renderCosmeticItem("Outfit", "ninja", "unlockedOutfits", "Ninja Suit", "🥷", 25, profile)}
          ${renderCosmeticItem("Outfit", "cowboy", "unlockedOutfits", "Cowboy Hat", "🤠", 25, profile)}
          ${renderCosmeticItem("Outfit", "wizard", "unlockedOutfits", "Wizard Robe", "🧙", 30, profile)}
          ${renderCosmeticItem("Outfit", "detective", "unlockedOutfits", "Detective Coat", "🕵️", 20, profile)}
          ${renderCosmeticItem("Outfit", "chef", "unlockedOutfits", "Chef Hat", "🧑‍🍳", 20, profile)}
          ${renderCosmeticItem("Outfit", "superhero", "unlockedOutfits", "Superhero Cape", "🦸", 30, profile)}
        </div>
      </div>

      <!-- Section 5: Audio Chime Packs -->
      <div class="card card-3d">
        <h3>🔊 Audio Chime Packs</h3>
        <div class="shop-grid">
          ${renderCosmeticItem("Sound", "default", "default", "Standard Chime", "🔔", 0, profile)}
          ${renderCosmeticItem("Sound", "scifi", "unlockedSounds", "Sci-Fi Beep", "📡", 10, profile)}
          ${renderCosmeticItem("Sound", "zen", "unlockedSounds", "Zen Gong", "🧘", 15, profile)}
          ${renderCosmeticItem("Sound", "retro", "unlockedSounds", "Retro Arcade", "👾", 10, profile)}
        </div>
      </div>

      <!-- Badges Shop -->
      <div class="card card-3d">
        <h3>🛡️ Custom Profile Badges</h3>
        <div class="shop-badges-grid">
          <div class="badge-item card-3d" data-badge="Deep Worker">
            <span class="badge-icon">📖</span>
            <h5>Deep Worker</h5>
            <button class="btn btn-secondary btn-3d btn-sm shop-badge-buy-btn" data-badge="Deep Worker" data-cost="10">10 💎</button>
          </div>
          <div class="badge-item card-3d" data-badge="Honest Scribe">
            <span class="badge-icon">✍️</span>
            <h5>Honest Scribe</h5>
            <button class="btn btn-secondary btn-3d btn-sm shop-badge-buy-btn" data-badge="Honest Scribe" data-cost="15">15 💎</button>
          </div>
          <div class="badge-item card-3d" data-badge="Early Riser">
            <span class="badge-icon">🌅</span>
            <h5>Early Riser</h5>
            <button class="btn btn-secondary btn-3d btn-sm shop-badge-buy-btn" data-badge="Early Riser" data-cost="10">10 💎</button>
          </div>
          <div class="badge-item card-3d" data-badge="Integrity Champion">
            <span class="badge-icon">👑</span>
            <h5>Integrity Champion</h5>
            <button class="btn btn-secondary btn-3d btn-sm shop-badge-buy-btn" data-badge="Integrity Champion" data-cost="25">25 💎</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind cosmetic handlers
  container.querySelectorAll('.shop-cosmetic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const itemKey = btn.getAttribute('data-key');
      const arrayKey = btn.getAttribute('data-array-key');
      const cost = parseInt(btn.getAttribute('data-cost'));
      const label = btn.getAttribute('data-label');

      const p = getProfile();

      // Check if unlocked
      const isDefault = arrayKey === "default";
      const isUnlocked = isDefault || p[arrayKey].includes(itemKey);

      if (isUnlocked) {
        // Toggle Equip
        const equipKey = `equipped${type}`; // e.g. equippedTheme, equippedMascot
        p[equipKey] = p[equipKey] === itemKey ? (type === 'Outfit' ? 'none' : 'default') : itemKey;
        saveProfile(p);
        
        // Sync application theme immediately
        if (type === 'Theme') {
          syncAppTheme(p[equipKey]);
        }
        
        alert(`Equipped ${label}!`);
        renderShop(container);
        return;
      }

      // Purchase flow
      if (p.diamonds < cost) {
        alert("❌ Insufficient diamonds for this customization item.");
        return;
      }

      p.diamonds -= cost;
      p[arrayKey].push(itemKey);
      p[`equipped${type}`] = itemKey;
      saveProfile(p);
      playUnlockSound();
      
      if (type === 'Theme') {
        syncAppTheme(itemKey);
      }

      alert(`🎉 Unlocked and equipped: "${label}"!`);
      renderShop(container);
    });
  });

  // Streak utilities click handlers
  container.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = getProfile();
      const item = btn.getAttribute('data-item');
      const cost = parseInt(btn.getAttribute('data-cost') || 50);

      if (p.diamonds < cost) {
        alert("❌ Insufficient diamonds! Log tasks honestly to earn more.");
        return;
      }

      if (item === 'repair') {
        const logs = getAllDays();
        let hasHonestMiss = false;
        
        for (const date in logs) {
          if (logs[date].blocks.some(b => b.status === 'missed')) {
            hasHonestMiss = true;
            break;
          }
        }

        if (!hasHonestMiss) {
          alert("❌ Streak Repair Kit locked! Stay honest to earn redemption. (Requires at least one honest 'miss' log in your history)");
          return;
        }

        if (p.streak === 0) {
          p.diamonds -= cost;
          p.streak = 1;
          saveProfile(p);
          playUnlockSound();
          alert("🔧 Streak repaired successfully! Your streak is restored to 1.");
          renderShop(container);
        } else {
          alert("Your streak is not currently broken!");
        }
      } 
      
      else if (item === 'freeze') {
        if (p.streakFreezeActive) {
          alert("Streak Freeze is already active!");
          return;
        }
        p.diamonds -= cost;
        p.streakFreezeActive = true;
        saveProfile(p);
        playUnlockSound();
        alert("❄️ Streak Freeze active! Your streak is protected for tomorrow.");
        renderShop(container);
      }
    });
  });

  // Buy Badges
  container.querySelectorAll('.shop-badge-buy-btn').forEach(btn => {
    const badge = btn.getAttribute('data-badge');
    const cost = parseInt(btn.getAttribute('data-cost') || 10);

    if (profile.unlockedBadges.includes(badge)) {
      btn.textContent = profile.equippedBadge === badge ? 'Equipped' : 'Equip';
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-success');
    }

    btn.addEventListener('click', () => {
      const p = getProfile();
      if (p.unlockedBadges.includes(badge)) {
        p.equippedBadge = p.equippedBadge === badge ? null : badge;
        saveProfile(p);
        alert(p.equippedBadge ? `🛡️ Badge equipped: "${badge}"` : "Badge unequipped.");
        renderShop(container);
        return;
      }

      if (p.diamonds < cost) {
        alert("❌ Insufficient diamonds for this badge.");
        return;
      }

      p.diamonds -= cost;
      p.unlockedBadges.push(badge);
      p.equippedBadge = badge;
      saveProfile(p);
      playUnlockSound();
      alert(`🛡️ Purchased and equipped badge: "${badge}"!`);
      renderShop(container);
    });
  });
}

function renderCosmeticItem(type, itemKey, arrayKey, label, icon, cost, profile) {
  const isDefault = arrayKey === "default";
  const isUnlocked = isDefault || profile[arrayKey].includes(itemKey);
  const equipKey = `equipped${type}`;
  const isEquipped = profile[equipKey] === itemKey;

  let btnText = `Buy ${cost} 💎`;
  let btnClass = 'btn-primary';
  if (isUnlocked) {
    btnText = isEquipped ? 'Equipped' : 'Equip';
    btnClass = isEquipped ? 'btn-success' : 'btn-secondary';
  }

  return `
    <div class="shop-item card-3d">
      <div class="item-icon" style="font-size:28px; margin-bottom:4px;">${icon}</div>
      <h5 style="margin:2px 0;">${label}</h5>
      <button class="btn btn-xs btn-3d btn-full shop-cosmetic-btn ${btnClass}" 
              data-type="${type}" 
              data-key="${itemKey}" 
              data-array-key="${arrayKey}" 
              data-cost="${cost}" 
              data-label="${label}">
        ${btnText}
      </button>
    </div>
  `;
}

// Helper to apply visual theme immediately to phone preview
export function syncAppTheme(themeName) {
  const frame = document.querySelector('.android-phone-frame');
  if (!frame) return;

  // Clear existing themes classes
  frame.classList.remove('theme-cyberpunk', 'theme-forest', 'theme-sakura');

  if (themeName !== 'default') {
    frame.classList.add(`theme-${themeName}`);
  }
}
