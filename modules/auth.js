// modules/auth.js
// Centralized Authentication Screen for Odyssey

import { supabase } from './supabase.js';
import { getProfile, saveProfile } from './storage.js';
import { showToast } from './notifications.js';

export function renderAuthScreen(container, onAuthSuccess) {
  container.innerHTML = `
    <div class="social-auth-card card-3d animate-pop" style="max-width: 380px; margin: 60px auto; padding: 25px;">
      <h2 style="font-family: var(--font-header); text-align: center; margin-bottom: 6px;">👥 Odyssey Squad</h2>
      <p class="hint" style="text-align: center; margin-bottom: 20px;">Connect with friends, track streaks, and build habits together.</p>
      
      <div class="auth-tabs" style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 20px;">
        <button class="auth-tab-btn active" id="tab-login" style="flex: 1; padding: 10px; background: none; border: none; font-weight: 700; color: var(--text-color); cursor: pointer;">Log In</button>
        <button class="auth-tab-btn" id="tab-signup" style="flex: 1; padding: 10px; background: none; border: none; font-weight: 700; color: var(--text-hint); cursor: pointer;">Sign Up</button>
      </div>

      <form id="auth-form" style="display: flex; flex-direction: column; gap: 12px;">
        <div id="signup-fields" class="hidden" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="text" id="auth-name" class="social-modal-input" placeholder="Your Display Name" style="width: 100%;" />
        </div>
        <div style="position: relative; display: flex; align-items: center;" id="username-field-wrapper">
          <span style="position: absolute; left: 12px; font-weight: 700; color: var(--text-hint);">@</span>
          <input type="text" id="auth-username" class="social-modal-input" placeholder="username" required maxlength="15" style="width: 100%; padding-left: 28px;" autocomplete="off" />
        </div>
        <input type="password" id="auth-password" class="social-modal-input" placeholder="Password (min 6 characters)" required style="width: 100%;" />
        
        <button type="submit" class="btn btn-primary btn-3d btn-full" id="auth-submit-btn" style="margin-top: 10px;">Log In 🚀</button>
      </form>
    </div>
  `;

  const tabLogin = container.querySelector('#tab-login');
  const tabSignup = container.querySelector('#tab-signup');
  const signupFields = container.querySelector('#signup-fields');
  const authSubmitBtn = container.querySelector('#auth-submit-btn');
  const authForm = container.querySelector('#auth-form');
  const usernameInput = container.querySelector('#auth-username');
  let isSignUp = false;

  usernameInput.oninput = () => {
    usernameInput.value = usernameInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  tabLogin.onclick = () => {
    isSignUp = false;
    tabLogin.classList.add('active');
    tabLogin.style.color = 'var(--text-color)';
    tabSignup.classList.remove('active');
    tabSignup.style.color = 'var(--text-hint)';
    signupFields.classList.add('hidden');
    authSubmitBtn.textContent = 'Log In 🚀';
    usernameInput.placeholder = 'username';
  };

  tabSignup.onclick = () => {
    isSignUp = true;
    tabSignup.classList.add('active');
    tabSignup.style.color = 'var(--text-color)';
    tabLogin.classList.remove('active');
    tabLogin.style.color = 'var(--text-hint)';
    signupFields.classList.remove('hidden');
    authSubmitBtn.textContent = 'Sign Up 🎉';
    usernameInput.placeholder = 'unique_username';
  };

  authForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim().toLowerCase();
    const password = container.querySelector('#auth-password').value;

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Processing...';

    // Derive a unique email format for the Auth backend
    const derivedEmail = `${username}@odyssey.internal`;

    try {
      if (isSignUp) {
        const name = container.querySelector('#auth-name').value.trim();

        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }

        // Check availability in profiles table
        const { data: taken, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (checkError) throw checkError;
        if (taken) {
          throw new Error("Username already taken! ❌");
        }

        const { error } = await supabase.auth.signUp({
          email: derivedEmail,
          password,
          options: { data: { name: name || 'New Player', username } }
        });
        if (error) throw error;
        
        // Sync profile table immediately (if automatically signed in)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              username,
              display_name: name || 'New Player',
              email: derivedEmail
            });
          if (upsertError) throw upsertError;
        }

        showToast("Registration successful! 🎉", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: derivedEmail, 
          password 
        });
        if (error) throw error;
        showToast("Welcome back!", "success");
      }
      
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      showToast(err.message, "error");
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isSignUp ? 'Sign Up 🎉' : 'Log In 🚀';
    }
  };
}
