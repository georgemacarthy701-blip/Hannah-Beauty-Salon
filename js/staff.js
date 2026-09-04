/**
 * HANNAH BEAUTY SALON OMS — STAFF & STYLIST PORTAL MODULE
 * Dedicated daily stylist schedule, one-tap appointment lifecycle updates, and consumable product usage deduction.
 */

import { db } from './supabaseClient.js';
import { auth, showToast } from './auth.js';
import { SALON_CONFIG, formatCurrency } from './config.js';

let currentStaffUser = null;
let currentStylistRecord = null;
let selectedDate = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard route for staff / admin
  currentStaffUser = await auth.requireRole(['staff', 'admin']);
  if (!currentStaffUser) return;

  // Uncloak protected view
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';

  // Set Profile info in portal
  const staffNameEl = document.getElementById('staff-portal-name');
  const staffRoleEl = document.getElementById('staff-portal-role');
  if (staffNameEl) staffNameEl.textContent = currentStaffUser.full_name;
  if (staffRoleEl) staffRoleEl.textContent = currentStaffUser.role === 'admin' ? 'Master Stylist (Admin)' : 'Salon Stylist';

  // Set Date Input
  const dateInput = document.getElementById('staff-schedule-date');
  if (dateInput) {
    dateInput.value = selectedDate;
    dateInput.addEventListener('change', (e) => {
      selectedDate = e.target.value;
      loadStaffSchedule();
    });
  }

  // Logout button
  document.getElementById('staff-logout-btn')?.addEventListener('click', () => auth.signOut());

  // Match stylist record
  await resolveStylistProfile();
  await Promise.all([
    loadStaffSchedule(),
    loadConsumablesDeductionList()
  ]);
});

/**
 * Identify the linked stylist record
 */
async function resolveStylistProfile() {
  try {
    const allStaff = await db.getStaff(false);
    // Try matching by name or user_id
    currentStylistRecord = allStaff.find(s =>
      (s.user_id && s.user_id === currentStaffUser.id) ||
      s.full_name.toLowerCase().includes(currentStaffUser.full_name.toLowerCase()) ||
      currentStaffUser.full_name.toLowerCase().includes(s.full_name.toLowerCase())
    ) || allStaff[0]; // fallback to first staff for preview
  } catch (err) {
    console.error('Stylist profile error:', err);
  }
}

/**
 * Load stylist's personal schedule for the selected date
 */
async function loadStaffSchedule() {
  const scheduleContainer = document.getElementById('staff-appointments-list');
  if (!scheduleContainer) return;

  scheduleContainer.innerHTML = '<div class="text-center" style="padding: 2rem;">Loading your daily schedule...</div>';

  try {
    // If admin, they can optionally view their own or all
    const filter = { date: selectedDate };
    if (currentStylistRecord) {
      filter.staff_id = currentStylistRecord.id;
    }

    const appointments = await db.getAppointments(filter);

    // Update KPI indicators
    const countTotal = appointments.length;
    const countCompleted = appointments.filter(a => a.status === 'completed').length;
    const countPending = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

    const totalEl = document.getElementById('stylist-kpi-total');
    const compEl = document.getElementById('stylist-kpi-completed');
    const pendEl = document.getElementById('stylist-kpi-pending');

    if (totalEl) totalEl.textContent = countTotal;
    if (compEl) compEl.textContent = countCompleted;
    if (pendEl) pendEl.textContent = countPending;

    if (appointments.length === 0) {
      scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No appointments assigned today</div>
          <p class="text-sm">Enjoy your prep time or check walk-in registrations.</p>
        </div>
      `;
      return;
    }

    scheduleContainer.innerHTML = '';

    appointments.forEach(apt => {
      const card = document.createElement('div');
      card.className = `card stylist-apt-card ${apt.status}`;
      card.style.marginBottom = '1rem';
      card.style.borderLeft = `4px solid ${getStatusColor(apt.status)}`;

      const start = apt.start_time.substring(0, 5);
      const end = apt.end_time.substring(0, 5);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span style="font-size: 1.15rem; font-weight: 700; color: var(--dark);">${start} - ${end}</span>
            <span class="badge badge-${apt.status}" style="margin-left: 0.5rem;">${apt.status.replace('_', ' ')}</span>
            <span class="badge badge-confirmed" style="font-size: 0.7rem; margin-left: 0.25rem;">
              ${apt.origin === 'walk_in' ? '🚶 Walk-In' : '🌐 Online'}
            </span>
          </div>
          <strong style="color: var(--primary); font-size: 1.1rem;">
            ${formatCurrency(apt.service?.price || 0)}
          </strong>
        </div>

        <div style="margin-bottom: 1rem;">
          <h4 class="font-serif" style="font-size: 1.3rem; margin-bottom: 0.25rem;">${apt.service?.name || 'Custom Service'}</h4>
          <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.25rem;">
            <strong>Client:</strong> ${apt.client_name} &nbsp;•&nbsp; 📞 <a href="tel:${apt.client_phone}">${apt.client_phone}</a>
          </p>
          ${apt.notes ? `<p class="text-sm text-muted" style="background: var(--bg-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">📝 Note: ${apt.notes}</p>` : ''}
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          ${apt.status === 'pending' ? `
            <button class="btn btn-sm btn-outline status-action-btn" data-status="confirmed">Accept / Confirm</button>
          ` : ''}

          ${apt.status === 'confirmed' ? `
            <button class="btn btn-sm btn-primary status-action-btn" data-status="in_progress">▶ Start Service</button>
          ` : ''}

          ${apt.status === 'in_progress' ? `
            <button class="btn btn-sm btn-primary status-action-btn" data-status="completed" style="background: #10b981;">✓ Complete Service</button>
          ` : ''}

          ${apt.status !== 'completed' && apt.status !== 'cancelled' ? `
            <button class="btn btn-sm btn-secondary status-action-btn" data-status="cancelled" style="color: #ef4444;">Cancel</button>
          ` : ''}
        </div>
      `;

      // Status button events
      card.querySelectorAll('.status-action-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const nextStatus = btn.dataset.status;
          try {
            await db.updateAppointmentStatus(apt.id, nextStatus);
            showToast('Schedule Updated', `Appointment moved to ${nextStatus.replace('_', ' ')}.`, 'success');
            loadStaffSchedule();
          } catch (err) {
            showToast('Error', err.message, 'error');
          }
        });
      });

      scheduleContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Staff schedule error:', err);
    scheduleContainer.innerHTML = '<div class="text-danger text-center">Failed to load schedule.</div>';
  }
}

/**
 * Consumables Usage Quick Deduction
 */
async function loadConsumablesDeductionList() {
  const container = document.getElementById('staff-consumables-quick-list');
  if (!container) return;

  try {
    const inventory = await db.getInventory();
    container.innerHTML = '';

    inventory.forEach(item => {
      const isLow = item.current_stock <= item.minimum_threshold;
      const row = document.createElement('div');
      row.className = 'card';
      row.style.padding = '0.75rem 1rem';
      row.style.marginBottom = '0.5rem';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';

      row.innerHTML = `
        <div>
          <strong style="font-size: 0.9rem; color: var(--dark);">${item.item_name}</strong>
          <div class="text-sm ${isLow ? 'text-danger font-semibold' : 'text-muted'}">
            Stock: ${item.current_stock} ${item.unit} ${isLow ? '(Low Stock!)' : ''}
          </div>
        </div>
        <button class="btn btn-sm btn-secondary deduct-usage-btn" data-id="${item.id}" data-name="${item.item_name}">
          -1 Use
        </button>
      `;

      row.querySelector('.deduct-usage-btn')?.addEventListener('click', async () => {
        try {
          await db.adjustInventoryStock(item.id, -1);
          showToast('Product Used', `Recorded 1 unit consumption of ${item.item_name}.`, 'info');
          loadConsumablesDeductionList();
        } catch (err) {
          showToast('Error', err.message, 'error');
        }
      });

      container.appendChild(row);
    });
  } catch (err) {
    console.error('Consumables loading error:', err);
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'var(--status-pending-text)';
    case 'confirmed': return 'var(--status-confirmed-text)';
    case 'in_progress': return 'var(--status-in-progress-text)';
    case 'completed': return 'var(--status-completed-text)';
    case 'cancelled': return 'var(--status-cancelled-text)';
    default: return 'var(--border-subtle)';
  }
}
