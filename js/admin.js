/**
 * HANNAH BEAUTY SALON OMS — OPERATIONS MANAGEMENT PORTAL (ADMIN)
 * Daily Agenda, Walk-In Registration, Service Catalog CRUD, Consumable Inventory, and Daily Revenue Reconciliation.
 */

import { supabase, db } from './supabaseClient.js';
import { auth, showToast } from './auth.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SALON_CONFIG, formatCurrency } from './config.js';

let currentAdminUser = null;
let activeServices = [];
let staffMembers = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard Route
  currentAdminUser = await auth.requireRole(['admin']);
  if (!currentAdminUser) return;

  // Uncloak protected view
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';

  // Set Profile display
  const adminNameEl = document.getElementById('admin-user-name');
  const adminRoleEl = document.getElementById('admin-user-role');
  if (adminNameEl) adminNameEl.textContent = currentAdminUser.full_name;
  if (adminRoleEl) adminRoleEl.textContent = 'Salon Administrator';

  // Logout button
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => auth.signOut());

  // Set billing default date (keep agenda date open by default to display all bookings)
  const todayStr = new Date().toISOString().split('T')[0];
  const billingDateInp = document.getElementById('billing-date-filter');
  if (billingDateInp) billingDateInp.value = todayStr;

  // Initialize tabs & listeners
  setupNavigationTabs();
  setupModals();
  await refreshAllData();
});

/**
 * Tab Navigation Routing
 */
function setupNavigationTabs() {
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      if (!targetTab) return;

      navItems.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(`tab-${targetTab}`);
      if (activeContent) activeContent.classList.add('active');

      const titleEl = document.getElementById('dashboard-view-title');
      if (titleEl) titleEl.textContent = btn.innerText.trim();
    });
  });
}

/**
 * Master Data Refresher
 */
async function refreshAllData() {
  try {
    const [services, staff] = await Promise.all([
      db.getServices(false),
      db.getStaff(false)
    ]);

    activeServices = services;
    staffMembers = staff;

    populateSelectDropdowns();
    await Promise.all([
      loadDashboardKPIs(),
      loadAgenda(),
      loadServicesTable(),
      loadStaffTable(),
      loadInventoryTable(),
      loadBillingReconciliation()
    ]);
  } catch (err) {
    console.error('Error refreshing admin portal data:', err);
    showToast('Sync Error', 'Failed to synchronize salon records.', 'error');
  }
}

/**
 * Dropdown options populator
 */
function populateSelectDropdowns() {
  const staffSelects = [
    document.getElementById('agenda-staff-filter'),
    document.getElementById('walkin-staff-select')
  ];

  staffSelects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    const isFilter = sel.id.includes('filter');
    sel.innerHTML = isFilter ? '<option value="">All Stylists</option>' : '<option value="">Select Stylist...</option>';
    staffMembers.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.id;
      opt.textContent = `${st.full_name} (${st.role_title})`;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  });

  const serviceSelect = document.getElementById('walkin-service-select');
  if (serviceSelect) {
    serviceSelect.innerHTML = '<option value="">Select Service...</option>';
    activeServices.filter(s => s.is_active).forEach(srv => {
      const opt = document.createElement('option');
      opt.value = srv.id;
      opt.textContent = `${srv.name} (${srv.duration_minutes}m - ${formatCurrency(srv.price)})`;
      serviceSelect.appendChild(opt);
    });
  }
}

/**
 * KPI Cards Calculation
 */
async function loadDashboardKPIs() {
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const [todayApts, inventory, todayTxs] = await Promise.all([
      db.getAppointments({ date: todayStr }),
      db.getInventory(),
      db.getTransactions(todayStr)
    ]);

    // 1. Today's Bookings
    const kpiBookings = document.getElementById('kpi-today-bookings');
    if (kpiBookings) kpiBookings.textContent = todayApts.length;

    // 2. Stylists on duty
    const kpiStaff = document.getElementById('kpi-active-staff');
    if (kpiStaff) kpiStaff.textContent = staffMembers.filter(s => s.is_active).length;

    // 3. Low stock alerts
    const lowStockCount = inventory.filter(item => item.current_stock <= item.minimum_threshold).length;
    const kpiLowStock = document.getElementById('kpi-low-stock');
    if (kpiLowStock) {
      kpiLowStock.textContent = lowStockCount;
      const card = kpiLowStock.closest('.metric-card');
      if (lowStockCount > 0) card?.classList.add('warning-card');
      else card?.classList.remove('warning-card');
    }

    // 4. Today's Revenue
    const totalRev = todayTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const kpiRevenue = document.getElementById('kpi-today-revenue');
    if (kpiRevenue) kpiRevenue.textContent = formatCurrency(totalRev);
  } catch (err) {
    console.error('KPI calculation error:', err);
  }
}

/**
 * Daily Agenda & Schedule Management
 */
async function loadAgenda() {
  const tableBody = document.getElementById('agenda-table-body');
  if (!tableBody) return;

  const dateFilter = document.getElementById('agenda-date-filter')?.value;
  const staffFilter = document.getElementById('agenda-staff-filter')?.value;
  const statusFilter = document.getElementById('agenda-status-filter')?.value;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem;">Loading bookings...</td></tr>';

  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFilter) {
      query = query.eq('appointment_date', dateFilter);
    }
    if (staffFilter) {
      query = query.eq('staff_id', staffFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    console.log('Fetched appointments:', data, 'Error:', error);

    if (error) {
      console.error('Agenda loading error from Supabase:', error);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Failed to load bookings: ${error.message}</td></tr>`;
      return;
    }

    const appointments = data || [];

    if (appointments.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">📅</div>
              <div class="empty-state-title">No appointments found</div>
              <p class="text-sm">There are no bookings matching the current filters.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    appointments.forEach(apt => {
      // Find service and stylist details from local catalog
      const service = activeServices.find(s => s.id === apt.service_id) || apt.service || {};
      const staff = staffMembers.find(st => st.id === apt.staff_id) || apt.staff || {};

      const tr = document.createElement('tr');
      const startFmt = (apt.start_time || '09:00:00').substring(0, 5);
      const endFmt = (apt.end_time || '10:00:00').substring(0, 5);
      const isWalkIn = (apt.origin === 'walk_in');

      tr.innerHTML = `
        <td>
          <strong>${startFmt} - ${endFmt}</strong>
          <div class="text-sm text-muted">${apt.appointment_date || 'N/A'}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--dark);">${apt.client_name || 'Guest Client'}</div>
          <div class="text-sm text-muted">${apt.client_phone || 'N/A'}</div>
        </td>
        <td>
          <div>${service.name || 'Salon Treatment'}</div>
          <div class="text-sm text-muted">${service.duration_minutes || 45} mins • ${formatCurrency(service.price || 0)}</div>
        </td>
        <td>
          <strong>${staff.full_name || 'Unassigned / Any'}</strong>
        </td>
        <td>
          <span class="badge ${isWalkIn ? 'badge-confirmed' : 'badge-pending'}" style="font-size: 0.7rem;">
            ${isWalkIn ? '🚶 Walk-In' : '🌐 Online'}
          </span>
        </td>
        <td>
          <select class="status-select ${apt.status || 'pending'}" data-id="${apt.id}">
            <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="in_progress" ${apt.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="table-actions">
            ${apt.status !== 'completed' && apt.status !== 'cancelled' ? `
              <button class="btn btn-sm btn-primary pay-btn" data-id="${apt.id}" data-price="${service.price || 0}" data-client="${apt.client_name || ''}" data-service="${service.name || ''}">
                💳 Pay
              </button>
            ` : ''}
          </div>
        </td>
      `;

      // Status change listener
      const statusSelect = tr.querySelector('.status-select');
      statusSelect?.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        try {
          await db.updateAppointmentStatus(apt.id, newStatus);
          statusSelect.className = `status-select ${newStatus}`;
          showToast('Status Updated', `Appointment marked as ${newStatus}.`, 'success');
          loadDashboardKPIs();
        } catch (err) {
          showToast('Update Failed', err.message, 'error');
        }
      });

      // Payment Trigger
      const payBtn = tr.querySelector('.pay-btn');
      payBtn?.addEventListener('click', () => {
        openPaymentModal({ ...apt, service, staff });
      });

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Agenda loading error:', err);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Failed to load agenda: ${err.message}</td></tr>`;
  }
}

/**
 * Service Catalog Management
 */
async function loadServicesTable() {
  const tableBody = document.getElementById('services-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  activeServices.forEach(srv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight: 600; color: var(--dark);">${srv.name}</div>
        <div class="text-sm text-muted">${srv.description || ''}</div>
      </td>
      <td><span class="badge badge-confirmed">${srv.category || 'General'}</span></td>
      <td>${srv.duration_minutes} Minutes</td>
      <td><strong>${formatCurrency(srv.price)}</strong></td>
      <td>
        <span class="badge ${srv.is_active ? 'badge-completed' : 'badge-cancelled'}">
          ${srv.is_active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline edit-service-btn" data-id="${srv.id}">
            Edit
          </button>
          <button class="btn btn-sm btn-secondary toggle-service-btn" data-id="${srv.id}" data-active="${srv.is_active}">
            ${srv.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-sm btn-secondary delete-service-btn" data-id="${srv.id}" data-name="${srv.name}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" title="Delete Service">
            Delete
          </button>
        </div>
      </td>
    `;

    // 1. Edit Service Modal Trigger
    tr.querySelector('.edit-service-btn')?.addEventListener('click', () => {
      openEditServiceModal(srv);
    });

    // 2. Toggle Active / Inactive Status
    tr.querySelector('.toggle-service-btn')?.addEventListener('click', async () => {
      try {
        await db.updateService(srv.id, { is_active: !srv.is_active });
        showToast('Service Updated', `Service "${srv.name}" is now ${!srv.is_active ? 'Active' : 'Deactivated'}.`, 'success');
        refreshAllData();
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    });

    // 3. Delete Service with Foreign Key Constraint Guard
    tr.querySelector('.delete-service-btn')?.addEventListener('click', async () => {
      const confirmed = confirm(`Are you sure you want to delete "${srv.name}"? This cannot be undone.`);
      if (!confirmed) return;

      try {
        await db.deleteService(srv.id);
        showToast('Service Deleted', `"${srv.name}" has been permanently removed.`, 'info');
        refreshAllData();
      } catch (err) {
        console.error('Delete service error:', err);
        const errMsg = (err.message || '').toLowerCase();
        if (err.code === '23503' || errMsg.includes('foreign key') || errMsg.includes('violates foreign key') || errMsg.includes('appointments')) {
          alert('Cannot delete this service because existing appointments are attached to it. Deactivate it instead to hide it from future bookings.');
        } else {
          showToast('Delete Failed', err.message || 'Could not delete service.', 'error');
        }
      }
    });

    tableBody.appendChild(tr);
  });
}

/**
 * Stylist & Staff Roster Management
 */
async function loadStaffTable() {
  const tableBody = document.getElementById('staff-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  if (staffMembers.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No stylists registered in database yet.</td></tr>';
    return;
  }

  staffMembers.forEach(st => {
    const initials = (st.full_name || 'Staff')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const shiftStart = st.shift_start ? st.shift_start.substring(0, 5) : '09:00';
    const shiftEnd = st.shift_end ? st.shift_end.substring(0, 5) : '18:00';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-light); color: var(--accent-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
            ${initials}
          </div>
          <div>
            <div style="font-weight: 600; color: var(--dark);">${st.full_name}</div>
            <div class="text-sm text-muted">Staff ID: #${st.id.substring(0, 8)}</div>
          </div>
        </div>
      </td>
      <td>
        <strong style="color: var(--primary); font-size: 0.95rem;">${st.role_title || 'Stylist'}</strong>
      </td>
      <td>
        <span class="text-sm font-semibold">🕒 ${shiftStart} – ${shiftEnd}</span>
      </td>
      <td>
        <span class="badge ${st.is_active ? 'badge-completed' : 'badge-cancelled'}">
          ${st.is_active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline edit-staff-btn" data-id="${st.id}">
            Edit
          </button>
          <button class="btn btn-sm btn-secondary toggle-staff-btn" data-id="${st.id}" data-active="${st.is_active}">
            ${st.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-sm btn-secondary delete-staff-btn" data-id="${st.id}" data-name="${st.full_name}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" title="Delete Stylist">
            Delete
          </button>
        </div>
      </td>
    `;

    // 1. Edit Stylist Trigger
    tr.querySelector('.edit-staff-btn')?.addEventListener('click', () => {
      openStylistModal(st);
    });

    // 2. Toggle Status Trigger
    tr.querySelector('.toggle-staff-btn')?.addEventListener('click', async () => {
      try {
        await db.updateStaff(st.id, { is_active: !st.is_active });
        showToast('Stylist Updated', `Stylist "${st.full_name}" is now ${!st.is_active ? 'Active' : 'Deactivated'}.`, 'success');
        refreshAllData();
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    });

    // 3. Delete Stylist Trigger with Foreign Key Safety
    tr.querySelector('.delete-staff-btn')?.addEventListener('click', async () => {
      const confirmed = confirm(`Are you sure you want to delete "${st.full_name}"? This action cannot be undone.`);
      if (!confirmed) return;

      try {
        await db.deleteStaff(st.id);
        showToast('Stylist Deleted', `"${st.full_name}" has been removed.`, 'info');
        refreshAllData();
      } catch (err) {
        console.error('Delete staff error:', err);
        const errMsg = (err.message || '').toLowerCase();
        if (err.code === '23503' || errMsg.includes('foreign key') || errMsg.includes('violates foreign key') || errMsg.includes('appointments')) {
          alert('Cannot delete this stylist because past appointments are assigned to them. Deactivate them instead to remove them from future bookings.');
        } else {
          showToast('Delete Failed', err.message || 'Could not delete stylist.', 'error');
        }
      }
    });

    tableBody.appendChild(tr);
  });
}

/**
 * Inventory & Consumables Table
 */
async function loadInventoryTable() {
  const tableBody = document.getElementById('inventory-table-body');
  if (!tableBody) return;

  try {
    const inventory = await db.getInventory();
    tableBody.innerHTML = '';

    inventory.forEach(item => {
      const isLowStock = item.current_stock <= item.minimum_threshold;
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>
          <strong style="color: var(--dark);">${item.item_name}</strong>
          <div class="text-sm text-muted">${item.category || 'Salon Consumable'}</div>
        </td>
        <td>
          <span style="font-size: 1.1rem; font-weight: 700; color: ${isLowStock ? '#ef4444' : 'var(--dark)'}">
            ${item.current_stock}
          </span> ${item.unit}
        </td>
        <td>${item.minimum_threshold} ${item.unit}</td>
        <td>
          <span class="badge ${isLowStock ? 'badge-low-stock' : 'badge-in-stock'}">
            ${isLowStock ? '⚠️ Low Stock' : '✓ In Stock'}
          </span>
        </td>
        <td>${new Date(item.last_updated).toLocaleDateString()}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn-icon danger decrement-stock-btn" title="Deduct 1" data-id="${item.id}">-</button>
            <button class="action-btn-icon success increment-stock-btn" title="Restock +1" data-id="${item.id}">+</button>
          </div>
        </td>
      `;

      tr.querySelector('.decrement-stock-btn')?.addEventListener('click', async () => {
        try {
          await db.adjustInventoryStock(item.id, -1);
          loadInventoryTable();
          loadDashboardKPIs();
          showToast('Stock Deducted', `Used 1 unit of ${item.item_name}.`, 'info');
        } catch (err) {
          showToast('Error', err.message, 'error');
        }
      });

      tr.querySelector('.increment-stock-btn')?.addEventListener('click', async () => {
        try {
          await db.adjustInventoryStock(item.id, 1);
          loadInventoryTable();
          loadDashboardKPIs();
          showToast('Stock Added', `Restocked 1 unit of ${item.item_name}.`, 'success');
        } catch (err) {
          showToast('Error', err.message, 'error');
        }
      });

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Inventory load error:', err);
    tableBody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Failed to load inventory.</td></tr>';
  }
}

/**
 * Daily Billing & Revenue Reconciliation
 */
async function loadBillingReconciliation() {
  const tableBody = document.getElementById('billing-table-body');
  const dateVal = document.getElementById('billing-date-filter')?.value || new Date().toISOString().split('T')[0];
  if (!tableBody) return;

  try {
    const transactions = await db.getTransactions(dateVal);
    tableBody.innerHTML = '';

    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount || 0);
      if (tx.payment_method === 'cash') totalCash += amount;
      else if (tx.payment_method === 'pos_card') totalCard += amount;
      else if (tx.payment_method === 'mobile_transfer') totalTransfer += amount;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></td>
        <td>${tx.appointment?.client_name || 'Client Walk-in'}</td>
        <td>${tx.appointment?.service?.name || 'Salon Treatment'}</td>
        <td>
          <span class="badge badge-confirmed" style="text-transform: uppercase;">
            ${tx.payment_method.replace('_', ' ')}
          </span>
        </td>
        <td><strong>${formatCurrency(amount)}</strong></td>
        <td><span class="badge badge-completed">Paid</span></td>
      `;
      tableBody.appendChild(tr);
    });

    // Update reconciliation breakdown boxes
    const grandTotal = totalCash + totalCard + totalTransfer;
    document.getElementById('reconcile-cash').textContent = formatCurrency(totalCash);
    document.getElementById('reconcile-card').textContent = formatCurrency(totalCard);
    document.getElementById('reconcile-transfer').textContent = formatCurrency(totalTransfer);
    document.getElementById('reconcile-grand-total').textContent = formatCurrency(grandTotal);

    if (transactions.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No billing transactions recorded for this date.</td></tr>';
    }
  } catch (err) {
    console.error('Billing load error:', err);
  }
}

/**
 * Modals & Actions Setup
 */
function setupModals() {
  // 1. Walk-In Registration
  const walkinModal = document.getElementById('walkin-modal');
  const openWalkinBtn = document.getElementById('open-walkin-modal-btn');
  const closeWalkinBtn = document.getElementById('close-walkin-modal');
  const walkinForm = document.getElementById('walkin-form');

  openWalkinBtn?.addEventListener('click', () => {
    walkinModal?.classList.add('active');
    const today = new Date().toISOString().split('T')[0];
    const walkinDateInp = document.getElementById('walkin-date');
    if (walkinDateInp) walkinDateInp.value = today;
  });

  closeWalkinBtn?.addEventListener('click', () => walkinModal?.classList.remove('active'));

  walkinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('walkin-name').value.trim();
    const phone = document.getElementById('walkin-phone').value.trim();
    const serviceId = document.getElementById('walkin-service-select').value;
    const staffId = document.getElementById('walkin-staff-select').value;
    const date = document.getElementById('walkin-date').value;
    const startTime = document.getElementById('walkin-start-time').value;

    if (!name || !phone || !serviceId || !staffId || !date || !startTime) {
      showToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    const selectedService = activeServices.find(s => s.id === serviceId);
    const duration = selectedService ? selectedService.duration_minutes : 45;

    // Compute end time
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    try {
      await db.createAppointment({
        client_name: `${name} (Walk-in)`,
        client_phone: phone,
        service_id: serviceId,
        staff_id: staffId,
        appointment_date: date,
        start_time: `${startTime}:00`,
        end_time: endTime,
        origin: 'walk_in',
        status: 'confirmed',
        notes: 'Registered in salon via Front Desk OMS'
      });

      showToast('Walk-in Registered', `Successfully added ${name} to schedule.`, 'success');
      walkinModal?.classList.remove('active');
      walkinForm.reset();
      refreshAllData();
    } catch (err) {
      showToast('Scheduling Conflict', err.message || 'Slot overlaps with another appointment.', 'error');
    }
  });

  // 2. Add Service Modal
  const serviceModal = document.getElementById('service-modal');
  const openServiceBtn = document.getElementById('open-service-modal-btn');
  const closeServiceBtn = document.getElementById('close-service-modal');
  const serviceForm = document.getElementById('service-form');

  openServiceBtn?.addEventListener('click', () => serviceModal?.classList.add('active'));
  closeServiceBtn?.addEventListener('click', () => serviceModal?.classList.remove('active'));

  serviceForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('service-name-inp').value.trim();
    const category = document.getElementById('service-category-inp').value.trim();
    const duration = parseInt(document.getElementById('service-duration-inp').value, 10);
    const price = parseFloat(document.getElementById('service-price-inp').value);
    const desc = document.getElementById('service-desc-inp').value.trim();

    try {
      await db.createService({
        name,
        category,
        duration_minutes: duration,
        price,
        description: desc,
        is_active: true
      });
      showToast('Service Created', `${name} has been added to catalog.`, 'success');
      serviceModal?.classList.remove('active');
      serviceForm.reset();
      refreshAllData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  // 2b. Edit Service Modal
  const editServiceModal = document.getElementById('edit-service-modal');
  const closeEditServiceBtn = document.getElementById('close-edit-service-modal');
  const cancelEditServiceBtn = document.getElementById('cancel-edit-service-btn');
  const editServiceForm = document.getElementById('edit-service-form');

  closeEditServiceBtn?.addEventListener('click', () => editServiceModal?.classList.remove('active'));
  cancelEditServiceBtn?.addEventListener('click', () => editServiceModal?.classList.remove('active'));

  editServiceForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-service-id').value;
    const name = document.getElementById('edit-service-name').value.trim();
    const category = document.getElementById('edit-service-category').value.trim();
    const duration = parseInt(document.getElementById('edit-service-duration').value, 10);
    const price = parseFloat(document.getElementById('edit-service-price').value);
    const desc = document.getElementById('edit-service-desc').value.trim();
    const isActive = document.getElementById('edit-service-active').checked;

    if (!id || !name || isNaN(duration) || isNaN(price)) {
      showToast('Validation Error', 'Please complete all required fields with valid values.', 'error');
      return;
    }

    const saveBtn = document.getElementById('save-edit-service-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      await db.updateService(id, {
        name,
        category,
        duration_minutes: duration,
        price,
        description: desc,
        is_active: isActive
      });

      showToast('Service Updated', `Changes to "${name}" have been saved.`, 'success');
      editServiceModal?.classList.remove('active');
      refreshAllData();
    } catch (err) {
      console.error('Update service error:', err);
      showToast('Update Failed', err.message || 'Could not update service.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }
  });

  // 3. Add Consumable Inventory Item
  const invModal = document.getElementById('inventory-modal');
  const openInvBtn = document.getElementById('open-inventory-modal-btn');
  const closeInvBtn = document.getElementById('close-inventory-modal');
  const invForm = document.getElementById('inventory-form');

  openInvBtn?.addEventListener('click', () => invModal?.classList.add('active'));
  closeInvBtn?.addEventListener('click', () => invModal?.classList.remove('active'));

  invForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inv-name-inp').value.trim();
    const category = document.getElementById('inv-category-inp').value.trim();
    const stock = parseInt(document.getElementById('inv-stock-inp').value, 10);
    const threshold = parseInt(document.getElementById('inv-threshold-inp').value, 10);
    const unit = document.getElementById('inv-unit-inp').value.trim();

    try {
      await db.createInventoryItem({
        item_name: name,
        category,
        current_stock: stock,
        minimum_threshold: threshold,
        unit
      });
      showToast('Item Added', `${name} registered into inventory.`, 'success');
      invModal?.classList.remove('active');
      invForm.reset();
      refreshAllData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  // 4. Add / Edit Stylist Modal
  const stylistModal = document.getElementById('stylist-modal');
  const openStylistBtn = document.getElementById('open-stylist-modal-btn');
  const closeStylistBtn = document.getElementById('close-stylist-modal');
  const cancelStylistBtn = document.getElementById('cancel-stylist-modal-btn');
  const stylistForm = document.getElementById('stylist-form');

  openStylistBtn?.addEventListener('click', () => openStylistModal(null));
  closeStylistBtn?.addEventListener('click', () => stylistModal?.classList.remove('active'));
  cancelStylistBtn?.addEventListener('click', () => stylistModal?.classList.remove('active'));

  stylistForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const staffId = document.getElementById('staff-id-inp').value.trim();
    const fullName = document.getElementById('staff-name-inp').value.trim();
    const roleTitle = document.getElementById('staff-role-inp').value.trim();
    const shiftStart = document.getElementById('staff-shift-start').value || '09:00';
    const shiftEnd = document.getElementById('staff-shift-end').value || '18:00';
    const isActive = document.getElementById('staff-active-inp').checked;

    if (!fullName || !roleTitle) {
      showToast('Validation Error', 'Please specify full name and role title.', 'error');
      return;
    }

    const saveBtn = document.getElementById('save-stylist-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const payload = {
        full_name: fullName,
        role_title: roleTitle,
        shift_start: `${shiftStart}:00`,
        shift_end: `${shiftEnd}:00`,
        is_active: isActive
      };

      if (staffId) {
        await db.updateStaff(staffId, payload);
        showToast('Stylist Updated', `Changes to "${fullName}" have been saved.`, 'success');
      } else {
        await db.createStaff(payload);
        showToast('Stylist Created', `"${fullName}" added to salon staff roster.`, 'success');
      }

      stylistModal?.classList.remove('active');
      stylistForm.reset();
      refreshAllData();
    } catch (err) {
      console.error('Save staff error:', err);
      showToast('Save Failed', err.message || 'Could not save stylist record.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Stylist';
      }
    }
  });

  // Filter Listeners
  document.getElementById('agenda-date-filter')?.addEventListener('change', loadAgenda);
  document.getElementById('agenda-clear-date-btn')?.addEventListener('click', () => {
    const inp = document.getElementById('agenda-date-filter');
    if (inp) inp.value = '';
    loadAgenda();
  });
  document.getElementById('agenda-staff-filter')?.addEventListener('change', loadAgenda);
  document.getElementById('agenda-status-filter')?.addEventListener('change', loadAgenda);
  document.getElementById('billing-date-filter')?.addEventListener('change', loadBillingReconciliation);
}

/**
 * Payment Collection Modal Helper
 */
function openPaymentModal(appointment) {
  const modal = document.getElementById('payment-modal');
  if (!modal) return;

  const price = appointment.service?.price || 0;
  document.getElementById('pay-client-name').textContent = appointment.client_name;
  document.getElementById('pay-service-name').textContent = appointment.service?.name || 'Treatment';
  document.getElementById('pay-amount-input').value = parseFloat(price).toFixed(2);

  modal.classList.add('active');

  const closeBtn = document.getElementById('close-payment-modal');
  closeBtn.onclick = () => modal.classList.remove('active');

  const payForm = document.getElementById('payment-form');
  payForm.onsubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('pay-amount-input').value);
    const method = document.getElementById('pay-method-select').value;
    const notes = document.getElementById('pay-notes-input').value;

    try {
      await db.recordTransaction({
        appointment_id: appointment.id,
        amount,
        payment_method: method,
        payment_status: 'paid',
        notes
      });
      showToast('Payment Recorded', `Logged ${formatCurrency(amount)} via ${method}.`, 'success');
      modal.classList.remove('active');
      refreshAllData();
    } catch (err) {
      showToast('Payment Error', err.message, 'error');
    }
  };
}

/**
 * Open and populate Edit Service Modal
 */
function openEditServiceModal(service) {
  const modal = document.getElementById('edit-service-modal');
  if (!modal) return;

  const idInp = document.getElementById('edit-service-id');
  const nameInp = document.getElementById('edit-service-name');
  const categoryInp = document.getElementById('edit-service-category');
  const durationInp = document.getElementById('edit-service-duration');
  const priceInp = document.getElementById('edit-service-price');
  const descInp = document.getElementById('edit-service-desc');
  const activeInp = document.getElementById('edit-service-active');

  if (idInp) idInp.value = service.id;
  if (nameInp) nameInp.value = service.name || '';
  if (categoryInp) categoryInp.value = service.category || 'General';
  if (durationInp) durationInp.value = service.duration_minutes || 45;
  if (priceInp) priceInp.value = parseFloat(service.price || 0).toFixed(2);
  if (descInp) descInp.value = service.description || '';
  if (activeInp) activeInp.checked = !!service.is_active;

  modal.classList.add('active');
}

/**
 * Open and populate Stylist Modal
 */
function openStylistModal(staffMember = null) {
  const modal = document.getElementById('stylist-modal');
  if (!modal) return;

  const titleEl = document.getElementById('stylist-modal-title');
  const idInp = document.getElementById('staff-id-inp');
  const nameInp = document.getElementById('staff-name-inp');
  const roleInp = document.getElementById('staff-role-inp');
  const startInp = document.getElementById('staff-shift-start');
  const endInp = document.getElementById('staff-shift-end');
  const activeInp = document.getElementById('staff-active-inp');

  if (staffMember) {
    if (titleEl) titleEl.textContent = 'Edit Stylist Profile';
    if (idInp) idInp.value = staffMember.id;
    if (nameInp) nameInp.value = staffMember.full_name || '';
    if (roleInp) roleInp.value = staffMember.role_title || '';
    if (startInp) startInp.value = staffMember.shift_start ? staffMember.shift_start.substring(0, 5) : '09:00';
    if (endInp) endInp.value = staffMember.shift_end ? staffMember.shift_end.substring(0, 5) : '18:00';
    if (activeInp) activeInp.checked = !!staffMember.is_active;
  } else {
    if (titleEl) titleEl.textContent = 'Add New Stylist';
    if (idInp) idInp.value = '';
    if (nameInp) nameInp.value = '';
    if (roleInp) roleInp.value = '';
    if (startInp) startInp.value = '09:00';
    if (endInp) endInp.value = '18:00';
    if (activeInp) activeInp.checked = true;
  }

  modal.classList.add('active');
}
