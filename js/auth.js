/**
 * HANNAH BEAUTY SALON OMS — AUTHENTICATION & ACCESS CONTROL MODULE
 * Exclusively handles Staff & Administrator authentication and route protection.
 */

import { supabase } from './supabaseClient.js';

export const auth = {
  /**
   * Retrieves currently authenticated staff/admin session user and role from Supabase
   */
  async getCurrentUser() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('[Auth] No profile record found in public.profiles for user:', user.id);
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        phone: user.user_metadata?.phone || null,
        role: user.user_metadata?.role || null
      };
    }

    return {
      id: user.id,
      email: user.email,
      full_name: profile.full_name || user.email.split('@')[0],
      phone: profile.phone,
      role: profile.role,
      avatar_url: profile.avatar_url
    };
  },

  /**
   * Sign In exclusively for Staff & Admin personnel
   */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both your email and password.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      console.error('[Auth] Supabase login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password.');
      }
      throw new Error(error.message || 'Invalid email or password.');
    }

    if (!authData?.user) {
      throw new Error('Authentication failed. No user session returned.');
    }

    // 2. Query role from public.profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone')
      .eq('id', authData.user.id)
      .single();

    const role = profile?.role || authData.user.user_metadata?.role;

    console.log('[Auth] User verified:', {
      userId: authData.user.id,
      email: authData.user.email,
      role: role
    });

    // 3. Enforce Staff/Admin privilege
    if (role !== 'admin' && role !== 'staff') {
      await supabase.auth.signOut();
      throw new Error('Access denied. Authorized personnel only.');
    }

    return {
      id: authData.user.id,
      email: authData.user.email,
      full_name: profile?.full_name || authData.user.email.split('@')[0],
      role: role,
      phone: profile?.phone
    };
  },

  /**
   * Terminate session and return to login
   */
  async signOut() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  },

  /**
   * Route Guard: Restricts dashboard pages to authenticated staff/admin
   */
  async requireRole(allowedRoles = ['admin', 'staff']) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      const currentPath = window.location.pathname;
      window.location.replace(`login.html?redirect=${encodeURIComponent(currentPath)}`);
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, avatar_url')
      .eq('id', user.id)
      .single();

    const resolvedRole = profile?.role || user.user_metadata?.role;

    if (!resolvedRole || !allowedRoles.includes(resolvedRole)) {
      console.warn(`[Auth Guard] Unauthorized role "${resolvedRole}" for route.`);
      await supabase.auth.signOut();
      window.location.replace('login.html?error=unauthorized');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      phone: profile?.phone || user.user_metadata?.phone,
      role: resolvedRole,
      avatar_url: profile?.avatar_url
    };
  }
};

/**
 * Toast Notification Utility
 */
export function showToast(title, message = '', type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="flex: 1;">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Auto-populate auth actions in navigation bar for authenticated staff
document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.getCurrentUser();
  const navAuthSlot = document.getElementById('nav-auth-slot');
  if (navAuthSlot) {
    if (user && (user.role === 'admin' || user.role === 'staff')) {
      const portalLink = (user.role === 'admin') ? 'admin-dashboard.html' : 'staff-portal.html';
      navAuthSlot.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="${portalLink}" class="btn btn-sm btn-outline">
            <span>👤 ${user.full_name.split(' ')[0]}</span>
            <span class="badge badge-${user.role === 'admin' ? 'confirmed' : 'pending'}" style="margin-left: 4px; font-size: 0.65rem;">${user.role}</span>
          </a>
          <button id="nav-logout-btn" class="btn btn-sm btn-secondary" title="Sign Out">Log Out</button>
        </div>
      `;
      document.getElementById('nav-logout-btn')?.addEventListener('click', () => auth.signOut());
    } else {
      navAuthSlot.innerHTML = `
        <a href="book.html" class="btn btn-sm btn-primary">Book Now</a>
      `;
    }
  }
});
