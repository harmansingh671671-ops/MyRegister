// Modules/mascot.js
// Enhanced with: custom outfits (ninja, cowboy, wizard, detective, chef, superhero) and outfit-themed speech dialogue
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
  ninja:     '🥷',
  cowboy:    '🤠',
  wizard:    '🧙',
  detective: '🕵️',
  chef:      '🧑‍🍳',
  superhero: '🦸'
};

// ─── SOCIAL EVENT REACTIONS ───────────────────────────────────────────────────
// Used as fallbacks if no outfit-specific quote applies
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

// Outfit-themed specific quotes for social interactions
const OUTFIT_QUOTES = {
  suit: {
    check_in_posted: "Log complete. Professional compliance levels are high. Let's make this day profitable! 💼",
    reaction_received: "Our team's feedback is positive. Synergizing productivity efforts! 📈",
    new_friend: "New network connection established. Welcome to the venture! 🤝",
    friend_posted: "A teammate has posted progress. Let's maintain high executive focus! 👔"
  },
  astronaut: {
    check_in_posted: "Mission control, we have check-in lift-off! Productivity is reaching orbit! 🚀",
    reaction_received: "Telemetry shows positive vibes from outer space! ☄️",
    new_friend: "New crew member onboard! Let's explore the focus galaxy together. 🌌",
    friend_posted: "Astronaut activity detected! Keep your space schedule protected! 🛰️"
  },
  visor: {
    check_in_posted: "Access granted! Check-in logged directly into the mainframe database! 💾",
    reaction_received: "Inbound signals decrypted. Cyber-vibes received! 🕶️",
    new_friend: "New node connected to our peer-to-peer productivity network! 📡",
    friend_posted: "Detected a schedule refresh from another client node! 🌐"
  },
  ninja: {
    check_in_posted: "Swift and silent! Your activity log has been recorded like a stealth mission! 🥷",
    reaction_received: "A friendly ninja has sent support from the shadows! ⚔️",
    new_friend: "A new recruit joins the shadow clan. Power in numbers! 🤝",
    friend_posted: "Another ninja is training! Do not lose your focus stance! 😤"
  },
  cowboy: {
    check_in_posted: "Yeehaw! That task is officially lassoed and branded! Good work, partner! 🤠",
    reaction_received: "A friendly tip of the hat from the ranch. Much obliged! 🐎",
    new_friend: "Well howdy! Looks like a new partner just joined our caravan! 🌵",
    friend_posted: "Another cowpoke is active on the trail. Giddyup! 🚜"
  },
  wizard: {
    check_in_posted: "Abracadabra! Task resolved! Transmuting effort into absolute magic! 🧙‍♂️✨",
    reaction_received: "A charm of positive vibes has been cast on your post! 🔮",
    new_friend: "A fellow sorcerer joins the wizarding academy! Fascinating! 📚",
    friend_posted: "I sense a disturbance of high productivity in the wizarding realm! ⚡"
  },
  detective: {
    check_in_posted: "Elementary! I've analyzed your progress, and the case is officially closed! 🕵️‍♂️🔎",
    reaction_received: "A new clue! Someone left a reaction of encouragement on your record! 📝",
    new_friend: "A new investigator is on the case! Let's solve this mystery of focus! 🤝",
    friend_posted: "I detect some serious focus updates in our surrounding area. Keep investigating! 🔍"
  },
  chef: {
    check_in_posted: "Order up! Freshly baked check-in is hot and ready for the squad! 🧑‍🍳🧁",
    reaction_received: "Compliments to the chef! Your squad is loving this progress recipe! 🍳",
    new_friend: "A new cook joins the kitchen! Let's whip up some amazing habits! 🍕",
    friend_posted: "Smells like someone else is cooking up some serious streaks today! 🥖"
  },
  superhero: {
    check_in_posted: "Task conquered! Saving the day, one habit at a time! Excelsior! 🦸⚡",
    reaction_received: "Vibe signal detected! Support is arriving at supersonic speeds! ☄️",
    new_friend: "A new hero joins the justice league! Together, no task can stop us! 🤝",
    friend_posted: "Another hero is out there fighting procrastination. Stand with them! 😤"
  }
};

// Outfit-themed specific speech bubbles for Path coach
const OUTFIT_COACH_MESSAGES = {
  suit: {
    normal: ["Let's schedule our meetings with extreme precision. 👔", "Productivity translates to high professional compounding.", "Keep your focus dividends growing!"],
    happy: ["Outstanding quarterly performance! You are exceeding expectations! 📈", "Our focus profit margins are at an all-time high!", "Bonus points credited! Excellent execution."],
    sad: ["A minor setback in today's sheet. Let's pivot and recover quickly. 💼", "Unscheduled blocks lead to high overhead costs. Stay structured.", "A brief recess. Let's get back to business tomorrow."],
    planning: ["Outline the deliverables first. Planning saves operational costs!", "Let's block out deep work slots. Guard them with corporate integrity.", "Audit your schedule before checking off tasks."]
  },
  astronaut: {
    normal: ["Space logs show your trajectory is perfectly aligned! 🚀", "Gravity is no match for a steady focus routine.", "Remember to check oxygen levels and take focus breaks!"],
    happy: ["Orbit achieved! You are flying past your daily goals! 🌌", "Cosmic productivity levels detected! Ground control is proud! 📡", "Streaks are burning bright like supernovas! 🔥"],
    sad: ["Houston, we have a problem. Procrastination warning. ☄️", "Trajectory deviation detected. Initiate manual overrides for tomorrow.", "A black hole took our streak. Let's restart rocket systems!"],
    planning: ["Map your cosmic coordinates. A solid flight plan prevents drift!", "Set launch times for your key task blocks.", "Prepare for tomorrow's launch. Sleep cycles locking in."]
  },
  visor: {
    normal: ["Running security scans... Focus compiler is executing clean. 💻", "Optimize your memory cache. Clear distractions from your browser.", "Hacking task lists with surgical precision."],
    happy: ["System execution speed is 100%! Cyber-streak online! ⚡", "Access granted to maximum productivity mode!", "XP multiplier running. Focus cycles fully loaded!"],
    sad: ["Connection timed out. Mainframe hit a buffer overflow. 🔌", "Rebooting focus daemon. Patch the schedule leaks.", "Error 404: Task not completed. Trace the debug log."],
    planning: ["Write a clean schedule script. Keep dependencies low.", "Time-blocking acts like a sandboxed virtual environment.", "Initialize tomorrow's plan before compiling."]
  },
  ninja: {
    normal: ["Move with stealth, strike with focus. 🥷", "Procrastination is an enemy. Defeat it with swift actions.", "Practice patience. A silent mind leads to a sharp focus."],
    happy: ["Double strike! You cut through those tasks like paper! ⚔️", "Focus power level is legendary! The shadow clan rejoices!", "Streaks are blazing! Your training is paying off!"],
    sad: ["The opponent got the upper hand. Withdraw and rebuild stance. 💔", "Procrastination snuck past our guards. Double the defenses.", "A broken training streak. Return to the dojo tomorrow."],
    planning: ["Map the path. A ninja is always prepared before stepping out.", "Identify the target tasks. Strike them first thing in the morning.", "Quiet preparation tonight ensures victory tomorrow."]
  },
  cowboy: {
    normal: ["Keep those tasks aligned on the trail! 🤠", "No slacking on this ranch. Keep the momentum moving!", "Giddyup! Time to round up today's remaining blocks."],
    happy: ["Wild West compliance! You lassoed every single goal! 🏆", "You're the quickest task-slinger in this territory! 🐎", "This streak is hotter than a summer sun! 🔥"],
    sad: ["Looks like we got thrown off the saddle. Dust off and try again.", "Procrastination stampede! Let's corral our focus tomorrow.", "Streak broke, partner. Time to get back on the horse."],
    planning: ["Map out the trail before sundown. Don't wander in the dark!", "Check your supplies. Time-blocking is your lasso.", "Prepare the camp. A good night's rest keeps you steady."]
  },
  wizard: {
    normal: ["Focus is a spell that requires complete silence. 🧙‍♂️", "Transmuting regular time into pure achievements.", "I sense high concentrations of mental mana in your work."],
    happy: ["A magical display of focus! The spell is cast perfectly! ✨", "XP multiplier has reached legendary sorcerer levels! 🔮", "Your productivity is absolutely spellbinding!"],
    sad: ["The focus spell backfired. Procrastination curse active. 🧙‍♂️", "Mana depleted. Take a long rest and try again tomorrow.", "A broken magical streak. Drink a potion of consistency."],
    planning: ["Write your spells down. An entry written is a spell prepared.", "Block your morning hours. Magic works best at sunrise.", "Focus on one charm at a time. Multi-tasking breaks the spell."]
  },
  detective: {
    normal: ["Investigating schedule gaps... Everything looks clear! 🕵️‍♂️", "The secret to focus is leaving no room for clues of distraction.", "Elementary: do the hardest task first, the rest is simple."],
    happy: ["Case closed! A flawless investigation of all scheduled blocks! 🔎", "Brilliant deduction! You cracked today's focus challenges!", "Your streak is solid evidence of your persistence!"],
    sad: ["A mystery: where did today's time go? Let's check the clues.", "Procrastination has left its fingerprints all over. Solve it tomorrow.", "The focus case remains unsolved today. Re-investigate tomorrow."],
    planning: ["Identify the primary suspect: procrastination. Eliminate it.", "Write down your schedule steps. A detective has a clear log.", "Prepare the files. A good plan makes the target obvious."]
  },
  chef: {
    normal: ["Focus is like a fine recipe: it takes the right ingredients! 🧑‍🍳", "Let today's tasks simmer. Don't rush the process.", "Keep the kitchen clean. Remove distractions from your workspace."],
    happy: ["Compliments to the chef! Today's work is a masterpiece! 🧁", "A delicious streak! Cooked to absolute perfection! 🍳", "You served up high productivity all day long!"],
    sad: ["Looks like today's plan burnt to a crisp. Start fresh tomorrow.", "Recipe failed. Let's adjust the ingredients and try again.", "A dropped streak. The kitchen is closed. Reopen tomorrow."],
    planning: ["Prep your ingredients. Pre-planning tasks makes cooking easy.", "Time-blocking is the prep work of productivity.", "Set the menu tonight. Cook up a solid schedule tomorrow."]
  },
  superhero: {
    normal: ["Procrastination is the ultimate supervillain. Defeat it! 🦸", "With great power comes great schedule responsibility.", "Up, up, and focus! Use your superpower of consistency!"],
    happy: ["Task force victory! Procrastination has been vaporized! ⚡", "A heroic streak! Today was a legendary save! 💥", "Your focus power level is over 9000!"],
    sad: ["Kryptonite hit today. Procrastination won this round. 💔", "Superpowers depleted. Retreat to the fortress to recover.", "A broken streak. The city needs you to bounce back tomorrow!"],
    planning: ["Draw the blueprint. A hero has a tactical plan of action.", "Shield your focus windows. Protect them at all costs.", "Prepare your gear. Sleep is the power source for tomorrow."]
  }
};

// ─── EXPORTED: GET MASCOT REACTION ───────────────────────────────────────────

export function getMascotReaction(event) {
  try {
    const profile = getProfile();
    const mascotKey = profile.equippedMascot || 'owl';
    const outfitKey = profile.equippedOutfit || 'none';
    const mascotEmoji = MASCOT_EMOJIS[mascotKey] || '🦉';
    const outfitEmoji = OUTFIT_EMOJIS[outfitKey] || '';

    let message = '';
    let emoji = '🎉';

    // If there is an outfit-specific quote for this event, use it!
    if (outfitKey !== 'none' && OUTFIT_QUOTES[outfitKey] && OUTFIT_QUOTES[outfitKey][event]) {
      message = OUTFIT_QUOTES[outfitKey][event];
      const options = SOCIAL_REACTIONS[event] || SOCIAL_REACTIONS['check_in_posted'];
      const picked = options[Math.floor(Math.random() * options.length)];
      emoji = picked.emoji;
    } else {
      const options = SOCIAL_REACTIONS[event] || SOCIAL_REACTIONS['check_in_posted'];
      const picked = options[Math.floor(Math.random() * options.length)];
      message = picked.message;
      emoji = picked.emoji;
    }

    return {
      mascotEmoji,
      outfitEmoji,
      emoji,
      message
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
    let messages = [];

    // Check if there are outfit-specific coach messages for this mood
    if (outfitKey !== 'none' && OUTFIT_COACH_MESSAGES[outfitKey] && OUTFIT_COACH_MESSAGES[outfitKey][mood]) {
      messages = OUTFIT_COACH_MESSAGES[outfitKey][mood];
    } else {
      // Fallbacks
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
      } else {
        messages = [
          "Parkinson's Law: limit time to boost focus!",
          "Every block you check off brings you closer to Gold League standings.",
          "A structured outline reduces daily decision fatigue!"
        ];
      }
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
  wizard:    { label: 'Wizard',    emoji: '🧙' },
  detective: { label: 'Detective', emoji: '🕵️' },
  chef:      { label: 'Chef',      emoji: '🧑‍🍳' },
  superhero: { label: 'Superhero', emoji: '🦸' }
};
