// modules/social_v2.js
// Supabase-powered Instagram/Strava Hybrid Social Network
// Real-time connections, posts, likes, comments, and profile sheets

import { supabase } from './supabase.js';
import { getProfile, saveProfile } from './storage.js';
import { showToast, playUnlockSound, playSuccessSound } from './notifications.js';

// --- TIME FORMATTING ---
function formatTimeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch (e) {
    return '';
  }
}

// --- CORE SOCIAL RENDERER ---
export function renderSocial(container) {
  container.innerHTML = `
    <div class="social-view">
      <div class="social-loading-screen" style="text-align: center; padding: 50px;">
        <span class="spinner" style="font-size: 32px; display: block; margin-bottom: 12px; animation: spin 1s linear infinite;">🔄</span>
        <p>Connecting to Odyssey Network...</p>
      </div>
    </div>
  `;

  checkUserSession(container);
}

// --- AUTHENTICATION CHECK ---
async function checkUserSession(container) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-hint);">Please log in to access social features.</div>`;
    } else {
      // Check if user has completed profile setup and has a username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile || !profile.username || profile.username.startsWith('user_')) {
        renderUsernameSetup(container, session.user);
      } else {
        // Sync local profile username
        const localProf = getProfile();
        localProf.username = profile.username;
        localProf.name = profile.display_name || localProf.name;
        saveProfile(localProf);

        renderMainSocialFeed(container, profile);
      }
    }
  } catch (err) {
    console.error('[Social] Session check failed:', err);
    container.innerHTML = `
      <div class="card card-3d" style="text-align: center; padding: 25px; border-color: var(--duo-red);">
        <h3>⚠️ Connection Failed</h3>
        <p>Failed to connect to the server. Please check your internet connection.</p>
        <button class="btn btn-primary btn-3d btn-sm" id="retry-session-btn" style="margin-top: 15px;">Retry Connection</button>
      </div>
    `;
    container.querySelector('#retry-session-btn').onclick = () => renderSocial(container);
  }
}

// --- USERNAME SETUP ---
function renderUsernameSetup(container, user) {
  container.innerHTML = `
    <div class="social-auth-card card-3d animate-pop" style="max-width: 380px; margin: 20px auto; padding: 25px;">
      <h3 style="font-family: var(--font-header); text-align: center; margin-bottom: 6px;">🏷️ Choose Username</h3>
      <p class="hint" style="text-align: center; margin-bottom: 20px;">Every Odyssey user needs a unique username to send and receive requests.</p>
      
      <form id="username-form" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="position: relative; display: flex; align-items: center;">
          <span style="position: absolute; left: 12px; font-weight: 700; color: var(--text-hint);">@</span>
          <input type="text" id="username-input" class="social-modal-input" placeholder="username" required maxlength="15" style="width: 100%; padding-left: 28px;" />
        </div>
        <button type="submit" class="btn btn-primary btn-3d btn-full" id="username-submit-btn">Set Username & Begin 🚀</button>
      </form>
      <button class="btn btn-secondary btn-3d btn-full btn-sm" id="username-logout-btn" style="margin-top: 10px; background: var(--bg-hover); border-color: var(--border-color);">🚪 Log Out of Account</button>
    </div>
  `;

  const usernameForm = container.querySelector('#username-form');
  const input = container.querySelector('#username-input');
  const submitBtn = container.querySelector('#username-submit-btn');

  container.querySelector('#username-logout-btn').onclick = async () => {
    await supabase.auth.signOut();
    showToast("Logged out.", "info");
    renderSocial(container);
  };

  // Prevent invalid characters
  input.oninput = () => {
    input.value = input.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  usernameForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = input.value.trim();
    if (username.length < 3) {
      showToast("Username must be at least 3 characters.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking availability...';

    try {
      // Check if username is already taken
      const { data: taken, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;

      if (taken) {
        showToast("Username already taken! ❌", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Set Username & Begin 🚀';
        return;
      }

      // Claim username using upsert
      const localProf = getProfile();
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username,
          display_name: localProf.name || 'Player',
          email: user.email
        });

      if (updateError) throw updateError;

      // Update local storage profile
      localProf.username = username;
      saveProfile(localProf);
      
      showToast("Username registered! Welcome to Odyssey.", "success");
      playSuccessSound();

      checkUserSession(container);
    } catch (err) {
      showToast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = 'Set Username & Begin 🚀';
    }
  };
}

// --- MAIN SOCIAL VIEW ---
async function renderMainSocialFeed(container, userProfile) {
  let activeTab = 'feed'; // 'feed', 'squad', 'pending'
  
  // Clean outer container and prepare layouts
  container.innerHTML = `
    <div class="social-view">
      <!-- Navigation Tabs & Log Out -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">
        <div class="social-feed-tabs" style="display:flex; gap: 16px;">
          <button class="social-tab-btn active" data-tab="feed" style="background:none; border:none; color:var(--text-color); font-weight:700; font-size:14px; cursor:pointer; padding: 4px 0; position:relative;">Feed</button>
          <button class="social-tab-btn" data-tab="squad" style="background:none; border:none; color:var(--text-hint); font-weight:700; font-size:14px; cursor:pointer; padding: 4px 0; position:relative;">Squad</button>
          <button class="social-tab-btn" data-tab="pending" id="pending-tab-btn" style="background:none; border:none; color:var(--text-hint); font-weight:700; font-size:14px; cursor:pointer; padding: 4px 0; position:relative;">Requests</button>
        </div>
        <button id="logout-btn" title="Log Out" style="background:none; border:none; font-size: 16px; cursor:pointer; color: var(--text-hint);">🚪</button>
      </div>

      <!-- Core Display Window -->
      <div id="social-viewport"></div>
    </div>

    <!-- Bottom Sheet Modal (Instagram/Strava profile) -->
    <div class="profile-sheet-overlay hidden" id="profile-sheet-overlay">
      <div class="profile-sheet-backdrop" id="profile-sheet-backdrop"></div>
      <div class="profile-sheet card-3d">
        <div class="profile-sheet-handle"></div>
        <div id="profile-sheet-content"></div>
      </div>
    </div>
  `;

  const viewport = container.querySelector('#social-viewport');
  const tabs = container.querySelectorAll('.social-tab-btn');

  // Bind tab switching
  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-hint)';
      });
      btn.classList.add('active');
      btn.style.color = 'var(--text-color)';
      activeTab = btn.getAttribute('data-tab');
      renderTabContent(viewport, activeTab, userProfile, container);
    };
  });

  // Bind Log Out
  container.querySelector('#logout-btn').onclick = async () => {
    if (confirm("Are you sure you want to log out? Your local scores will remain intact, but you won't sync to the cloud.")) {
      await supabase.auth.signOut();
      showToast("Logged out successfully.", "info");
      renderSocial(container);
    }
  };

  // Initial tab render
  renderTabContent(viewport, 'feed', userProfile, container);
  updateRequestsBadgeCount(userProfile);
}

// --- UPDATE BADGE COUNT ---
async function updateRequestsBadgeCount(userProfile) {
  try {
    const { count, error } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userProfile.id)
      .eq('status', 'pending');

    if (error) throw error;

    const btn = document.querySelector('#pending-tab-btn');
    if (btn) {
      btn.innerHTML = count > 0 ? `Requests <span class="badge" style="background:var(--duo-blue); color:white; padding:2px 6px; border-radius:10px; font-size:10px; margin-left:4px;">${count}</span>` : 'Requests';
    }
  } catch (err) {
    console.error('Error fetching request badge count:', err);
  }
}

// --- RENDER TAB CONTENT ---
function renderTabContent(viewport, tab, userProfile, container) {
  viewport.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <span class="spinner" style="font-size: 24px; display: block; margin-bottom: 8px; animation: spin 1s linear infinite;">🔄</span>
      <p>Loading...</p>
    </div>
  `;

  if (tab === 'feed') {
    renderFeedTab(viewport, userProfile, container);
  } else if (tab === 'squad') {
    renderSquadTab(viewport, userProfile, container);
  } else if (tab === 'pending') {
    renderRequestsTab(viewport, userProfile, container);
  }
}

// --- TAB 1: FEED TAB ---
async function renderFeedTab(viewport, userProfile, container) {
  try {
    // 1. Fetch friend IDs
    const { data: f1 } = await supabase.from('friendships').select('user_id_2').eq('user_id_1', userProfile.id);
    const { data: f2 } = await supabase.from('friendships').select('user_id_1').eq('user_id_2', userProfile.id);
    
    const friendIds = [
      userProfile.id,
      ...(f1 || []).map(r => r.user_id_2),
      ...(f2 || []).map(r => r.user_id_1)
    ];

    // 2. Fetch posts from friends and self
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        text,
        mood,
        created_at,
        user_id,
        profiles!posts_user_id_fkey (
          username,
          display_name,
          avatar_mascot,
          equipped_badge
        )
      `)
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    viewport.innerHTML = `
      <!-- Sleek Inline Composer at Top -->
      <div class="social-top-composer" style="background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 16px; padding: 12px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
        <div style="font-size: 22px; background: var(--bg-hover); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span>🦉</span>
        </div>
        <input type="text" id="composer-text" placeholder="Share your accomplishments... 🚀" maxlength="200" style="flex:1; background:var(--bg-dark); border:1.5px solid var(--border-color); color:var(--text-color); border-radius:20px; padding:8px 14px; font-family:inherit; font-size:13px; outline:none;" />
        <button class="btn btn-primary btn-3d btn-sm" id="post-submit-btn" style="padding: 6px 14px; border-radius: 16px; font-size: 12px; margin: 0;">Post</button>
      </div>

      <!-- Feed List -->
      <div class="feed-posts-list" style="display:flex; flex-direction:column;">
        ${posts.length === 0 ? `
          <div style="text-align:center; padding:40px 20px; color:var(--text-hint);">
            <p>Your squad feed is empty. Post a check-in or add friends to see updates!</p>
          </div>
        ` : posts.map(p => {
          const isOwn = p.user_id === userProfile.id;
          const author = p.profiles;
          return `
            <div class="tw-post" data-post-id="${p.id}" style="padding: 16px 0; border-bottom: 1.5px solid var(--border-color); display: flex; gap: 12px;">
              <div class="social-avatar--clickable" data-username="${author.username}" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; flex-shrink:0;">
                <div style="font-size: 24px; background:var(--bg-dark); border:1.5px solid var(--border-color); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; position:relative;">
                  <span>${author.avatar_mascot === 'bear' ? '🐻' : author.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
                </div>
                ${author.equipped_badge ? `<span style="font-size:10px; margin-top:4px; opacity:0.8;">${author.equipped_badge.substring(0,2)}</span>` : ''}
              </div>
              <div style="flex:1; min-width: 0;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                  <div>
                    <span style="font-weight:700; font-size:14px; color:var(--text-color);">${author.display_name}</span>
                    <span style="color:var(--text-hint); font-size:12px; margin-left:6px;">@${author.username}</span>
                  </div>
                  <span style="color:var(--text-hint); font-size:11px;">${formatTimeAgo(p.created_at)}</span>
                </div>
                <p style="font-size:14px; margin:0 0 10px 0; line-height:1.5; color:var(--text-color); word-wrap: break-word;">${p.mood} ${p.text}</p>
                <div style="display:flex; gap:20px; align-items:center;">
                  <button class="post-like-btn" data-post-id="${p.id}" style="background:none; border:none; color:var(--text-hint); font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; padding:0;">
                    ❤️ React
                  </button>
                  <button class="post-comment-toggle" data-post-id="${p.id}" style="background:none; border:none; color:var(--text-hint); font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; padding:0;">
                    💬 Comment
                  </button>
                </div>
                
                <!-- Comment Box -->
                <div class="comment-section hidden" id="comments-${p.id}" style="margin-top:12px; background:var(--bg-dark); border-radius:12px; padding:12px;">
                  <div class="replies-list" id="replies-list-${p.id}" style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;"></div>
                  <div style="display:flex; gap:8px;">
                    <input type="text" class="comment-input" placeholder="Write a reply..." style="flex:1; font-size:12px; background:var(--bg-hover); border:1.5px solid var(--border-color); border-radius:18px; padding:6px 12px; color:var(--text-color); outline:none;" />
                    <button class="btn btn-secondary btn-3d btn-sm submit-comment-btn" data-post-id="${p.id}" style="padding:4px 12px; font-size:11px; border-radius:14px;">Reply</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind Post Submission
    const submitBtn = viewport.querySelector('#post-submit-btn');
    const inputField = viewport.querySelector('#composer-text');
    submitBtn.onclick = async () => {
      const text = inputField.value.trim();
      if (!text) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      try {
        const { error } = await supabase.from('posts').insert({
          user_id: userProfile.id,
          text,
          mood: '🎯' // default mood
        });
        if (error) throw error;
        showToast("Check-in posted! 🚀", "success");
        playSuccessSound();
        renderTabContent(viewport, 'feed', userProfile, container);
      } catch (err) {
        showToast(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post';
      }
    };

    // Bind Likes & Comments
    viewport.querySelectorAll('.post-like-btn').forEach(btn => {
      btn.onclick = () => {
        btn.textContent = '❤️ Liked!';
        btn.disabled = true;
        playSuccessSound();
      };
    });

    viewport.querySelectorAll('.post-comment-toggle').forEach(btn => {
      btn.onclick = async () => {
        const postId = btn.dataset.postId;
        const box = viewport.querySelector(`#comments-${postId}`);
        box.classList.toggle('hidden');
        if (!box.classList.contains('hidden')) {
          loadComments(postId, viewport.querySelector(`#replies-list-${postId}`));
        }
      };
    });

    viewport.querySelectorAll('.submit-comment-btn').forEach(btn => {
      btn.onclick = async () => {
        const postId = btn.dataset.postId;
        const input = btn.previousElementSibling;
        const commentText = input.value.trim();
        if (!commentText) return;

        btn.disabled = true;
        try {
          const { error } = await supabase.from('post_replies').insert({
            post_id: postId,
            user_id: userProfile.id,
            text: commentText
          });
          if (error) throw error;
          input.value = '';
          loadComments(postId, viewport.querySelector(`#replies-list-${postId}`));
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          btn.disabled = false;
        }
      };
    });

    // Bind Profile opens
    viewport.querySelectorAll('.social-avatar--clickable').forEach(av => {
      av.onclick = () => openProfileSheet(av.dataset.username, userProfile, container);
    });

  } catch (err) {
    showToast(err.message, "error");
  }
}

// --- LOAD COMMENTS ---
async function loadComments(postId, listContainer) {
  try {
    const { data: replies, error } = await supabase
      .from('post_replies')
      .select(`
        text,
        created_at,
        profiles (
          username,
          display_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    listContainer.innerHTML = replies.map(r => `
      <div style="font-size:11px; background:var(--bg-hover); padding:6px; border-radius:6px; line-height:1.3;">
        <span style="font-weight:700;">${r.profiles.display_name}</span>
        <span style="color:var(--text-hint); font-size:9px;"> @${r.profiles.username} · ${formatTimeAgo(r.created_at)}</span>
        <p style="margin:2px 0 0 0;">${r.text}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading comments:', err);
  }
}

// --- TAB 2: SQUAD TAB ---
async function renderSquadTab(viewport, userProfile, container) {
  viewport.innerHTML = `
    <!-- Search Bar -->
    <div class="card card-3d" style="padding:15px; margin-bottom:15px;">
      <div style="display:flex; gap:8px;">
        <input type="text" id="search-input" placeholder="Search users by @username..." class="social-modal-input" style="flex:1;" />
        <button class="btn btn-primary btn-3d btn-sm" id="search-btn">Search</button>
      </div>
      <div id="search-results-box" style="margin-top:10px; display:flex; flex-direction:column; gap:8px;"></div>
    </div>

    <!-- Squad Friends List -->
    <h3 style="font-family: var(--font-header); font-size: 15px; margin: 15px 0 10px;">🛡️ Your Active Squad</h3>
    <div id="squad-friends-list" style="display:flex; flex-direction:column; gap:10px;"></div>
  `;

  const searchInput = viewport.querySelector('#search-input');
  const searchBtn = viewport.querySelector('#search-btn');
  const resultsBox = viewport.querySelector('#search-results-box');
  const friendsList = viewport.querySelector('#squad-friends-list');

  // Load Squad friends
  const loadSquadFriends = async () => {
    try {
      const { data: f1 } = await supabase.from('friendships').select('user_id_2').eq('user_id_1', userProfile.id);
      const { data: f2 } = await supabase.from('friendships').select('user_id_1').eq('user_id_2', userProfile.id);
      const friendIds = [
        ...(f1 || []).map(r => r.user_id_2),
        ...(f2 || []).map(r => r.user_id_1)
      ];

      if (friendIds.length === 0) {
        friendsList.innerHTML = `<p style="text-align:center; color:var(--text-hint); font-size:12px; margin-top:20px;">No friends added yet. Use the search bar to find and add users!</p>`;
        return;
      }

      const { data: friends, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (error) throw error;

      friendsList.innerHTML = friends.map(f => `
        <div class="squad-row card-3d social-avatar--clickable" data-username="${f.username}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px; cursor:pointer;">
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="font-size:24px;">${f.avatar_mascot === 'bear' ? '🐻' : f.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
            <div>
              <div style="font-weight:700; font-size:13px;">${f.display_name}</div>
              <div style="font-size:11px; color:var(--text-hint);">@${f.username} · ${f.military_rank}</div>
            </div>
          </div>
          <span style="font-size:12px; font-weight:700; color:var(--duo-blue);">🔥 ${f.streak} days</span>
        </div>
      `).join('');

      viewport.querySelectorAll('.social-avatar--clickable').forEach(av => {
        av.onclick = () => openProfileSheet(av.dataset.username, userProfile, container);
      });

    } catch (err) {
      showToast(err.message, "error");
    }
  };

  loadSquadFriends();

  // Handle Search
  const triggerSearch = async () => {
    const q = searchInput.value.trim().toLowerCase().replace('@', '');
    if (!q) return;

    searchBtn.disabled = true;
    resultsBox.innerHTML = '<p style="font-size:11px; color:var(--text-hint);">Searching...</p>';

    try {
      const { data: matches, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${q}%`)
        .limit(5);

      if (error) throw error;

      if (matches.length === 0) {
        resultsBox.innerHTML = '<p style="font-size:11px; color:var(--text-hint);">No users found. 🔍</p>';
      } else {
        resultsBox.innerHTML = matches.map(m => {
          if (m.id === userProfile.id) return ''; // Skip self
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-hover); padding:8px 12px; border-radius:8px;">
              <div class="social-avatar--clickable" data-username="${m.username}" style="display:flex; gap:8px; align-items:center; cursor:pointer;">
                <span style="font-size:20px;">${m.avatar_mascot === 'bear' ? '🐻' : m.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
                <div>
                  <div style="font-size:12px; font-weight:700;">${m.display_name}</div>
                  <div style="font-size:10px; color:var(--text-hint);">@${m.username}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-3d btn-sm request-btn" data-user-id="${m.id}" style="padding:4px 8px; font-size:11px;">Add Friend 🤝</button>
            </div>
          `;
        }).join('');

        resultsBox.querySelectorAll('.social-avatar--clickable').forEach(av => {
          av.onclick = () => openProfileSheet(av.dataset.username, userProfile, container);
        });

        resultsBox.querySelectorAll('.request-btn').forEach(btn => {
          btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = 'Sending...';
            try {
              const { error: requestErr } = await supabase.from('friend_requests').insert({
                sender_id: userProfile.id,
                receiver_id: btn.dataset.userId,
                status: 'pending'
              });
              if (requestErr) throw requestErr;
              showToast("Friend request sent! ⏳", "success");
              btn.textContent = 'Requested ⏳';
            } catch (err) {
              showToast(err.message, "error");
              btn.disabled = false;
              btn.textContent = 'Add Friend 🤝';
            }
          };
        });
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      searchBtn.disabled = false;
    }
  };

  searchBtn.onclick = triggerSearch;
}

// --- TAB 3: REQUESTS TAB ---
async function renderRequestsTab(viewport, userProfile, container) {
  try {
    // Fetch Incoming Requests
    const { data: incoming, error: inErr } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        profiles!friend_requests_sender_id_fkey (
          username,
          display_name,
          avatar_mascot
        )
      `)
      .eq('receiver_id', userProfile.id)
      .eq('status', 'pending');

    if (inErr) throw inErr;

    // Fetch Outgoing Requests
    const { data: outgoing, error: outErr } = await supabase
      .from('friend_requests')
      .select(`
        id,
        profiles!friend_requests_receiver_id_fkey (
          username,
          display_name,
          avatar_mascot
        )
      `)
      .eq('sender_id', userProfile.id)
      .eq('status', 'pending');

    if (outErr) throw outErr;

    viewport.innerHTML = `
      <!-- Incoming Requests -->
      <h3 style="font-family: var(--font-header); font-size: 15px; margin: 0 0 10px;">📥 Incoming Requests</h3>
      <div id="incoming-box" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
        ${incoming.length === 0 
          ? `<p style="color:var(--text-hint); font-size:12px; text-align:center; padding:10px 0;">No pending incoming requests.</p>` 
          : incoming.map(req => `
            <div class="card card-3d" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px;">
              <div class="social-avatar--clickable" data-username="${req.profiles.username}" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
                <span style="font-size:24px;">${req.profiles.avatar_mascot === 'bear' ? '🐻' : req.profiles.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
                <div>
                  <div style="font-weight:700; font-size:13px;">${req.profiles.display_name}</div>
                  <div style="font-size:11px; color:var(--text-hint);">@${req.profiles.username}</div>
                </div>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary btn-3d btn-sm accept-btn" data-req-id="${req.id}" data-sender-id="${req.sender_id}" style="padding:4px 8px; font-size:11px;">Accept</button>
                <button class="btn btn-secondary btn-3d btn-sm decline-btn" data-req-id="${req.id}" style="padding:4px 8px; font-size:11px;">Ignore</button>
              </div>
            </div>
          `).join('')
        }
      </div>

      <!-- Outgoing Requests -->
      <h3 style="font-family: var(--font-header); font-size: 15px; margin: 0 0 10px;">📤 Sent Requests</h3>
      <div id="outgoing-box" style="display:flex; flex-direction:column; gap:10px;">
        ${outgoing.length === 0 
          ? `<p style="color:var(--text-hint); font-size:12px; text-align:center; padding:10px 0;">No sent requests pending.</p>` 
          : outgoing.map(req => `
            <div class="card card-3d" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px;">
              <div class="social-avatar--clickable" data-username="${req.profiles.username}" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
                <span style="font-size:24px;">${req.profiles.avatar_mascot === 'bear' ? '🐻' : req.profiles.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
                <div>
                  <div style="font-weight:700; font-size:13px;">${req.profiles.display_name}</div>
                  <div style="font-size:11px; color:var(--text-hint);">@${req.profiles.username}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-3d btn-sm cancel-req-btn" data-req-id="${req.id}" style="padding:4px 8px; font-size:11px;">Cancel</button>
            </div>
          `).join('')
        }
      </div>
    `;

    // Bind profile click throughs
    viewport.querySelectorAll('.social-avatar--clickable').forEach(av => {
      av.onclick = () => openProfileSheet(av.dataset.username, userProfile, container);
    });

    // Bind Accept/Decline/Cancel actions
    viewport.querySelectorAll('.accept-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        const reqId = btn.dataset.reqId;
        const senderId = btn.dataset.senderId;
        try {
          // 1. Accept request
          const { error: accErr } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', reqId);

          if (accErr) throw accErr;

          // 2. Add Friendship record (alphabetical order)
          const uid1 = senderId < userProfile.id ? senderId : userProfile.id;
          const uid2 = senderId < userProfile.id ? userProfile.id : senderId;

          const { error: friendErr } = await supabase
            .from('friendships')
            .insert({ user_id_1: uid1, user_id_2: uid2 });

          if (friendErr) throw friendErr;

          showToast("Squad request accepted! 🤝", "success");
          playUnlockSound();

          updateRequestsBadgeCount(userProfile);
          renderRequestsTab(viewport, userProfile, container);
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      };
    });

    viewport.querySelectorAll('.decline-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', btn.dataset.reqId);

          if (error) throw error;
          showToast("Request ignored.", "info");
          updateRequestsBadgeCount(userProfile);
          renderRequestsTab(viewport, userProfile, container);
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      };
    });

    viewport.querySelectorAll('.cancel-req-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', btn.dataset.reqId);

          if (error) throw error;
          showToast("Request cancelled.", "info");
          renderRequestsTab(viewport, userProfile, container);
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      };
    });

  } catch (err) {
    showToast(err.message, "error");
  }
}

// --- OPEN PROFILE SHEET (INSTAGRAM / STRAVA HYBRID STYLE) ---
async function openProfileSheet(targetUsername, userProfile, container) {
  const overlay = container.querySelector('#profile-sheet-overlay');
  const content = container.querySelector('#profile-sheet-content');
  const backdrop = container.querySelector('#profile-sheet-backdrop');

  content.innerHTML = '<p style="text-align:center; padding:30px;">Loading Profile Sheet...</p>';
  overlay.classList.remove('hidden');

  backdrop.onclick = () => overlay.classList.add('hidden');

  try {
    // 1. Fetch profile details
    const { data: targetProfile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', targetUsername)
      .maybeSingle();

    if (profErr) throw profErr;
    if (!targetProfile) throw new Error("User profile not found.");

    // 2. Fetch relationship status
    let relationState = 'none'; // 'none', 'friends', 'outgoing_pending', 'incoming_pending'
    let requestId = null;

    if (targetProfile.id !== userProfile.id) {
      // Check Friendship
      const uid1 = targetProfile.id < userProfile.id ? targetProfile.id : userProfile.id;
      const uid2 = targetProfile.id < userProfile.id ? userProfile.id : targetProfile.id;

      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id_1', uid1)
        .eq('user_id_2', uid2)
        .maybeSingle();

      if (friendship) {
        relationState = 'friends';
      } else {
        // Check requests
        const { data: req } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${userProfile.id})`)
          .eq('status', 'pending')
          .maybeSingle();

        if (req) {
          requestId = req.id;
          relationState = req.sender_id === userProfile.id ? 'outgoing_pending' : 'incoming_pending';
        }
      }
    }

    // 3. Fetch user accomplishments (posts)
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', targetProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Render Layout
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:15px; text-align:center;">
        
        <!-- Profile Header -->
        <div style="display:flex; align-items:center; gap:15px; text-align:left;">
          <div style="font-size: 50px; background:var(--bg-dark); border:2px solid var(--border-color); border-radius:50%; width:76px; height:76px; display:flex; align-items:center; justify-content:center;">
            <span>${targetProfile.avatar_mascot === 'bear' ? '🐻' : targetProfile.avatar_mascot === 'cat' ? '🐱' : '🦉'}</span>
          </div>
          <div style="flex:1;">
            <h3 style="font-family:var(--font-header); margin:0 0 2px 0; font-size:18px;">${targetProfile.display_name}</h3>
            <span style="color:var(--text-hint); font-size:12px; display:block;">@${targetProfile.username}</span>
            <span style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:6px; font-size:10px; padding:2px 6px; font-weight:700; margin-top:4px; display:inline-block;">🎖️ ${targetProfile.military_rank}</span>
          </div>
        </div>

        <!-- Stats Grid (Instagram / Strava style) -->
        <div style="display:flex; gap:8px; background:var(--bg-dark); border:2px solid var(--border-color); border-radius:10px; padding:12px; margin: 5px 0;">
          <div style="flex:1; border-right:1px solid var(--border-color);">
            <span style="font-size:16px; font-weight:800; color:var(--text-color); display:block;">🔥 ${targetProfile.streak}</span>
            <span style="font-size:10px; color:var(--text-hint);">Streak</span>
          </div>
          <div style="flex:1; border-right:1px solid var(--border-color);">
            <span style="font-size:16px; font-weight:800; color:var(--text-color); display:block;">👑 ${targetProfile.integrity_score}%</span>
            <span style="font-size:10px; color:var(--text-hint);">Integrity</span>
          </div>
          <div style="flex:1;">
            <span style="font-size:16px; font-weight:800; color:var(--text-color); display:block;">⭐ ${targetProfile.xp}</span>
            <span style="font-size:10px; color:var(--text-hint);">XP</span>
          </div>
        </div>

        <!-- Equipped Badge Banner -->
        ${targetProfile.equipped_badge ? `
          <div style="background:linear-gradient(to right, var(--bg-dark), var(--bg-hover)); border:1px solid var(--border-color); border-radius:8px; padding:8px 12px; text-align:left; display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🛡️</span>
            <div>
              <span style="font-size:11px; color:var(--text-hint); display:block; text-transform:uppercase; letter-spacing:0.5px;">Equipped Badge</span>
              <strong style="font-size:12px; color:var(--text-color);">${targetProfile.equipped_badge}</strong>
            </div>
          </div>
        ` : ''}

        <!-- Dynamic Action Button -->
        <div id="profile-sheet-actions">
          ${targetProfile.id === userProfile.id ? `
            <button class="btn btn-secondary btn-3d btn-full btn-sm" disabled style="opacity: 0.6;">This is You</button>
          ` : relationState === 'friends' ? `
            <button class="btn btn-secondary btn-3d btn-full btn-sm" id="remove-friend-btn">Friends ✅ (Remove)</button>
          ` : relationState === 'outgoing_pending' ? `
            <button class="btn btn-secondary btn-3d btn-full btn-sm" disabled style="opacity:0.7;">Request Pending ⏳</button>
          ` : relationState === 'incoming_pending' ? `
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary btn-3d btn-full btn-sm" id="accept-req-btn">Accept Request</button>
              <button class="btn btn-secondary btn-3d btn-full btn-sm" id="decline-req-btn">Ignore</button>
            </div>
          ` : `
            <button class="btn btn-primary btn-3d btn-full btn-sm" id="add-friend-btn">Add Friend 🤝</button>
          `}
        </div>

        <!-- Recent Check-ins -->
        <div style="text-align:left; margin-top:10px;">
          <h4 style="font-family:var(--font-header); font-size:13px; margin:0 0 8px 0; color:var(--text-hint);">Recent Check-ins</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${!posts || posts.length === 0 ? `
              <p style="font-size:11px; color:var(--text-hint); text-align:center;">No recent check-ins.</p>
            ` : posts.map(p => `
              <div style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:6px; padding:8px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                  <span>${p.mood}</span>
                  <span style="font-size:10px; color:var(--text-hint);">${formatTimeAgo(p.created_at)}</span>
                </div>
                <p style="margin:0;">${p.text}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Bind action button actions
    const actArea = content.querySelector('#profile-sheet-actions');
    
    // Add Friend
    const addBtn = actArea.querySelector('#add-friend-btn');
    if (addBtn) {
      addBtn.onclick = async () => {
        addBtn.disabled = true;
        try {
          const { error } = await supabase.from('friend_requests').insert({
            sender_id: userProfile.id,
            receiver_id: targetProfile.id,
            status: 'pending'
          });
          if (error) throw error;
          showToast("Friend request sent! ⏳", "success");
          overlay.classList.add('hidden');
        } catch (err) {
          showToast(err.message, "error");
          addBtn.disabled = false;
        }
      };
    }

    // Accept Request
    const acceptBtn = actArea.querySelector('#accept-req-btn');
    if (acceptBtn) {
      acceptBtn.onclick = async () => {
        acceptBtn.disabled = true;
        try {
          await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
          const uid1 = targetProfile.id < userProfile.id ? targetProfile.id : userProfile.id;
          const uid2 = targetProfile.id < userProfile.id ? userProfile.id : targetProfile.id;
          await supabase.from('friendships').insert({ user_id_1: uid1, user_id_2: uid2 });
          showToast("Friend request accepted!", "success");
          playUnlockSound();
          overlay.classList.add('hidden');
          // Re-render feed
          const viewport = container.querySelector('#social-viewport');
          if (viewport) renderFeedTab(viewport, userProfile, container);
        } catch (err) {
          showToast(err.message, "error");
          acceptBtn.disabled = false;
        }
      };
    }

    // Decline Request
    const declineBtn = actArea.querySelector('#decline-req-btn');
    if (declineBtn) {
      declineBtn.onclick = async () => {
        declineBtn.disabled = true;
        try {
          await supabase.from('friend_requests').delete().eq('id', requestId);
          showToast("Request ignored.", "info");
          overlay.classList.add('hidden');
        } catch (err) {
          showToast(err.message, "error");
          declineBtn.disabled = false;
        }
      };
    }

    // Remove Friend
    const removeBtn = actArea.querySelector('#remove-friend-btn');
    if (removeBtn) {
      removeBtn.onclick = async () => {
        if (confirm(`Are you sure you want to remove @${targetProfile.username} from your squad?`)) {
          removeBtn.disabled = true;
          try {
            const uid1 = targetProfile.id < userProfile.id ? targetProfile.id : userProfile.id;
            const uid2 = targetProfile.id < userProfile.id ? userProfile.id : targetProfile.id;
            
            await supabase.from('friendships').delete().eq('user_id_1', uid1).eq('user_id_2', uid2);
            await supabase.from('friend_requests').delete().or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${userProfile.id})`);
            
            showToast("Friend removed.", "info");
            overlay.classList.add('hidden');
            // Re-render squad
            const viewport = container.querySelector('#social-viewport');
            if (viewport) {
              const activeTabBtn = container.querySelector('.social-tab-btn.active');
              const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'feed';
              renderTabContent(viewport, activeTab, userProfile, container);
            }
          } catch (err) {
            showToast(err.message, "error");
            removeBtn.disabled = false;
          }
        }
      };
    }

  } catch (err) {
    content.innerHTML = `<p style="color:var(--duo-red); text-align:center; padding:20px;">Error: ${err.message}</p>`;
  }
}
