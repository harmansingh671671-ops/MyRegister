// modules/social.js
// Inder's Feature: Twitter-Style Social Tab (v2)
// Feed tabs, notification bell, profile cards, leaderboard, replies, repost
// All data stored via getProfile/saveProfile or dedicated localStorage key
// No direct localStorage outside of getSocialData/saveSocialData helpers
// All functions wrapped in try-catch

import { getProfile, saveProfile } from './storage.js';
import { getMascotReaction } from './mascot.js';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────

const DEMO_FRIENDS = [
  { id: 'demo_maya',  name: 'Maya',  mascot: '🐻', streak: 14, level: 5,  outfit: '🧑‍🚀', rank: 'Sergeant',  bio: 'Morning person. Deep work addict. 🎯' },
  { id: 'demo_arjun', name: 'Arjun', mascot: '🐱', streak: 7,  level: 3,  outfit: '👔',    rank: 'Corporal',  bio: 'Gym + Code every day. No excuses 💪' },
  { id: 'demo_priya', name: 'Priya', mascot: '🦉', streak: 21, level: 8,  outfit: '🥷',   rank: 'Lieutenant', bio: '21-day streak queen. Sleep 8hrs minimum 🌙' }
];

const DEMO_POSTS = [
  {
    id: 'post_d1', authorId: 'demo_maya', authorName: 'Maya', authorMascot: '🐻', authorOutfit: '🧑‍🚀',
    text: 'Crushed my morning study block! 3 hours of deep focus 🎯', mood: '🔥',
    timestamp: Date.now() - 1000 * 60 * 47,
    reactions: { '🔥': 3, '💪': 1 }, replies: [
      { authorName: 'Priya', authorMascot: '🦉', text: 'Absolutely 🔥 Keep going!', timestamp: Date.now() - 1000 * 60 * 30 }
    ]
  },
  {
    id: 'post_d2', authorId: 'demo_priya', authorName: 'Priya', authorMascot: '🦉', authorOutfit: '🥷',
    text: '21-day streak hit! Nothing can stop me now 🌟', mood: '🌟',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    reactions: { '❤️': 5, '🔥': 4, '🎉': 2 }, replies: []
  },
  {
    id: 'post_d3', authorId: 'demo_arjun', authorName: 'Arjun', authorMascot: '🐱', authorOutfit: '👔',
    text: 'Took a rest day today. Sometimes recovery is the plan 😌', mood: '😌',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    reactions: { '❤️': 2, '💙': 1 }, replies: []
  }
];

const DEMO_NOTIFICATIONS = [
  { id: 'n1', icon: '🔥', text: 'Maya reacted 🔥 to your check-in', time: Date.now() - 1000 * 60 * 20, read: false },
  { id: 'n2', icon: '🎉', text: 'Priya hit a 21-day streak! Congratulate her 🏆', time: Date.now() - 1000 * 60 * 60, read: false },
  { id: 'n3', icon: '👥', text: 'Arjun just posted a check-in', time: Date.now() - 1000 * 60 * 60 * 3, read: true },
  { id: 'n4', icon: '🔔', text: 'You\'re on a 3-day streak! Keep it up 🔥', time: Date.now() - 1000 * 60 * 60 * 5, read: true }
];

const MOOD_OPTIONS     = ['🔥', '😴', '🎯', '💪', '😤', '🌟', '😌', '🎉'];
const REACTION_OPTIONS = ['🔥', '❤️', '💪', '🎉', '💙', '😲', '🤝'];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

function getSocialData() {
  try {
    const raw = localStorage.getItem('tempo_social_feed');
    if (!raw) return { friends: [], posts: [], notifications: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Social] Error reading social data:', e);
    return { friends: [], posts: [], notifications: [] };
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
    if (data.friends.length === 0) data.friends = [...DEMO_FRIENDS];
    if (data.posts.length === 0)   data.posts   = [...DEMO_POSTS];
    if (!data.notifications || data.notifications.length === 0) data.notifications = [...DEMO_NOTIFICATIONS];
    saveSocialData(data);
  } catch (e) { console.error('[Social] Seed error:', e); }
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function formatTimeAgo(ts) {
  try {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch (e) { return ''; }
}

function generateId() {
  return 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function unreadCount(notifications) {
  return (notifications || []).filter(n => !n.read).length;
}

// ─── TRENDING ─────────────────────────────────────────────────────────────────

function getTrendingTopics(posts) {
  try {
    const counts = {};
    const keywords = ['study', 'gym', 'workout', 'sleep', 'read', 'code', 'work', 'run', 'meditat', 'focus', 'morning'];
    posts.forEach(p => {
      const lower = p.text.toLowerCase();
      keywords.forEach(kw => {
        if (lower.includes(kw)) counts[kw] = (counts[kw] || 0) + 1;
      });
      if (p.mood) counts[p.mood] = (counts[p.mood] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  } catch (e) { return []; }
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

function postCheckIn(text, mood) {
  try {
    const profile = getProfile();
    const data = getSocialData();
    const mascotEmojis = { owl: '🦉', bear: '🐻', cat: '🐱' };
    const outfitEmojis = { none: '', suit: '👔', astronaut: '🧑‍🚀', visor: '🕶️', ninja: '🥷', cowboy: '🤠', wizard: '🧙' };
    const newPost = {
      id: generateId(),
      authorId: 'me',
      authorName: profile.name || 'You',
      authorMascot: mascotEmojis[profile.equippedMascot] || '🦉',
      authorOutfit: outfitEmojis[profile.equippedOutfit] || '',
      text: text.trim().substring(0, 200),
      mood: mood || '🎯',
      timestamp: Date.now(),
      reactions: {},
      replies: []
    };
    data.posts.unshift(newPost);
    if (data.posts.length > 50) data.posts = data.posts.slice(0, 50);
    // Add a notification when friends react (simulate)
    data.notifications = data.notifications || [];
    saveSocialData(data);
    return newPost;
  } catch (e) { console.error('[Social] Post error:', e); return null; }
}

function reactToPost(postId, emoji) {
  try {
    const data = getSocialData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.reactions[emoji]) post.reactions[emoji] = 0;
    post.reactions[emoji]++;
    saveSocialData(data);
  } catch (e) { console.error('[Social] React error:', e); }
}

function addReply(postId, replyText) {
  try {
    const profile = getProfile();
    const data = getSocialData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;
    const mascotEmojis = { owl: '🦉', bear: '🐻', cat: '🐱' };
    const reply = {
      id: 'reply_' + Date.now(),
      authorName: profile.name || 'You',
      authorMascot: mascotEmojis[profile.equippedMascot] || '🦉',
      text: replyText.trim().substring(0, 140),
      timestamp: Date.now()
    };
    if (!post.replies) post.replies = [];
    post.replies.push(reply);
    saveSocialData(data);
    return reply;
  } catch (e) { console.error('[Social] Reply error:', e); return null; }
}

function repostPost(post) {
  try {
    const profile = getProfile();
    const data = getSocialData();
    const mascotEmojis = { owl: '🦉', bear: '🐻', cat: '🐱' };
    const outfitEmojis = { none: '', suit: '👔', astronaut: '🧑‍🚀', visor: '🕶️', ninja: '🥷', cowboy: '🤠', wizard: '🧙' };
    const repost = {
      id: generateId(),
      authorId: 'me',
      authorName: profile.name || 'You',
      authorMascot: mascotEmojis[profile.equippedMascot] || '🦉',
      authorOutfit: outfitEmojis[profile.equippedOutfit] || '',
      text: post.text,
      mood: post.mood,
      timestamp: Date.now(),
      reactions: {},
      replies: [],
      repostOf: post.authorName
    };
    data.posts.unshift(repost);
    saveSocialData(data);
    return repost;
  } catch (e) { console.error('[Social] Repost error:', e); return null; }
}

function markAllNotificationsRead() {
  try {
    const data = getSocialData();
    (data.notifications || []).forEach(n => n.read = true);
    saveSocialData(data);
  } catch (e) { console.error('[Social] Mark read error:', e); }
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

function renderReactions(post) {
  const pills = Object.entries(post.reactions || {})
    .filter(([, c]) => c > 0)
    .map(([e, c]) => `<span class="social-reaction-pill">${e} ${c}</span>`)
    .join('');
  const btns = REACTION_OPTIONS.map(e =>
    `<button class="social-react-btn" data-post-id="${post.id}" data-emoji="${e}">${e}</button>`
  ).join('');
  return `
    <div class="social-reactions-row">
      <div class="social-reaction-pills">${pills}</div>
      <div class="social-react-buttons">${btns}</div>
    </div>
  `;
}

function renderReplies(post) {
  const replies = post.replies || [];
  if (replies.length === 0) return '';
  return `
    <div class="social-replies-preview">
      ${replies.slice(0, 2).map(r => `
        <div class="social-reply-item">
          <span class="social-reply-mascot">${r.authorMascot}</span>
          <div class="social-reply-bubble">
            <span class="social-reply-name">${r.authorName}</span>
            <p class="social-reply-text">${r.text}</p>
          </div>
        </div>
      `).join('')}
      ${replies.length > 2 ? `<p class="social-replies-more">+${replies.length - 2} more replies</p>` : ''}
    </div>
  `;
}

function renderPostCard(post, isOwn = false) {
  return `
    <div class="social-card ${isOwn ? 'social-card--own' : ''}" data-post-id="${post.id}">
      ${post.repostOf ? `<div class="social-repost-banner">🔁 Reposted from ${post.repostOf}</div>` : ''}
      <div class="social-card-header">
        <div class="social-avatar social-avatar--clickable" data-friend-id="${post.authorId}" data-friend-name="${post.authorName}">
          <span class="social-avatar-mascot">${post.authorMascot}</span>
          ${post.authorOutfit ? `<span class="social-avatar-outfit">${post.authorOutfit}</span>` : ''}
        </div>
        <div class="social-card-meta">
          <span class="social-author-name">${post.authorName}${isOwn ? ' <span class="social-you-tag">You</span>' : ''}</span>
          <span class="social-time">${formatTimeAgo(post.timestamp)}</span>
        </div>
        <span class="social-mood-badge">${post.mood}</span>
      </div>
      <p class="social-card-text">${post.text}</p>
      ${renderReactions(post)}
      ${renderReplies(post)}
      <div class="social-card-actions">
        <button class="social-action-btn social-reply-toggle-btn" data-post-id="${post.id}">
          💬 Reply ${(post.replies || []).length > 0 ? `(${post.replies.length})` : ''}
        </button>
        ${!isOwn ? `<button class="social-action-btn social-repost-btn" data-post-id="${post.id}">🔁 Repost</button>` : ''}
      </div>
      <div class="social-reply-composer hidden" id="reply-composer-${post.id}">
        <input type="text" class="social-reply-input" data-post-id="${post.id}" placeholder="Write a reply…" maxlength="140" />
        <button class="social-reply-submit" data-post-id="${post.id}">Send ↗</button>
      </div>
    </div>
  `;
}

function renderFriendChip(friend) {
  return `
    <div class="social-friend-chip" data-friend-id="${friend.id}">
      <div class="social-friend-avatar">
        <span>${friend.mascot}</span>
        ${friend.outfit ? `<span class="social-friend-outfit">${friend.outfit}</span>` : ''}
        <span class="social-friend-online-dot"></span>
      </div>
      <span class="social-friend-name">${friend.name}</span>
      <span class="social-friend-streak">🔥${friend.streak}</span>
    </div>
  `;
}

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────

function renderNotificationPanel(notifications) {
  return `
    <div class="social-notif-panel" id="social-notif-panel">
      <div class="social-notif-panel-header">
        <h3 class="social-notif-title">🔔 Notifications</h3>
        <button class="social-notif-mark-read" id="social-mark-read-btn">Mark all read</button>
      </div>
      <div class="social-notif-list">
        ${(notifications || []).length === 0
          ? `<p class="social-notif-empty">No notifications yet 👀</p>`
          : (notifications || []).map(n => `
            <div class="social-notif-item ${n.read ? '' : 'social-notif-item--unread'}">
              <span class="social-notif-icon">${n.icon}</span>
              <div class="social-notif-body">
                <p class="social-notif-text">${n.text}</p>
                <span class="social-notif-time">${formatTimeAgo(n.time)}</span>
              </div>
              ${!n.read ? `<span class="social-notif-dot"></span>` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

// ─── PROFILE CARD MODAL ───────────────────────────────────────────────────────

function openProfileCard(friend, container) {
  try {
    if (!friend) return;
    const existing = container.querySelector('#social-profile-card-modal');
    if (existing) existing.remove();

    const data = getSocialData();
    const friendPosts = data.posts.filter(p => p.authorId === friend.id).slice(0, 3);

    const modal = document.createElement('div');
    modal.className = 'social-profile-modal';
    modal.id = 'social-profile-card-modal';
    modal.innerHTML = `
      <div class="social-profile-backdrop" id="profile-backdrop"></div>
      <div class="social-profile-card animate-pop">
        <div class="social-profile-hero">
          <div class="social-profile-avatar-big">
            <span>${friend.mascot}</span>
            ${friend.outfit ? `<span class="social-profile-outfit-big">${friend.outfit}</span>` : ''}
          </div>
          <div class="social-profile-info">
            <h3 class="social-profile-name">${friend.name}</h3>
            <span class="social-profile-rank">${friend.rank || 'Recruit'}</span>
            <p class="social-profile-bio">${friend.bio || 'No bio yet 😊'}</p>
          </div>
        </div>
        <div class="social-profile-stats-row">
          <div class="social-profile-stat">
            <span class="social-profile-stat-val">🔥 ${friend.streak}</span>
            <span class="social-profile-stat-label">Streak</span>
          </div>
          <div class="social-profile-stat">
            <span class="social-profile-stat-val">⭐ ${friend.level}</span>
            <span class="social-profile-stat-label">Level</span>
          </div>
          <div class="social-profile-stat">
            <span class="social-profile-stat-val">📝 ${friendPosts.length}</span>
            <span class="social-profile-stat-label">Posts</span>
          </div>
        </div>
        ${friendPosts.length > 0 ? `
          <div class="social-profile-recent">
            <p class="social-profile-recent-label">Recent Check-ins</p>
            ${friendPosts.map(p => `
              <div class="social-profile-recent-post">
                <span>${p.mood}</span>
                <p>${p.text}</p>
                <span class="social-profile-recent-time">${formatTimeAgo(p.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <button class="social-profile-challenge-btn">⚡ Send Challenge</button>
        <button class="social-profile-close" id="profile-close-btn">✕ Close</button>
      </div>
    `;
    container.appendChild(modal);

    modal.querySelector('#profile-backdrop').addEventListener('click', () => { try { modal.remove(); } catch (e) {} });
    modal.querySelector('#profile-close-btn').addEventListener('click', () => { try { modal.remove(); } catch (e) {} });
    modal.querySelector('.social-profile-challenge-btn').addEventListener('click', () => {
      try {
        modal.querySelector('.social-profile-challenge-btn').textContent = '✅ Challenge Sent!';
        modal.querySelector('.social-profile-challenge-btn').disabled = true;
      } catch (e) {}
    });
  } catch (e) { console.error('[Social] Profile card error:', e); }
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
  } catch (e) { console.error('[Social] Banner error:', e); }
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

function renderLeaderboard(friends, profile) {
  const myEntry = { name: profile.name || 'You', streak: profile.streak || 0, mascot: '🦉', isMe: true };
  const all = [...friends, myEntry].sort((a, b) => b.streak - a.streak);
  const medals = ['🥇', '🥈', '🥉'];
  return `
    <div class="social-leaderboard card-3d">
      <h3 class="social-lb-title">🏆 Weekly Streak Leaders</h3>
      ${all.map((f, i) => `
        <div class="social-lb-row ${f.isMe ? 'social-lb-row--me' : ''}">
          <span class="social-lb-medal">${medals[i] || `#${i + 1}`}</span>
          <span class="social-lb-mascot">${f.mascot}</span>
          <span class="social-lb-name">${f.name}${f.isMe ? ' (You)' : ''}</span>
          <span class="social-lb-streak">🔥 ${f.streak} days</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────

export function renderSocial(container) {
  try {
    seedDemoData();
    const data    = getSocialData();
    const profile = getProfile();
    let activeTab = 'foryou';

    function getFilteredPosts(tab) {
      const allPosts = data.posts;
      if (tab === 'friends')  return allPosts.filter(p => p.authorId !== 'me');
      if (tab === 'trending') return [...allPosts].sort((a, b) =>
        Object.values(b.reactions || {}).reduce((s, v) => s + v, 0) -
        Object.values(a.reactions || {}).reduce((s, v) => s + v, 0)
      );
      return allPosts; // for you = all
    }

    function buildFeedHTML(tab) {
      const posts = getFilteredPosts(tab);
      if (tab === 'trending') {
        const trending = getTrendingTopics(data.posts);
        const trendingHTML = trending.length > 0 ? `
          <div class="social-trending-tags">
            ${trending.map(([t, c]) => `<span class="social-trending-tag">${t} <em>${c}</em></span>`).join('')}
          </div>` : '';
        return trendingHTML + posts.map(p => renderPostCard(p, p.authorId === 'me')).join('');
      }
      return posts.length > 0
        ? posts.map(p => renderPostCard(p, p.authorId === 'me')).join('')
        : `<div class="social-empty-feed">Nothing here yet. Post a check-in! 🚀</div>`;
    }

    const unread = unreadCount(data.notifications);
    const activeHoursAgo = data.friends.filter(f => f.streak > 0).length;

    container.innerHTML = `
      <div class="social-view">

        <!-- Header -->
        <div class="social-header">
          <div class="social-header-left">
            <h2 class="social-title">👥 Social</h2>
            ${activeHoursAgo > 0
              ? `<span class="social-live-pulse">● ${activeHoursAgo} active</span>`
              : ''}
          </div>
          <button class="social-bell-btn" id="social-bell-btn" aria-label="Notifications">
            🔔
            ${unread > 0 ? `<span class="social-bell-badge">${unread}</span>` : ''}
          </button>
        </div>

        <!-- Notification Panel (hidden by default) -->
        <div id="social-notif-wrapper" class="hidden">
          ${renderNotificationPanel(data.notifications)}
        </div>

        <!-- Mascot Banner Slot -->
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

        <!-- Leaderboard -->
        <div class="social-section">
          ${renderLeaderboard(data.friends, profile)}
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
            <textarea id="social-checkin-text" class="social-composer-input"
              placeholder="What did you accomplish? Share with your squad… ✍️"
              maxlength="200" rows="3"></textarea>
            <div class="social-composer-footer">
              <span class="char-count" id="checkin-char-count">0 / 200</span>
              <button class="social-post-btn" id="social-post-btn">Post 🚀</button>
            </div>
          </div>
        </div>

        <!-- Feed Tabs -->
        <div class="social-section">
          <div class="social-feed-tabs" id="social-feed-tabs">
            <button class="social-tab-btn social-tab-btn--active" data-tab="foryou">For You</button>
            <button class="social-tab-btn" data-tab="friends">Friends</button>
            <button class="social-tab-btn" data-tab="trending">🔥 Trending</button>
          </div>
          <div class="social-feed" id="social-feed">
            ${buildFeedHTML('foryou')}
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

    // ── Notification Bell ──────────────────────────────────────────────────────
    const bellBtn       = container.querySelector('#social-bell-btn');
    const notifWrapper  = container.querySelector('#social-notif-wrapper');
    let notifOpen = false;

    bellBtn.addEventListener('click', () => {
      try {
        notifOpen = !notifOpen;
        notifWrapper.classList.toggle('hidden', !notifOpen);
        if (notifOpen) {
          markAllNotificationsRead();
          const badge = bellBtn.querySelector('.social-bell-badge');
          if (badge) badge.remove();
        }
      } catch (e) { console.error('[Social] Bell toggle error:', e); }
    });

    const markReadBtn = container.querySelector('#social-mark-read-btn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        try {
          markAllNotificationsRead();
          container.querySelectorAll('.social-notif-item--unread').forEach(el => el.classList.remove('social-notif-item--unread'));
          container.querySelectorAll('.social-notif-dot').forEach(el => el.remove());
        } catch (e) { console.error('[Social] Mark read error:', e); }
      });
    }

    // ── Feed Tabs ──────────────────────────────────────────────────────────────
    container.querySelectorAll('.social-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          container.querySelectorAll('.social-tab-btn').forEach(b => b.classList.remove('social-tab-btn--active'));
          btn.classList.add('social-tab-btn--active');
          activeTab = btn.dataset.tab;
          const feed = container.querySelector('#social-feed');
          feed.innerHTML = buildFeedHTML(activeTab);
          bindFeedEvents(feed);
        } catch (e) { console.error('[Social] Tab switch error:', e); }
      });
    });

    // ── Mood Selector ─────────────────────────────────────────────────────────
    let selectedMood = '🎯';
    container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('mood-btn--active'));
          btn.classList.add('mood-btn--active');
          selectedMood = btn.dataset.mood;
        } catch (e) { console.error('[Social] Mood error:', e); }
      });
    });

    // ── Char Counter ──────────────────────────────────────────────────────────
    const textInput = container.querySelector('#social-checkin-text');
    const charCount = container.querySelector('#checkin-char-count');
    textInput.addEventListener('input', () => {
      try { charCount.textContent = `${textInput.value.length} / 200`; }
      catch (e) { console.error('[Social] Char count error:', e); }
    });

    // ── Post Check-in ─────────────────────────────────────────────────────────
    container.querySelector('#social-post-btn').addEventListener('click', () => {
      try {
        const text = textInput.value.trim();
        if (!text) {
          textInput.classList.add('shake');
          setTimeout(() => textInput.classList.remove('shake'), 500);
          return;
        }
        const post = postCheckIn(text, selectedMood);
        if (post) {
          textInput.value = '';
          charCount.textContent = '0 / 200';
          // Update local data reference
          data.posts.unshift(post);
          const feed = container.querySelector('#social-feed');
          const div  = document.createElement('div');
          div.innerHTML = renderPostCard(post, true);
          const card = div.firstElementChild;
          card.classList.add('animate-pop');
          feed.insertBefore(card, feed.firstChild);
          bindFeedEvents(feed);
          showMascotReactionBanner(container.querySelector('#social-banner-slot'), 'check_in_posted');
        }
      } catch (e) { console.error('[Social] Post submit error:', e); }
    });

    // ── Friend Chips → Profile Cards ──────────────────────────────────────────
    function bindFriendChips() {
      container.querySelectorAll('.social-friend-chip[data-friend-id]').forEach(chip => {
        chip.addEventListener('click', () => {
          try {
            const id = chip.dataset.friendId;
            const friend = data.friends.find(f => f.id === id);
            if (friend) openProfileCard(friend, container);
          } catch (e) { console.error('[Social] Friend chip error:', e); }
        });
      });
    }
    bindFriendChips();

    // ── Avatar clicks → Profile Cards ─────────────────────────────────────────
    function bindFeedEvents(feed) {
      // Avatar clicks
      feed.querySelectorAll('.social-avatar--clickable').forEach(av => {
        av.addEventListener('click', () => {
          try {
            const friendId = av.dataset.friendId;
            const friend = data.friends.find(f => f.id === friendId);
            if (friend) openProfileCard(friend, container);
          } catch (e) { console.error('[Social] Avatar click error:', e); }
        });
      });

      // Reactions
      feed.querySelectorAll('.social-react-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId = btn.dataset.postId;
            const emoji  = btn.dataset.emoji;
            reactToPost(postId, emoji);
            const updatedData = getSocialData();
            const post = updatedData.posts.find(p => p.id === postId);
            const card = feed.querySelector(`[data-post-id="${postId}"]`);
            if (post && card) {
              card.querySelector('.social-reactions-row').outerHTML = renderReactions(post);
              // Update our local reference
              const localPost = data.posts.find(p => p.id === postId);
              if (localPost && post.reactions) localPost.reactions = post.reactions;
              bindFeedEvents(feed);
            }
          } catch (e) { console.error('[Social] Reaction error:', e); }
        });
      });

      // Reply toggle
      feed.querySelectorAll('.social-reply-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId   = btn.dataset.postId;
            const composer = feed.querySelector(`#reply-composer-${postId}`);
            if (composer) {
              composer.classList.toggle('hidden');
              if (!composer.classList.contains('hidden')) {
                composer.querySelector('input').focus();
              }
            }
          } catch (e) { console.error('[Social] Reply toggle error:', e); }
        });
      });

      // Reply submit
      feed.querySelectorAll('.social-reply-submit').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId = btn.dataset.postId;
            const input  = feed.querySelector(`.social-reply-input[data-post-id="${postId}"]`);
            if (!input || !input.value.trim()) return;
            const reply = addReply(postId, input.value);
            if (reply) {
              input.value = '';
              const card = feed.querySelector(`[data-post-id="${postId}"]`);
              if (card) {
                const updatedData = getSocialData();
                const post = updatedData.posts.find(p => p.id === postId);
                const localPost = data.posts.find(p => p.id === postId);
                if (localPost && post) localPost.replies = post.replies;
                // Re-render replies in card
                let repliesEl = card.querySelector('.social-replies-preview');
                if (repliesEl) {
                  repliesEl.outerHTML = renderReplies(post || localPost);
                } else {
                  const reactRow = card.querySelector('.social-reactions-row');
                  if (reactRow) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = renderReplies(post || localPost);
                    reactRow.insertAdjacentElement('afterend', tempDiv.firstElementChild);
                  }
                }
                // Update reply button count
                const toggleBtn = card.querySelector('.social-reply-toggle-btn');
                const updatedPost = data.posts.find(p => p.id === postId);
                if (toggleBtn && updatedPost) {
                  toggleBtn.textContent = `💬 Reply (${(updatedPost.replies || []).length})`;
                }
              }
            }
          } catch (e) { console.error('[Social] Reply submit error:', e); }
        });
      });

      // Repost
      feed.querySelectorAll('.social-repost-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId  = btn.dataset.postId;
            const postData = data.posts.find(p => p.id === postId);
            if (!postData) return;
            const repost = repostPost(postData);
            if (repost) {
              data.posts.unshift(repost);
              const div = document.createElement('div');
              div.innerHTML = renderPostCard(repost, true);
              const card = div.firstElementChild;
              card.classList.add('animate-pop');
              feed.insertBefore(card, feed.firstChild);
              bindFeedEvents(feed);
              btn.textContent = '✅ Reposted!';
              btn.disabled = true;
            }
          } catch (e) { console.error('[Social] Repost error:', e); }
        });
      });
    }
    bindFeedEvents(container.querySelector('#social-feed'));

    // ── Add Friend Modal ───────────────────────────────────────────────────────
    const addBtn     = container.querySelector('#social-add-friend-btn');
    const modal      = container.querySelector('#add-friend-modal');
    const backdrop   = container.querySelector('#add-friend-backdrop');
    const cancelBtn  = container.querySelector('#add-friend-cancel');
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
        const mascots  = ['🦉', '🐻', '🐱', '🐺', '🦊'];
        const outfits  = ['', '👔', '🧑‍🚀', '🥷', '🤠', '🧙'];
        const newFriend = {
          id: 'friend_' + Date.now(),
          name: name.substring(0, 20),
          mascot: mascots[Math.floor(Math.random() * mascots.length)],
          streak: Math.floor(Math.random() * 10),
          level: Math.floor(Math.random() * 5) + 1,
          outfit: outfits[Math.floor(Math.random() * outfits.length)],
          rank: 'Recruit',
          bio: 'New to Odyssey! 🎯'
        };
        const d2 = getSocialData();
        d2.friends.push(newFriend);
        // Add notification
        d2.notifications = d2.notifications || [];
        d2.notifications.unshift({ id: 'n_' + Date.now(), icon: '🤝', text: `You added ${newFriend.name} as a friend!`, time: Date.now(), read: false });
        saveSocialData(d2);
        data.friends.push(newFriend);
        const strip   = container.querySelector('#social-friends-strip');
        const addChip = strip.querySelector('.social-add-friend');
        const chipDiv = document.createElement('div');
        chipDiv.innerHTML = renderFriendChip(newFriend);
        strip.insertBefore(chipDiv.firstElementChild, addChip);
        bindFriendChips();
        modal.classList.add('hidden');
        friendInput.value = '';
        showMascotReactionBanner(container.querySelector('#social-banner-slot'), 'new_friend');
      } catch (e) { console.error('[Social] Add friend error:', e); }
    });

  } catch (e) {
    console.error('[Social] Render error:', e);
    container.innerHTML = `<div class="social-error">⚠️ Social tab failed to load. Please refresh.</div>`;
  }
}
