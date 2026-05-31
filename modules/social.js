// modules/social.js
// Inder's Feature: Finch-style Social Tab
// Friends feed, check-in logging, activity updates, emoji reactions
// All data stored via getProfile/saveProfile from storage.js

import { getProfile, saveProfile } from './storage.js';
import { getMascotReaction } from './mascot.js';

// ─── DEMO FRIENDS DATA ────────────────────────────────────────────────────────
const DEMO_FRIENDS = [
  { id: 'demo_maya',   name: 'Maya',   mascot: '🐻', streak: 14, level: 5,  outfit: '🧑‍🚀', rank: 'Sergeant'  },
  { id: 'demo_arjun',  name: 'Arjun',  mascot: '🐱', streak: 7,  level: 3,  outfit: '👔',   rank: 'Corporal'  },
  { id: 'demo_priya',  name: 'Priya',  mascot: '🦉', streak: 21, level: 8,  outfit: '🥷',   rank: 'Lieutenant' }
];

const DEMO_POSTS = [
  {
    id: 'post_d1',
    authorId: 'demo_maya',
    authorName: 'Maya',
    authorMascot: '🐻',
    authorOutfit: '🧑‍🚀',
    text: 'Crushed my morning study block! 3 hours of deep focus 🎯',
    mood: '🔥',
    timestamp: Date.now() - 1000 * 60 * 47,
    reactions: { '🔥': 3, '💪': 1 }
  },
  {
    id: 'post_d2',
    authorId: 'demo_priya',
    authorName: 'Priya',
    authorMascot: '🦉',
    authorOutfit: '🥷',
    text: '21-day streak hit! Nothing can stop me now 🌟',
    mood: '🌟',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    reactions: { '❤️': 5, '🔥': 4, '🎉': 2 }
  },
  {
    id: 'post_d3',
    authorId: 'demo_arjun',
    authorName: 'Arjun',
    authorMascot: '🐱',
    authorOutfit: '👔',
    text: 'Took a rest day today. Sometimes recovery is the plan 😌',
    mood: '😌',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    reactions: { '❤️': 2, '💙': 1 }
  }
];

const MOOD_OPTIONS = ['🔥', '😴', '🎯', '💪', '😤', '🌟', '😌', '🎉'];
const REACTION_OPTIONS = ['🔥', '❤️', '💪', '🎉', '💙', '😲', '🤝'];

// ─── SEED HELPERS ─────────────────────────────────────────────────────────────

function getSocialData() {
  try {
    const raw = localStorage.getItem('tempo_social_feed');
    if (!raw) return { friends: [], posts: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Social] Error reading social data:', e);
    return { friends: [], posts: [] };
  }
}

function saveSocialData(data) {
  try {
    localStorage.setItem('tempo_social_feed', JSON.stringify(data));
  } catch (e) {
    console.error('[Social] Error saving social data:', e);
  }
}

function seedDemoData() {
  try {
    const data = getSocialData();
    if (data.friends.length === 0) {
      data.friends = [...DEMO_FRIENDS];
    }
    if (data.posts.length === 0) {
      data.posts = [...DEMO_POSTS];
    }
    saveSocialData(data);
  } catch (e) {
    console.error('[Social] Seed error:', e);
  }
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

function formatTimeAgo(timestamp) {
  try {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch (e) {
    return '';
  }
}

function generateId() {
  return 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

function postCheckIn(text, mood) {
  try {
    const profile = getProfile();
    const data = getSocialData();
    const mascotKey = profile.equippedMascot || 'owl';
    const mascotEmojis = { owl: '🦉', bear: '🐻', cat: '🐱' };
    const outfitEmojis = { none: '', suit: '👔', astronaut: '🧑‍🚀', visor: '🕶️', ninja: '🥷', cowboy: '🤠', wizard: '🧙' };

    const newPost = {
      id: generateId(),
      authorId: 'me',
      authorName: profile.name || 'You',
      authorMascot: mascotEmojis[mascotKey] || '🦉',
      authorOutfit: outfitEmojis[profile.equippedOutfit] || '',
      text: text.trim().substring(0, 200),
      mood: mood || '🎯',
      timestamp: Date.now(),
      reactions: {}
    };

    data.posts.unshift(newPost);
    // Keep max 50 posts
    if (data.posts.length > 50) data.posts = data.posts.slice(0, 50);
    saveSocialData(data);
    return newPost;
  } catch (e) {
    console.error('[Social] Post error:', e);
    return null;
  }
}

function reactToPost(postId, emoji) {
  try {
    const data = getSocialData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.reactions[emoji]) post.reactions[emoji] = 0;
    post.reactions[emoji]++;
    saveSocialData(data);
  } catch (e) {
    console.error('[Social] React error:', e);
  }
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

function renderReactions(post) {
  const reactionEntries = Object.entries(post.reactions).filter(([, count]) => count > 0);
  const reactionBtns = REACTION_OPTIONS.map(emoji => `
    <button class="social-react-btn" data-post-id="${post.id}" data-emoji="${emoji}" title="React with ${emoji}">
      ${emoji}
    </button>
  `).join('');

  const existingReactions = reactionEntries.length > 0
    ? reactionEntries.map(([emoji, count]) => `
        <span class="social-reaction-pill">${emoji} ${count}</span>
      `).join('')
    : '';

  return `
    <div class="social-reactions-row">
      <div class="social-reaction-pills">${existingReactions}</div>
      <div class="social-react-buttons">${reactionBtns}</div>
    </div>
  `;
}

function renderPostCard(post, isOwn = false) {
  return `
    <div class="social-card ${isOwn ? 'social-card--own' : ''}" data-post-id="${post.id}">
      <div class="social-card-header">
        <div class="social-avatar">
          <span class="social-avatar-mascot">${post.authorMascot}</span>
          ${post.authorOutfit ? `<span class="social-avatar-outfit">${post.authorOutfit}</span>` : ''}
        </div>
        <div class="social-card-meta">
          <span class="social-author-name">${post.authorName}${isOwn ? ' (You)' : ''}</span>
          <span class="social-time">${formatTimeAgo(post.timestamp)}</span>
        </div>
        <span class="social-mood-badge">${post.mood}</span>
      </div>
      <p class="social-card-text">${post.text}</p>
      ${renderReactions(post)}
    </div>
  `;
}

function renderFriendChip(friend) {
  return `
    <div class="social-friend-chip">
      <div class="social-friend-avatar">
        <span>${friend.mascot}</span>
        ${friend.outfit ? `<span class="social-friend-outfit">${friend.outfit}</span>` : ''}
      </div>
      <span class="social-friend-name">${friend.name}</span>
      <span class="social-friend-streak">🔥 ${friend.streak}</span>
    </div>
  `;
}

// ─── MASCOT REACTION BANNER ───────────────────────────────────────────────────

function showMascotReactionBanner(container, event) {
  try {
    const reaction = getMascotReaction(event);
    if (!reaction) return;

    const banner = document.createElement('div');
    banner.className = 'social-mascot-banner animate-pop';
    banner.innerHTML = `
      <span class="banner-mascot">${reaction.mascotEmoji}${reaction.outfitEmoji}</span>
      <span class="banner-msg">${reaction.message}</span>
    `;
    container.insertBefore(banner, container.firstChild);
    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 500);
    }, 3500);
  } catch (e) {
    console.error('[Social] Banner error:', e);
  }
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────

export function renderSocial(container) {
  try {
    seedDemoData();
    const data = getSocialData();
    const profile = getProfile();
    const myPosts = data.posts.filter(p => p.authorId === 'me');
    const friendPosts = data.posts.filter(p => p.authorId !== 'me');

    container.innerHTML = `
      <div class="social-view">

        <!-- Header -->
        <div class="social-header">
          <h2 class="social-title">👥 Social Feed</h2>
          <p class="social-subtitle">See what your squad is up to</p>
        </div>

        <!-- Mascot Reaction Banner slot -->
        <div id="social-banner-slot"></div>

        <!-- Friends Strip -->
        <div class="social-section">
          <div class="social-section-label">Your Squad</div>
          <div class="social-friends-strip" id="social-friends-strip">
            ${data.friends.map(f => renderFriendChip(f)).join('')}
            <div class="social-friend-chip social-add-friend" id="social-add-friend-btn">
              <div class="social-friend-avatar social-add-avatar">➕</div>
              <span class="social-friend-name">Add</span>
            </div>
          </div>
        </div>

        <!-- Check-In Composer -->
        <div class="social-section">
          <div class="social-section-label">Share a Check-in</div>
          <div class="social-composer card-3d">
            <div class="social-composer-mood">
              <span class="composer-label">Mood:</span>
              <div class="mood-options" id="mood-options">
                ${MOOD_OPTIONS.map(m => `
                  <button class="mood-btn ${m === '🎯' ? 'mood-btn--active' : ''}" data-mood="${m}">${m}</button>
                `).join('')}
              </div>
            </div>
            <textarea
              id="social-checkin-text"
              class="social-composer-input"
              placeholder="What did you accomplish? Share with your squad… ✍️"
              maxlength="200"
              rows="3"
            ></textarea>
            <div class="social-composer-footer">
              <span class="char-count" id="checkin-char-count">0 / 200</span>
              <button class="social-post-btn" id="social-post-btn">Post Check-in 🚀</button>
            </div>
          </div>
        </div>

        <!-- Live Feed -->
        <div class="social-section">
          <div class="social-section-label">Activity Feed</div>
          <div class="social-feed" id="social-feed">
            ${myPosts.map(p => renderPostCard(p, true)).join('')}
            ${friendPosts.map(p => renderPostCard(p, false)).join('')}
          </div>
        </div>

      </div>

      <!-- Add Friend Modal -->
      <div id="add-friend-modal" class="social-modal hidden">
        <div class="social-modal-backdrop" id="add-friend-backdrop"></div>
        <div class="social-modal-card card-3d animate-pop">
          <h3>Add a Friend 🤝</h3>
          <p class="social-modal-sub">Enter your friend's username to connect</p>
          <input type="text" id="add-friend-input" class="social-modal-input" placeholder="Friend's name…" maxlength="30" />
          <div class="social-modal-actions">
            <button class="social-modal-cancel" id="add-friend-cancel">Cancel</button>
            <button class="social-modal-confirm" id="add-friend-confirm">Add Friend ✅</button>
          </div>
        </div>
      </div>
    `;

    // ── Event bindings ─────────────────────────────────────────────────────────

    // Mood selector
    let selectedMood = '🎯';
    const moodBtns = container.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          moodBtns.forEach(b => b.classList.remove('mood-btn--active'));
          btn.classList.add('mood-btn--active');
          selectedMood = btn.dataset.mood;
        } catch (e) { console.error('[Social] Mood select error:', e); }
      });
    });

    // Char counter
    const textInput = container.querySelector('#social-checkin-text');
    const charCount = container.querySelector('#checkin-char-count');
    textInput.addEventListener('input', () => {
      try {
        charCount.textContent = `${textInput.value.length} / 200`;
      } catch (e) { console.error('[Social] Char count error:', e); }
    });

    // Post check-in
    container.querySelector('#social-post-btn').addEventListener('click', () => {
      try {
        const text = textInput.value.trim();
        if (!text) {
          textInput.placeholder = 'Write something first! ✍️';
          textInput.classList.add('shake');
          setTimeout(() => textInput.classList.remove('shake'), 500);
          return;
        }
        const post = postCheckIn(text, selectedMood);
        if (post) {
          textInput.value = '';
          charCount.textContent = '0 / 200';
          const feed = container.querySelector('#social-feed');
          const newCard = document.createElement('div');
          newCard.innerHTML = renderPostCard(post, true);
          const cardEl = newCard.firstElementChild;
          cardEl.classList.add('animate-pop');
          feed.insertBefore(cardEl, feed.firstChild);
          bindReactionButtons(feed);
          const bannerSlot = container.querySelector('#social-banner-slot');
          showMascotReactionBanner(bannerSlot, 'check_in_posted');
        }
      } catch (e) { console.error('[Social] Post submit error:', e); }
    });

    // Reactions delegation
    function bindReactionButtons(feed) {
      feed.querySelectorAll('.social-react-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId = btn.dataset.postId;
            const emoji = btn.dataset.emoji;
            reactToPost(postId, emoji);
            // Re-render just the reactions for this post
            const card = feed.querySelector(`[data-post-id="${postId}"]`);
            if (card) {
              const data2 = getSocialData();
              const post = data2.posts.find(p => p.id === postId);
              if (post) {
                const reactionsRow = card.querySelector('.social-reactions-row');
                if (reactionsRow) {
                  reactionsRow.outerHTML = renderReactions(post);
                  // Rebind after DOM replace
                  bindReactionButtons(feed);
                }
              }
            }
          } catch (e) { console.error('[Social] Reaction error:', e); }
        });
      });
    }
    bindReactionButtons(container.querySelector('#social-feed'));

    // Add Friend modal
    const addBtn = container.querySelector('#social-add-friend-btn');
    const modal = container.querySelector('#add-friend-modal');
    const backdrop = container.querySelector('#add-friend-backdrop');
    const cancelBtn = container.querySelector('#add-friend-cancel');
    const confirmBtn = container.querySelector('#add-friend-confirm');
    const friendInput = container.querySelector('#add-friend-input');

    addBtn.addEventListener('click', () => {
      try { modal.classList.remove('hidden'); friendInput.focus(); }
      catch (e) { console.error('[Social] Modal open error:', e); }
    });
    [backdrop, cancelBtn].forEach(el => el.addEventListener('click', () => {
      try { modal.classList.add('hidden'); friendInput.value = ''; }
      catch (e) { console.error('[Social] Modal close error:', e); }
    }));
    confirmBtn.addEventListener('click', () => {
      try {
        const name = friendInput.value.trim();
        if (!name) return;
        const mascots = ['🦉', '🐻', '🐱'];
        const outfits = ['', '👔', '🧑‍🚀', '🥷', '🤠', '🧙'];
        const newFriend = {
          id: 'friend_' + Date.now(),
          name: name.substring(0, 20),
          mascot: mascots[Math.floor(Math.random() * mascots.length)],
          streak: Math.floor(Math.random() * 10),
          level: Math.floor(Math.random() * 5) + 1,
          outfit: outfits[Math.floor(Math.random() * outfits.length)],
          rank: 'Recruit'
        };
        const data2 = getSocialData();
        data2.friends.push(newFriend);
        saveSocialData(data2);
        const strip = container.querySelector('#social-friends-strip');
        const addChip = strip.querySelector('.social-add-friend');
        const newChip = document.createElement('div');
        newChip.innerHTML = renderFriendChip(newFriend);
        strip.insertBefore(newChip.firstElementChild, addChip);
        modal.classList.add('hidden');
        friendInput.value = '';
        const bannerSlot = container.querySelector('#social-banner-slot');
        showMascotReactionBanner(bannerSlot, 'new_friend');
      } catch (e) { console.error('[Social] Add friend error:', e); }
    });

  } catch (e) {
    console.error('[Social] Render error:', e);
    container.innerHTML = `<div class="social-error">⚠️ Social tab failed to load. Please refresh.</div>`;
  }
}
