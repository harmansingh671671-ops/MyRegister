// Modules/mascot.js
import { getProfile } from './storage.js';

// Mascot and outfit emoji builders
const MASCOT_EMOJIS = {
  owl: "🦉",
  bear: "🐻",
  cat: "🐱"
};

const OUTFIT_EMOJIS = {
  none: "",
  suit: "👔",
  astronaut: "🧑‍🚀",
  visor: "🕶️"
};

export function renderMascotWidget(container, forceState = null) {
  const profile = getProfile();
  
  // Decide active mascot and outfit
  const mascotKey = profile.equippedMascot || 'owl';
  const outfitKey = profile.equippedOutfit || 'none';
  const mascotEmoji = MASCOT_EMOJIS[mascotKey] || "🦉";
  const outfitEmoji = OUTFIT_EMOJIS[outfitKey] || "";

  // Decide mood based on current state (completion rate, time, etc.)
  let mood = forceState || "normal";
  
  // Speech bubble text options
  let messages = [
    "Parkinson's Law: limit time to boost focus!",
    "Every block you check off brings you closer to Gold League standings.",
    "A structured outline reduces daily decision fatigue!"
  ];

  if (mood === "happy") {
    messages = [
      "Fantastic pace! You are crushing these blocks today! 🌟",
      "Focus levels are off the charts! Keep this streak blazing! 🔥",
      "Double XP morning bonus multiplier active. Make it count!"
    ];
  } else if (mood === "sad") {
    messages = [
      "The couch won today. Let's make tomorrow different. 💔",
      "Broken streaks snap the mascot's heart. Visit the Shop to repair it!",
      "An honest mistake is better than a false victory. Pivot now."
    ];
  } else if (mood === "planning") {
    messages = [
      "Be sure to add buffer gaps. Mindful planning equals flawless execution!",
      "Easy tasks build momentum, but hard tasks pay major diamonds! 💎",
      "Commit before 10:00 PM to earn the early planner double diamond bonus!"
    ];
  } else if (mood === "sleeping") {
    messages = [
      "Zzz... Sleep is the foundation of cognitive integrity. Rest up! 🛌",
      "Focus is built on a solid 8-hour sleep block."
    ];
  }

  const selectedMsg = messages[Math.floor(Math.random() * messages.length)];

  // Render Mascot widget layout (No divider, no tips card)
  container.innerHTML = `
    <div class="mascot-widget card-3d">
      <div class="mascot-flex-row">
        
        <!-- Mascot Display with outfits layered -->
        <div class="mascot-avatar-container pulse-slow">
          <span class="mascot-base">${mascotEmoji}</span>
          ${outfitEmoji ? `<span class="mascot-outfit-overlay">${outfitEmoji}</span>` : ''}
        </div>

        <!-- Speech Bubble -->
        <div class="mascot-speech-bubble">
          <p class="speech-text">${selectedMsg}</p>
        </div>

      </div>
    </div>
  `;
}
