// modules/social.js
// Kushal's Feature: Finch-style Social Tab (Squad feed, activity check-ins, custom vibes and mascot reactions)
// All data stored via storage.js interface functions (getProfile, saveProfile, getSocialData, saveSocialData)
// All functions wrapped in try-catch blocks to prevent browser errors.

import { getProfile, saveProfile, getSocialData, saveSocialData } from './storage.js';
import { getMascotReaction } from './mascot.js';

// ─── DEMO DATA SEEDING ────────────────────────────────────────────────────────

const DEMO_FRIENDS = [
  { id: 'demo_maya',  name: 'Maya',  mascot: '🐻', streak: 14, level: 5,  outfit: '🤠', rank: 'Sergeant',  bio: 'Morning person. Deep work addict. Yeehaw! 🤠' },
  { id: 'demo_arjun', name: 'Arjun', mascot: '🐱', streak: 7,  level: 3,  outfit: '🦸', rank: 'Corporal',  bio: 'Gym + Code every day. Defeating procrastination! ⚡' },
  { id: 'demo_priya', name: 'Priya', mascot: '🦉', streak: 21, level: 8,  outfit: '🥷', rank: 'Lieutenant', bio: 'Quiet focus, massive results. 🥷' }
];

const DEMO_POSTS = [
  {
    id: 'post_d1', authorId: 'demo_maya', authorName: 'Maya', authorMascot: '🐻', authorOutfit: '🤠',
    activity: 'Study 📚', text: 'Crushed my morning study block! 3 hours of deep focus 🎯', mood: '🔥',
    timestamp: Date.now() - 1000 * 60 * 47,
    vibes: { hug: 2, highfive: 3, cheer: 1 }, replies: [
      { authorName: 'Priya', authorMascot: '🦉', text: 'Absolutely 🔥 Keep going!', timestamp: Date.now() - 1000 * 60 * 30 }
    ]
  },
  {
    id: 'post_d2', authorId: 'demo_priya', authorName: 'Priya', authorMascot: '🦉', authorOutfit: '🥷',
    activity: 'Focus 🎯', text: '21-day streak hit! Nothing can stop me now 🌟', mood: '🌟',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    vibes: { cheer: 5, flex: 4, goodvibes: 2 }, replies: []
  },
  {
    id: 'post_d3', authorId: 'demo_arjun', authorName: 'Arjun', authorMascot: '🐱', authorOutfit: '🦸',
    activity: 'Sleep 🛌', text: 'Took a rest day today. Recovery sleep is key 😌', mood: '😌',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    vibes: { hug: 1, hydrate: 2 }, replies: []
  }
];

const DEMO_NOTIFICATIONS = [
  { id: 'n1', icon: '🫂', text: 'Maya sent you a Hug vibe on your check-in!', time: Date.now() - 1000 * 60 * 20, read: false },
  { id: 'n2', icon: '🖐️', text: 'Arjun sent you a High Five vibe! 🏆', time: Date.now() - 1000 * 60 * 60, read: false },
  { id: 'n3', icon: '👥', text: 'Priya hit a 21-day streak! Congratulate her! 🎉', time: Date.now() - 1000 * 60 * 60 * 3, read: true }
];

const VIBE_TYPES = {
  hug: { emoji: '🫂', label: 'Hug', color: '#ff7eb9' },
  highfive: { emoji: '🖐️', label: 'High Five', color: '#ff9f43' },
  cheer: { emoji: '🎉', label: 'Cheer', color: '#a55eea' },
  flex: { emoji: '💪', label: 'Flex', color: '#20bf6b' },
  hydrate: { emoji: '💧', label: 'Hydrate', color: '#0984e3' },
  goodvibes: { emoji: '✨', label: 'Good Vibes', color: '#fdcb6e' }
};

const ACTIVITY_CATEGORIES = [
  { label: 'Focus 🎯', val: 'Focus 🎯' },
  { label: 'Study 📚', val: 'Study 📚' },
  { label: 'Gym 🏋️', val: 'Gym 🏋️' },
  { label: 'Sleep 🛌', val: 'Sleep 🛌' },
  { label: 'Meditate 🧘', val: 'Meditate 🧘' },
  { label: 'Code 💻', val: 'Code 💻' },
  { label: 'Read 📖', val: 'Read 📖' },
  { label: 'Work 💼', val: 'Work 💼' },
  { label: 'Run 🏃', val: 'Run 🏃' }
];

const MOOD_OPTIONS = ['🔥', '😴', '🎯', '💪', '😤', '🌟', '😌', '🎉'];

function seedDemoData() {
  try {
    const data = getSocialData();
    let updated = false;
    if (!data.friends || data.friends.length === 0) {
      data.friends = [...DEMO_FRIENDS];
      updated = true;
    }
    if (!data.posts || data.posts.length === 0) {
      data.posts = [...DEMO_POSTS];
      updated = true;
    }
    if (!data.notifications || data.notifications.length === 0) {
      data.notifications = [...DEMO_NOTIFICATIONS];
      updated = true;
    }
    if (updated) {
      saveSocialData(data);
    }
  } catch (e) {
    console.error('[Social] Error seeding demo data:', e);
  }
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
  } catch (e) {
    return '';
  }
}

function generateId() {
  try {
    return 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  } catch (e) {
    return 'post_' + Date.now();
  }
}

function unreadCount(notifications) {
  try {
    return (notifications || []).filter(n => !n.read).length;
  } catch (e) {
    return 0;
  }
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

function postCheckIn(text, activity, mood) {
  try {
    const profile = getProfile();
    const data = getSocialData();
    const mascotEmojis = { owl: '🦉', bear: '🐻', cat: '🐱' };
    const outfitEmojis = {
      none: '', suit: '👔', astronaut: '🧑‍🚀', visor: '🕶️',
      ninja: '🥷', cowboy: '🤠', wizard: '🧙', detective: '🕵️',
      chef: '🧑‍🍳', superhero: '🦸'
    };

    const newPost = {
      id: generateId(),
      authorId: 'me',
      authorName: profile.name || 'You',
      authorMascot: mascotEmojis[profile.equippedMascot] || '🦉',
      authorOutfit: outfitEmojis[profile.equippedOutfit] || '',
      activity: activity || 'Focus 🎯',
      text: text.trim().substring(0, 200),
      mood: mood || '🎯',
      timestamp: Date.now(),
      vibes: {},
      replies: []
    };

    data.posts.unshift(newPost);
    if (data.posts.length > 50) data.posts = data.posts.slice(0, 50);

    saveSocialData(data);
    return newPost;
  } catch (e) {
    console.error('[Social] Post error:', e);
    return null;
  }
}

function sendVibeToPost(postId, vibeType) {
  try {
    const data = getSocialData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return 0;

    if (!post.vibes) post.vibes = {};
    if (!post.vibes[vibeType]) post.vibes[vibeType] = 0;
    post.vibes[vibeType]++;

    // If it's a friend's post, simulate adding a notification for them
    // If it's own post, it also saves correctly
    saveSocialData(data);
    return post.vibes[vibeType];
  } catch (e) {
    console.error('[Social] Send vibe error:', e);
    return 0;
  }
}

function addReplyToPost(postId, replyText) {
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
  } catch (e) {
    console.error('[Social] Add reply error:', e);
    return null;
  }
}

function markAllNotificationsRead() {
  try {
    const data = getSocialData();
    (data.notifications || []).forEach(n => n.read = true);
    saveSocialData(data);
  } catch (e) {
    console.error('[Social] Mark read error:', e);
  }
}

// ─── RENDERING HELPERS ────────────────────────────────────────────────────────

function renderReplies(post) {
  try {
    const replies = post.replies || [];
    if (replies.length === 0) return '';
    return replies.map(r => `
      <div class="finch-reply-row">
        <span class="finch-reply-avatar">${r.authorMascot}</span>
        <div class="finch-reply-content">
          <div class="finch-reply-header">
            <span class="finch-reply-name">${r.authorName}</span>
            <span class="finch-reply-time">${formatTimeAgo(r.timestamp)}</span>
          </div>
          <p class="finch-reply-text">${r.text}</p>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('[Social] Render replies error:', e);
    return '';
  }
}

function renderPostCard(post, isOwn = false) {
  try {
    const safeName = post.authorName || 'Friend';
    const vibes = post.vibes || {};
    const totalVibes = Object.values(vibes).reduce((a, b) => a + b, 0);

    // Build the vibes list HTML
    let vibesTallyHTML = '';
    if (totalVibes > 0) {
      vibesTallyHTML = `
        <div class="finch-post-vibes-tally">
          ${Object.entries(vibes).map(([vibe, count]) => {
            if (count === 0) return '';
            const details = VIBE_TYPES[vibe] || { emoji: '❤️' };
            return `<span class="finch-vibe-bubble" title="${count} ${vibe} vibes sent">${details.emoji} <span class="vibe-count">${count}</span></span>`;
          }).join('')}
        </div>
      `;
    }

    return `
      <div class="finch-post-card card-3d" data-post-id="${post.id}">
        <div class="finch-post-header">
          <div class="finch-avatar-wrapper social-avatar--clickable" data-friend-id="${post.authorId}">
            <div class="finch-avatar-icon">${post.authorMascot || '🦉'}</div>
            ${post.authorOutfit ? `<div class="finch-avatar-outfit">${post.authorOutfit}</div>` : ''}
          </div>
          <div class="finch-post-meta">
            <div class="finch-post-author-row">
              <span class="finch-post-author-name">${safeName}</span>
              ${isOwn ? `<span class="finch-badge-me">You</span>` : ''}
            </div>
            <span class="finch-post-time">${formatTimeAgo(post.timestamp)}</span>
          </div>
          <div class="finch-post-badge-box">
            <span class="finch-post-activity-tag">${post.activity || 'Focus 🎯'}</span>
            <span class="finch-post-mood-bubble">${post.mood || '🎯'}</span>
          </div>
        </div>

        <div class="finch-post-body">
          <p class="finch-post-text">${post.text}</p>
        </div>

        ${vibesTallyHTML}

        <!-- Replies Section -->
        <div class="finch-replies-section ${post.replies && post.replies.length > 0 ? '' : 'hidden'}" id="replies-box-${post.id}">
          <div class="finch-replies-list" id="replies-list-${post.id}">
            ${renderReplies(post)}
          </div>
        </div>

        <!-- Composer for comment (collapsible) -->
        <div class="finch-comment-composer hidden" id="comment-composer-${post.id}">
          <input type="text" placeholder="Write a supportive reply..." maxlength="140" class="finch-comment-input" data-post-id="${post.id}"/>
          <button class="btn btn-primary btn-xs btn-3d comment-submit-btn" data-post-id="${post.id}">Send</button>
        </div>

        <!-- Interactive Actions footer -->
        <div class="finch-post-actions">
          <button class="finch-action-btn vibe-picker-toggle-btn" data-post-id="${post.id}">
            <span>✨</span> Send Vibes
          </button>
          
          <button class="finch-action-btn comment-toggle-btn" data-post-id="${post.id}">
            <span>💬</span> Comment (${post.replies ? post.replies.length : 0})
          </button>

          <!-- Vibe Picker Float Box -->
          <div class="finch-vibe-picker hidden" id="vibe-picker-${post.id}">
            <div class="vibe-picker-inner">
              ${Object.entries(VIBE_TYPES).map(([key, details]) => `
                <button class="vibe-option-btn" data-post-id="${post.id}" data-vibe="${key}" style="--vibe-color: ${details.color}">
                  <span class="vibe-opt-emoji">${details.emoji}</span>
                  <span class="vibe-opt-label">${details.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    console.error('[Social] Render post card error:', e);
    return '';
  }
}

function renderFriendChip(friend) {
  try {
    return `
      <div class="finch-friend-chip card-3d" data-friend-id="${friend.id}">
        <div class="finch-friend-avatar">
          <span class="avatar-mascot">${friend.mascot}</span>
          ${friend.outfit ? `<span class="avatar-outfit">${friend.outfit}</span>` : ''}
          <span class="online-indicator"></span>
        </div>
        <span class="friend-name">${friend.name}</span>
        <span class="friend-streak">🔥 ${friend.streak}d</span>
      </div>
    `;
  } catch (e) {
    console.error('[Social] Render friend chip error:', e);
    return '';
  }
}

function renderNotificationPanel(notifications) {
  try {
    return `
      <div class="finch-notif-panel card-3d" id="finch-notif-panel">
        <div class="finch-notif-header">
          <h3>🔔 Squad Vibes & Alerts</h3>
          <button class="btn btn-secondary btn-xs btn-3d" id="finch-mark-all-read-btn">Clear All</button>
        </div>
        <div class="finch-notif-list">
          ${notifications.length === 0
            ? `<div class="finch-notif-empty">No new vibes. Share updates to inspire the squad! 👥</div>`
            : notifications.map(n => `
              <div class="finch-notif-item ${n.read ? '' : 'finch-notif-item--unread'}">
                <span class="finch-notif-icon">${n.icon}</span>
                <div class="finch-notif-body">
                  <p class="finch-notif-text">${n.text}</p>
                  <span class="finch-notif-time">${formatTimeAgo(n.time)}</span>
                </div>
                ${!n.read ? `<span class="finch-notif-unread-dot"></span>` : ''}
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  } catch (e) {
    console.error('[Social] Render notification panel error:', e);
    return '';
  }
}

function renderLeaderboard(friends, profile) {
  try {
    const myEntry = { name: profile.name || 'You', streak: profile.streak || 0, mascot: '🦉', isMe: true };
    const all = [...friends, myEntry].sort((a, b) => b.streak - a.streak);
    const medals = ['🥇', '🥈', '🥉'];
    return `
      <div class="finch-leaderboard card-3d">
        <h3 class="finch-lb-title">🏆 Weekly Streak Leaders</h3>
        <div class="finch-lb-list">
          ${all.map((f, i) => `
            <div class="finch-lb-row ${f.isMe ? 'finch-lb-row--me' : ''}">
              <span class="finch-lb-rank">${medals[i] || `#${i + 1}`}</span>
              <span class="finch-lb-mascot">${f.mascot}</span>
              <span class="finch-lb-name">${f.name}${f.isMe ? ' (You)' : ''}</span>
              <span class="finch-lb-streak">🔥 ${f.streak} days</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) {
    console.error('[Social] Render leaderboard error:', e);
    return '';
  }
}

function openProfileCard(friend, container) {
  try {
    if (!friend) return;
    const existing = container.querySelector('#finch-profile-card-modal');
    if (existing) existing.remove();

    const data = getSocialData();
    const friendPosts = data.posts.filter(p => p.authorId === friend.id).slice(0, 3);

    const modal = document.createElement('div');
    modal.className = 'finch-profile-modal';
    modal.id = 'finch-profile-card-modal';
    modal.innerHTML = `
      <div class="finch-modal-backdrop" id="profile-backdrop"></div>
      <div class="finch-profile-card card-3d animate-pop">
        <div class="finch-profile-hero">
          <div class="finch-profile-avatar-big">
            <span>${friend.mascot}</span>
            ${friend.outfit ? `<span class="finch-profile-outfit-big">${friend.outfit}</span>` : ''}
          </div>
          <div class="finch-profile-info">
            <h3 class="finch-profile-name">${friend.name}</h3>
            <span class="finch-profile-rank">${friend.rank || 'Recruit'}</span>
            <p class="finch-profile-bio">${friend.bio || 'No bio yet 😊'}</p>
          </div>
        </div>
        
        <div class="finch-profile-stats-row">
          <div class="finch-profile-stat">
            <span class="finch-profile-stat-val">🔥 ${friend.streak}</span>
            <span class="finch-profile-stat-label">Streak</span>
          </div>
          <div class="finch-profile-stat">
            <span class="finch-profile-stat-val">⭐ ${friend.level}</span>
            <span class="finch-profile-stat-label">Level</span>
          </div>
          <div class="finch-profile-stat">
            <span class="finch-profile-stat-val">📝 ${friendPosts.length}</span>
            <span class="finch-profile-stat-label">Posts</span>
          </div>
        </div>

        ${friendPosts.length > 0 ? `
          <div class="finch-profile-recent">
            <p class="finch-profile-recent-label">Recent Activities</p>
            ${friendPosts.map(p => `
              <div class="finch-profile-recent-post card-3d">
                <div class="recent-post-header">
                  <span class="recent-tag">${p.activity}</span>
                  <span class="recent-mood">${p.mood}</span>
                </div>
                <p class="recent-text">${p.text}</p>
                <span class="recent-time">${formatTimeAgo(p.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="finch-profile-modal-actions">
          <button class="btn btn-primary btn-3d challenge-partner-btn">⚡ Challenge Partner</button>
          <button class="btn btn-secondary btn-3d close-profile-modal-btn" id="profile-close-btn">✕ Close</button>
        </div>
      </div>
    `;
    container.appendChild(modal);

    modal.querySelector('#profile-backdrop').addEventListener('click', () => { try { modal.remove(); } catch (e) {} });
    modal.querySelector('#profile-close-btn').addEventListener('click', () => { try { modal.remove(); } catch (e) {} });
    modal.querySelector('.challenge-partner-btn').addEventListener('click', () => {
      try {
        const btn = modal.querySelector('.challenge-partner-btn');
        btn.textContent = '✅ Challenge Sent!';
        btn.disabled = true;
        btn.classList.add('btn-success');
        btn.classList.remove('btn-primary');
      } catch (e) {}
    });
  } catch (e) {
    console.error('[Social] Error opening profile card:', e);
  }
}

function showMascotReactionBanner(container, event) {
  try {
    const reaction = getMascotReaction(event);
    if (!reaction) return;

    // Check and remove existing banners
    const existing = container.querySelector('.finch-mascot-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'finch-mascot-banner card-3d animate-pop';
    banner.innerHTML = `
      <div class="banner-mascot-icon">
        <span class="base">${reaction.mascotEmoji}</span>
        ${reaction.outfitEmoji ? `<span class="outfit">${reaction.outfitEmoji}</span>` : ''}
      </div>
      <div class="banner-body">
        <span class="emoji-bubble">${reaction.emoji}</span>
        <p class="msg">${reaction.message}</p>
      </div>
    `;
    container.insertBefore(banner, container.firstChild);
    setTimeout(() => {
      try {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 500);
      } catch (e) {}
    }, 4000);
  } catch (e) {
    console.error('[Social] Mascot banner error:', e);
  }
}

function createFloatingVibeElement(button, emoji) {
  try {
    const rect = button.getBoundingClientRect();
    const container = document.querySelector('.android-phone-frame') || document.body;
    const containerRect = container.getBoundingClientRect();

    const floatEl = document.createElement('span');
    floatEl.className = 'finch-floating-vibe';
    floatEl.textContent = emoji;
    
    // Position it relative to the container
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top;
    
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    
    container.appendChild(floatEl);
    
    setTimeout(() => {
      try { floatEl.remove(); } catch (e) {}
    }, 1500);
  } catch (e) {
    console.error('[Social] Floating vibe animation error:', e);
  }
}

// ─── MAIN RENDER VIEW ────────────────────────────────────────────────────────

export function renderSocial(container) {
  try {
    seedDemoData();
    const data = getSocialData();
    const profile = getProfile();
    let selectedActivity = 'Focus 🎯';
    let selectedMood = '🎯';

    // Calculate leaderboard standing rank
    const myEntryForRank = { name: profile.name || 'You', streak: profile.streak || 0, isMe: true };
    const leaderboardRankings = [...data.friends, myEntryForRank].sort((a, b) => b.streak - a.streak);
    const myStandingRank = leaderboardRankings.findIndex(f => f.isMe) + 1;

    const unread = unreadCount(data.notifications);

    container.innerHTML = `
      <div class="finch-social-view">
        <!-- Social Header -->
        <div class="finch-social-header">
          <h2 class="social-view-title">👥 Squad Circle</h2>
          <button class="finch-bell-btn" id="finch-bell-btn" aria-label="Notifications">
            🔔
            ${unread > 0 ? `<span class="finch-bell-badge">${unread}</span>` : ''}
          </button>
        </div>

        <div class="view-progress-pill" style="margin-bottom: 16px;">
          <span>Weekly Squad Standing: <strong>🏆 Rank #${myStandingRank}</strong></span>
        </div>

        <!-- Notification Panel (hidden by default) -->
        <div id="finch-notif-wrapper" class="hidden">
          ${renderNotificationPanel(data.notifications)}
        </div>

        <!-- Banner slot for mascot dialog reactions -->
        <div id="finch-banner-slot"></div>

        <!-- Squad Friends Strip -->
        <div class="finch-social-section">
          <div class="finch-section-label">Accountability Squad</div>
          <div class="finch-friends-strip" id="finch-friends-strip">
            ${data.friends.map(f => renderFriendChip(f)).join('')}
            <div class="finch-friend-chip finch-add-friend card-3d" id="finch-add-friend-btn">
              <div class="finch-friend-avatar add-avatar">➕</div>
              <span class="friend-name">Add Partner</span>
            </div>
          </div>
        </div>

        <!-- Weekly Leaderboard -->
        <div class="finch-social-section">
          ${renderLeaderboard(data.friends, profile)}
        </div>

        <!-- Activity Check-In Composer -->
        <div class="finch-social-section">
          <div class="finch-section-label">Log Custom Activity</div>
          <div class="finch-composer card-3d">
            <div class="composer-row">
              <span class="label">Activity:</span>
              <div class="composer-select-box">
                <select id="finch-activity-select" class="finch-dropdown">
                  ${ACTIVITY_CATEGORIES.map(act => `
                    <option value="${act.val}">${act.label}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            
            <div class="composer-row" style="margin-top:8px;">
              <span class="label">Mood:</span>
              <div class="composer-moods-strip" id="finch-moods-strip">
                ${MOOD_OPTIONS.map(m => `
                  <button class="composer-mood-btn ${m === '🎯' ? 'mood-btn--active' : ''}" data-mood="${m}">${m}</button>
                `).join('')}
              </div>
            </div>

            <textarea id="finch-composer-text" class="finch-composer-textarea"
                      placeholder="Explain what you did! Inspire your squad... ✍️"
                      maxlength="200" rows="3"></textarea>
            
            <div class="composer-footer">
              <span class="char-counter" id="finch-char-counter">0 / 200</span>
              <button class="btn btn-success btn-3d post-checkin-btn" id="finch-post-checkin-btn">Post Check-In 🚀</button>
            </div>
          </div>
        </div>

        <!-- Squad Feed list -->
        <div class="finch-social-section">
          <div class="finch-section-label">Activity Feed</div>
          <div class="finch-feed" id="finch-feed">
            ${data.posts.length > 0 
              ? data.posts.map(p => renderPostCard(p, p.authorId === 'me')).join('')
              : `<div class="finch-feed-empty">No updates yet. Be the first to post! 🚀</div>`
            }
          </div>
        </div>
      </div>

      <!-- Add Friend Modal Overlay -->
      <div id="finch-add-friend-modal" class="finch-modal hidden">
        <div class="finch-modal-backdrop" id="add-friend-backdrop"></div>
        <div class="finch-modal-card card-3d animate-pop">
          <h3>Add Accountability Partner 🤝</h3>
          <p class="sub">Enter your friend's name to connect</p>
          <input type="text" id="add-friend-input" class="finch-modal-input" placeholder="Partner name..." maxlength="30" />
          <div class="finch-modal-actions">
            <button class="btn btn-secondary btn-3d" id="add-friend-cancel">Cancel</button>
            <button class="btn btn-primary btn-3d" id="add-friend-confirm">Add Partner ✅</button>
          </div>
        </div>
      </div>
    `;

    // ── INTERACTION HANDLERS ──────────────────────────────────────────────────

    // 1. Notification Toggle
    const bellBtn = container.querySelector('#finch-bell-btn');
    const notifWrapper = container.querySelector('#finch-notif-wrapper');
    let notifOpen = false;
    bellBtn.addEventListener('click', () => {
      try {
        notifOpen = !notifOpen;
        notifWrapper.classList.toggle('hidden', !notifOpen);
        if (notifOpen) {
          markAllNotificationsRead();
          const badge = bellBtn.querySelector('.finch-bell-badge');
          if (badge) badge.remove();
        }
      } catch (e) {
        console.error('[Social] Bell toggle error:', e);
      }
    });

    const markReadBtn = container.querySelector('#finch-mark-all-read-btn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        try {
          markAllNotificationsRead();
          container.querySelectorAll('.finch-notif-item--unread').forEach(el => el.classList.remove('finch-notif-item--unread'));
          container.querySelectorAll('.finch-notif-unread-dot').forEach(el => el.remove());
          const socialData = getSocialData();
          socialData.notifications = [];
          saveSocialData(socialData);
          container.querySelector('.finch-notif-list').innerHTML = `<div class="finch-notif-empty">No new vibes. Share updates to inspire the squad! 👥</div>`;
        } catch (e) {
          console.error('[Social] Mark notifications read error:', e);
        }
      });
    }

    // 2. Activity Category Dropdown
    const actSelect = container.querySelector('#finch-activity-select');
    actSelect.addEventListener('change', () => {
      try {
        selectedActivity = actSelect.value;
      } catch (e) {}
    });

    // 3. Composer Mood Options
    container.querySelectorAll('.composer-mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          container.querySelectorAll('.composer-mood-btn').forEach(b => b.classList.remove('mood-btn--active'));
          btn.classList.add('mood-btn--active');
          selectedMood = btn.dataset.mood;
        } catch (e) {
          console.error('[Social] Mood selection error:', e);
        }
      });
    });

    // 4. Character Counter
    const composerText = container.querySelector('#finch-composer-text');
    const charCounter = container.querySelector('#finch-char-counter');
    composerText.addEventListener('input', () => {
      try {
        charCounter.textContent = `${composerText.value.length} / 200`;
      } catch (e) {}
    });

    // 5. Post Check-in Submission
    container.querySelector('#finch-post-checkin-btn').addEventListener('click', () => {
      try {
        const text = composerText.value.trim();
        if (!text) {
          composerText.classList.add('shake');
          setTimeout(() => composerText.classList.remove('shake'), 500);
          return;
        }
        const post = postCheckIn(text, selectedActivity, selectedMood);
        if (post) {
          composerText.value = '';
          charCounter.textContent = '0 / 200';
          // Re-render feed
          const feed = container.querySelector('#finch-feed');
          const div = document.createElement('div');
          div.innerHTML = renderPostCard(post, true);
          const card = div.firstElementChild;
          card.classList.add('animate-pop');
          
          const emptyFeed = feed.querySelector('.finch-feed-empty');
          if (emptyFeed) emptyFeed.remove();

          feed.insertBefore(card, feed.firstChild);
          bindFeedItemEvents(feed);

          // Triggers mascot reactive feedback banner
          showMascotReactionBanner(container.querySelector('#finch-banner-slot'), 'check_in_posted');
        }
      } catch (e) {
        console.error('[Social] Submit check-in error:', e);
      }
    });

    // 6. Friends Chips Modal Pop-up
    function bindFriendChips() {
      container.querySelectorAll('.finch-friend-chip[data-friend-id]').forEach(chip => {
        chip.addEventListener('click', () => {
          try {
            const id = chip.dataset.friendId;
            const friend = data.friends.find(f => f.id === id);
            if (friend) openProfileCard(friend, container);
          } catch (e) {
            console.error('[Social] Friend chip click error:', e);
          }
        });
      });
    }
    bindFriendChips();

    // 7. Add Friend Modal Operations
    const addBtn = container.querySelector('#finch-add-friend-btn');
    const modal = container.querySelector('#finch-add-friend-modal');
    const backdrop = container.querySelector('#add-friend-backdrop');
    const cancelBtn = container.querySelector('#add-friend-cancel');
    const confirmBtn = container.querySelector('#add-friend-confirm');
    const friendInput = container.querySelector('#add-friend-input');

    addBtn.addEventListener('click', () => {
      try {
        modal.classList.remove('hidden');
        friendInput.focus();
      } catch (e) {}
    });

    [backdrop, cancelBtn].forEach(el => el.addEventListener('click', () => {
      try {
        modal.classList.add('hidden');
        friendInput.value = '';
      } catch (e) {}
    }));

    confirmBtn.addEventListener('click', () => {
      try {
        const name = friendInput.value.trim();
        if (!name) return;
        
        const mascots = ['🦉', '🐻', '🐱'];
        const outfits = ['', '👔', '🧑‍🚀', '🥷', '🤠', '🧙', '🕵️', '🧑‍🍳', '🦸'];
        const bios = [
          'Grinding every day! 🎯', 'Deep focus is my game. 📖',
          'Healthy routines, healthy mind. 🧘', 'Let\'s achieve our goals! 💪'
        ];

        const newFriend = {
          id: 'friend_' + Date.now(),
          name: name.substring(0, 20),
          mascot: mascots[Math.floor(Math.random() * mascots.length)],
          streak: Math.floor(Math.random() * 8) + 1,
          level: Math.floor(Math.random() * 4) + 1,
          outfit: outfits[Math.floor(Math.random() * outfits.length)],
          rank: 'Recruit',
          bio: bios[Math.floor(Math.random() * bios.length)]
        };

        const socialData = getSocialData();
        socialData.friends.push(newFriend);
        // Simulate notification
        socialData.notifications = socialData.notifications || [];
        socialData.notifications.unshift({
          id: 'n_' + Date.now(),
          icon: '🤝',
          text: `You added ${newFriend.name} to your squad!`,
          time: Date.now(),
          read: false
        });

        saveSocialData(socialData);
        data.friends.push(newFriend);

        // Append to friends strip
        const strip = container.querySelector('#finch-friends-strip');
        const addChipBtn = strip.querySelector('#finch-add-friend-btn');
        const chipDiv = document.createElement('div');
        chipDiv.innerHTML = renderFriendChip(newFriend);
        strip.insertBefore(chipDiv.firstElementChild, addChipBtn);

        bindFriendChips();

        modal.classList.add('hidden');
        friendInput.value = '';
        
        showMascotReactionBanner(container.querySelector('#finch-banner-slot'), 'new_friend');
      } catch (e) {
        console.error('[Social] Add partner error:', e);
      }
    });

    // 8. Bind post events (Vibes Picker, Comment Toggle, commenting)
    function bindFeedItemEvents(feed) {
      // Click avatar -> opens Profile
      feed.querySelectorAll('.social-avatar--clickable').forEach(av => {
        av.addEventListener('click', (e) => {
          try {
            e.stopPropagation();
            const id = av.dataset.friendId;
            if (id === 'me') {
              // Show own brief info
              const ownProfile = {
                id: 'me', name: profile.name || 'You', mascot: '🦉',
                streak: profile.streak || 0, level: profile.level || 1,
                outfit: profile.equippedOutfit !== 'none' ? OUTFIT_DISPLAY[profile.equippedOutfit]?.emoji : '',
                rank: profile.militaryRank || 'Civilian', bio: 'Living the mindful life!'
              };
              openProfileCard(ownProfile, container);
            } else {
              const friend = data.friends.find(f => f.id === id);
              if (friend) openProfileCard(friend, container);
            }
          } catch (err) {}
        });
      });

      // Vibe Picker toggle
      feed.querySelectorAll('.vibe-picker-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          try {
            e.stopPropagation();
            const postId = btn.dataset.postId;
            const picker = feed.querySelector(`#vibe-picker-${postId}`);
            if (picker) {
              picker.classList.toggle('hidden');
            }
          } catch (err) {}
        });
      });

      // Close vibe picker when clicking outside
      document.addEventListener('click', () => {
        try {
          feed.querySelectorAll('.finch-vibe-picker').forEach(p => p.classList.add('hidden'));
        } catch (e) {}
      });

      // Vibe Option Selection
      feed.querySelectorAll('.vibe-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          try {
            e.stopPropagation();
            const postId = btn.dataset.postId;
            const vibeKey = btn.dataset.vibe;
            const details = VIBE_TYPES[vibeKey] || { emoji: '❤️' };

            const newCount = sendVibeToPost(postId, vibeKey);
            
            // Trigger floating vibe animation
            createFloatingVibeElement(btn, details.emoji);

            // Hide picker
            const picker = feed.querySelector(`#vibe-picker-${postId}`);
            if (picker) picker.classList.add('hidden');

            // Refresh the specific post card content (or just re-render tally)
            const postData = getSocialData().posts.find(p => p.id === postId);
            const card = feed.querySelector(`.finch-post-card[data-post-id="${postId}"]`);
            if (postData && card) {
              // Update localized tally
              let tally = card.querySelector('.finch-post-vibes-tally');
              if (!tally) {
                tally = document.createElement('div');
                tally.className = 'finch-post-vibes-tally';
                card.insertBefore(tally, card.querySelector('.finch-replies-section'));
              }
              tally.innerHTML = Object.entries(postData.vibes || {}).map(([v, c]) => {
                if (c === 0) return '';
                const vDetails = VIBE_TYPES[v] || { emoji: '❤️' };
                return `<span class="finch-vibe-bubble">${vDetails.emoji} <span class="vibe-count">${c}</span></span>`;
              }).join('');

              // Trigger mascot banner reaction locally
              showMascotReactionBanner(container.querySelector('#finch-banner-slot'), 'reaction_received');
            }
          } catch (err) {
            console.error('[Social] Error selecting vibe:', err);
          }
        });
      });

      // Comment Section Toggle
      feed.querySelectorAll('.comment-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId = btn.dataset.postId;
            const comp = feed.querySelector(`#comment-composer-${postId}`);
            if (comp) {
              comp.classList.toggle('hidden');
              if (!comp.classList.contains('hidden')) {
                comp.querySelector('input').focus();
              }
            }
          } catch (err) {}
        });
      });

      // Submit Comment
      feed.querySelectorAll('.comment-submit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const postId = btn.dataset.postId;
            const input = feed.querySelector(`.finch-comment-input[data-post-id="${postId}"]`);
            if (!input || !input.value.trim()) return;

            const reply = addReplyToPost(postId, input.value);
            if (reply) {
              input.value = '';
              const box = feed.querySelector(`#replies-box-${postId}`);
              const list = feed.querySelector(`#replies-list-${postId}`);
              if (box && list) {
                box.classList.remove('hidden');
                
                const replyDiv = document.createElement('div');
                replyDiv.className = 'finch-reply-row';
                replyDiv.innerHTML = `
                  <span class="finch-reply-avatar">${reply.authorMascot}</span>
                  <div class="finch-reply-content">
                    <div class="finch-reply-header">
                      <span class="finch-reply-name">${reply.authorName}</span>
                      <span class="finch-reply-time">just now</span>
                    </div>
                    <p class="finch-reply-text">${reply.text}</p>
                  </div>
                `;
                list.appendChild(replyDiv);

                // Update comments button count
                const count = list.children.length;
                const toggleBtn = feed.querySelector(`.comment-toggle-btn[data-post-id="${postId}"]`);
                if (toggleBtn) {
                  toggleBtn.innerHTML = `<span>💬</span> Comment (${count})`;
                }
              }
            }
          } catch (err) {
            console.error('[Social] Error submitting comment:', err);
          }
        });
      });
    }

    bindFeedItemEvents(container.querySelector('#finch-feed'));

  } catch (e) {
    console.error('[Social] Render error:', e);
    container.innerHTML = `<div class="social-error">⚠️ Social tab failed to load. Please refresh.</div>`;
  }
}
