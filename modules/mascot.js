// Modules/mascot.js
// Enhanced with: social reactions, 3 new outfits (ninja/cowboy/wizard), social event bubbles
import { getProfile } from './storage.js';

// ─── MASCOT + OUTFIT MAPS ─────────────────────────────────────────────────────

const MASCOT_EMOJIS = {
  owl:  '🦉',
  bear: '🐻',
  cat:  '🐱'
};

const OUTFIT_EMOJIS = {
  none:      '',
  suit:      '👔',
  astronaut: '🧑‍🚀',
  visor:     '🕶️',
  // ─── NEW OUTFITS (inder branch) ───
  ninja:     '🥷',
  cowboy:    '🤠',
  wizard:    '🧙'
};

// ─── SOCIAL EVENT REACTIONS ───────────────────────────────────────────────────
// Used by social.js to show mascot pop-ups on social events

const SOCIAL_REACTIONS = {
  check_in_posted: [
    { emoji: '🎉', message: "Boom! Check-in posted. Your squad can see you grinding! 🔥" },
    { emoji: '✅', message: "Logged and locked! Consistency is your superpower." },
    { emoji: '🌟', message: "Another check-in in the books. Your streak thanks you!" }
  ],
  reaction_received: [
    { emoji: '❤️', message: "Someone reacted to your post! You're inspiring people!" },
    { emoji: '🔥', message: "Your squad is hyped! Keep showing up!" },
    { emoji: '🤝', message: "Community vibes are strong today. Keep it up!" }
  ],
  new_friend: [
    { emoji: '👋', message: "New friend added! The more the merrier. Grow that squad!" },
    { emoji: '🤝', message: "Squad just got bigger! Accountability hits different with friends." },
    { emoji: '🎉', message: "Welcome your new accountability partner! Don't let each other down!" }
  ],
  friend_posted: [
    { emoji: '👀', message: "Your friend just posted a check-in. Your move! 💪" },
    { emoji: '🔥', message: "The squad is active! Don't be the only one slacking!" },
    { emoji: '😤', message: "Friend's already logging progress. Time to compete!" }
  ]
};

// ─── EXPORTED: GET MASCOT REACTION ───────────────────────────────────────────

export function getMascotReaction(event) {
  try {
    const profile = getProfile();
    const mascotKey = profile.equippedMascot || 'owl';
    const outfitKey = profile.equippedOutfit || 'none';
    const mascotEmoji = MASCOT_EMOJIS[mascotKey] || '🦉';
    const outfitEmoji = OUTFIT_EMOJIS[outfitKey] || '';

    const options = SOCIAL_REACTIONS[event] || SOCIAL_REACTIONS['check_in_posted'];
    const picked = options[Math.floor(Math.random() * options.length)];

    return {
      mascotEmoji,
      outfitEmoji,
      emoji: picked.emoji,
      message: picked.message
    };
  } catch (e) {
    console.error('[Mascot] getMascotReaction error:', e);
    return null;
  }
}

// ─── EXPORTED: RENDER MASCOT WIDGET ──────────────────────────────────────────

export function renderMascotWidget(container, forceState = null) {
  try {
    const profile = getProfile();

    // Decide active mascot and outfit
    const mascotKey = profile.equippedMascot || 'owl';
    const outfitKey = profile.equippedOutfit || 'none';
    const mascotEmoji = MASCOT_EMOJIS[mascotKey] || '🦉';
    const outfitEmoji = OUTFIT_EMOJIS[outfitKey] || '';

    // Decide mood
    let mood = forceState || 'normal';

    // Speech bubble text options
    let messages = [
      "Parkinson's Law: limit time to boost focus!",
      "Every block you check off brings you closer to Gold League standings.",
      "A structured outline reduces daily decision fatigue!"
    ];

    if (mood === 'happy') {
      messages = [
        "Fantastic pace! You are crushing these blocks today! 🌟",
        "Focus levels are off the charts! Keep this streak blazing! 🔥",
        "Double XP morning bonus multiplier active. Make it count!"
      ];
    } else if (mood === 'sad') {
      messages = [
        "The couch won today. Let's make tomorrow different. 💔",
        "Broken streaks snap the mascot's heart. Visit the Shop to repair it!",
        "An honest mistake is better than a false victory. Pivot now."
      ];
    } else if (mood === 'planning') {
      messages = [
        "Be sure to add buffer gaps. Mindful planning equals flawless execution!",
        "Easy tasks build momentum, but hard tasks pay major diamonds! 💎",
        "Commit before 10:00 PM to earn the early planner double diamond bonus!"
      ];
    } else if (mood === 'sleeping') {
      messages = [
        "Zzz... Sleep is the foundation of cognitive integrity. Rest up! 🛌",
        "Focus is built on a solid 8-hour sleep block."
      ];
    } else if (mood === 'social') {
      messages = [
        "Check on your squad! Accountability is a two-way street. 👥",
        "Post a check-in — your friends are waiting to see your grind! 🔥",
        "The Social tab is live! Go connect with your accountability squad."
      ];
    }

    const selectedMsg = messages[Math.floor(Math.random() * messages.length)];

    // Render Mascot widget layout
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
  } catch (e) {
    console.error('[Mascot] renderMascotWidget error:', e);
  }
}

// ─── EXPORTED: OUTFIT DISPLAY NAME MAP ───────────────────────────────────────
// Used by the shop or social outfit preview

export const OUTFIT_DISPLAY = {
  none:      { label: 'None',      emoji: '' },
  suit:      { label: 'Suit',      emoji: '👔' },
  astronaut: { label: 'Astronaut', emoji: '🧑‍🚀' },
  visor:     { label: 'Visor',     emoji: '🕶️' },
  ninja:     { label: 'Ninja',     emoji: '🥷' },
  cowboy:    { label: 'Cowboy',    emoji: '🤠' },
  wizard:    { label: 'Wizard',    emoji: '🧙' }
};
