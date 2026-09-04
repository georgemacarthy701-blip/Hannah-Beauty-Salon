/**
 * HANNAH BEAUTY SALON OMS — CLIENT BOOKING ENGINE
 * Supports Guest Checkout & Authenticated Client Booking
 * Dynamic service catalogue, stylist assignment, real-time duration-aware slot conflict calculation, and instant confirmation modal.
 */

import { db } from './supabaseClient.js';
import { auth, showToast } from './auth.js';
import { SALON_CONFIG, formatCurrency } from './config.js';

// State container
const bookingState = {
  services: [],
  staff: [],
  selectedService: null,
  selectedStaff: null, // null means "Any Available"
  selectedDate: '',
  selectedTime: '',
  computedEndTime: '',
  autoAssignedStaffId: null,
  autoAssignedStaffName: '',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  notes: ''
};

// DOM Elements
let serviceListEl, staffListEl, dateInputEl, slotGridEl, bookingFormEl, confirmModalEl;

document.addEventListener('DOMContentLoaded', async () => {
  serviceListEl = document.getElementById('service-catalog-list');
  staffListEl = document.getElementById('staff-selection-list');
  dateInputEl = document.getElementById('booking-date-input');
  slotGridEl = document.getElementById('time-slots-grid');
  bookingFormEl = document.getElementById('client-details-form');
  confirmModalEl = document.getElementById('booking-confirmation-modal');

  // Pre-set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  if (dateInputEl) {
    dateInputEl.min = today;
    dateInputEl.value = today;
    bookingState.selectedDate = today;
  }

  // Pre-fill user data if logged in (Guest checkout if not logged in)
  try {
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      const nameInp = document.getElementById('client-name');
      const emailInp = document.getElementById('client-email');
      const phoneInp = document.getElementById('client-phone');
      if (nameInp && currentUser.full_name) nameInp.value = currentUser.full_name;
      if (emailInp && currentUser.email) emailInp.value = currentUser.email;
      if (phoneInp && currentUser.phone) phoneInp.value = currentUser.phone;
    }
  } catch (authErr) {
    console.log('[Booking] Proceeding as guest checkout:', authErr);
  }

  // Check URL parameter for pre-selected service
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedServiceId = urlParams.get('service');

  await loadInitialData(preSelectedServiceId);
  setupEventListeners();
});

/**
 * Load services and stylists from Supabase/DB
 */
async function loadInitialData(preSelectedServiceId = null) {
  try {
    const [services, staff] = await Promise.all([
      db.getServices(true),
      db.getStaff(true)
    ]);

    bookingState.services = services;
    bookingState.staff = staff;

    renderServices(services, preSelectedServiceId);
    renderStaff(staff);

    if (bookingState.selectedService) {
      await calculateAvailableSlots();
    }
  } catch (err) {
    console.error('Failed to load booking data:', err);
    showToast('Connection Error', 'Could not load service catalogue. Please refresh.', 'error');
  }
}

/**
 * Render service cards
 */
function renderServices(services, preSelectedId) {
  if (!serviceListEl) return;
  serviceListEl.innerHTML = '';

  if (services.length === 0) {
    serviceListEl.innerHTML = '<p class="text-muted">No active services available at the moment.</p>';
    return;
  }

  // Group by category
  const categories = [...new Set(services.map(s => s.category || 'Treatments'))];

  categories.forEach(cat => {
    const catHeading = document.createElement('h4');
    catHeading.className = 'font-serif';
    catHeading.style.margin = '1.5rem 0 0.75rem';
    catHeading.style.color = 'var(--primary)';
    catHeading.textContent = cat;
    serviceListEl.appendChild(catHeading);

    const groupGrid = document.createElement('div');
    groupGrid.className = 'services-booking-grid';

    services.filter(s => (s.category || 'Treatments') === cat).forEach(service => {
      const card = document.createElement('div');
      card.className = `service-select-card card ${preSelectedId === service.id ? 'selected' : ''}`;
      card.dataset.id = service.id;

      if (preSelectedId === service.id) {
        bookingState.selectedService = service;
        updateOrderSummary();
      }

      card.innerHTML = `
        <div class="service-card-body">
          <div class="service-card-header">
            <h4 class="service-name">${service.name}</h4>
            <span class="service-price">${formatCurrency(service.price)}</span>
          </div>
          <p class="service-desc">${service.description || 'Luxurious salon care.'}</p>
          <div class="service-meta">
            <span class="meta-tag">⏱️ ${service.duration_minutes} mins</span>
            <span class="select-indicator">✓ Select</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        bookingState.selectedService = service;
        updateOrderSummary();
        calculateAvailableSlots();
        scrollToStep('step-stylist');
      });

      groupGrid.appendChild(card);
    });

    serviceListEl.appendChild(groupGrid);
  });
}

/**
 * Render stylist options
 */
function renderStaff(staffList) {
  if (!staffListEl) return;
  staffListEl.innerHTML = '';

  // Option 1: Any Available Stylist
  const anyCard = document.createElement('div');
  anyCard.className = 'stylist-select-card card selected';
  anyCard.dataset.id = 'any';
  anyCard.innerHTML = `
    <div class="stylist-avatar-box">👥</div>
    <div class="stylist-info">
      <h4>Any Available Stylist</h4>
      <p class="text-sm text-muted">First available master artist</p>
    </div>
  `;
  anyCard.addEventListener('click', () => {
    document.querySelectorAll('.stylist-select-card').forEach(c => c.classList.remove('selected'));
    anyCard.classList.add('selected');
    bookingState.selectedStaff = null;
    updateOrderSummary();
    calculateAvailableSlots();
  });
  staffListEl.appendChild(anyCard);

  // Individual stylists
  staffList.forEach(stylist => {
    const card = document.createElement('div');
    card.className = 'stylist-select-card card';
    card.dataset.id = stylist.id;

    const initials = stylist.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);

    card.innerHTML = `
      <div class="stylist-avatar-box">${initials}</div>
      <div class="stylist-info">
        <h4>${stylist.full_name}</h4>
        <p class="text-sm text-muted">${stylist.role_title}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.stylist-select-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      bookingState.selectedStaff = stylist;
      updateOrderSummary();
      calculateAvailableSlots();
    });

    staffListEl.appendChild(card);
  });
}

/**
 * Real-time duration-aware slot conflict calculation
 */
async function calculateAvailableSlots() {
  if (!slotGridEl) return;
  slotGridEl.innerHTML = '<div class="loading-slots"><p>Calculating slot availability...</p></div>';

  if (!bookingState.selectedService) {
    slotGridEl.innerHTML = '<p class="text-muted">Please select a service first to view available times.</p>';
    return;
  }

  const duration = bookingState.selectedService.duration_minutes || 45;
  const dateStr = dateInputEl ? dateInputEl.value : bookingState.selectedDate;
  bookingState.selectedDate = dateStr;

  try {
    // 1. Fetch all appointments on the selected date
    const dayAppointments = await db.getAppointments({ date: dateStr });

    // 2. Generate candidate 30-minute interval slots from 09:00 to 18:00
    const startHour = 9;
    const endHour = 18;
    const candidateSlots = [];

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += SALON_CONFIG.slotIntervalMinutes) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const startTimeStr = `${hh}:${mm}:00`;

        // Calculate end time
        const slotStartMinutes = h * 60 + m;
        const slotEndMinutes = slotStartMinutes + duration;
        const endH = Math.floor(slotEndMinutes / 60);
        const endM = slotEndMinutes % 60;

        // If service exceeds salon closing time, skip
        if (endH > endHour || (endH === endHour && endM > 0)) {
          continue;
        }

        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

        candidateSlots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          display: `${hh}:${mm}`
        });
      }
    }

    // 3. Filter candidates based on stylist assignment and existing bookings
    const activeStaff = bookingState.selectedStaff
      ? [bookingState.selectedStaff]
      : bookingState.staff;

    const availableSlots = [];

    const now = new Date();
    const isToday = (dateStr === now.toISOString().split('T')[0]);
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    candidateSlots.forEach(slot => {
      // Past time check if booking for today
      const [sh, sm] = slot.startTime.split(':').map(Number);
      if (isToday && (sh * 60 + sm) <= currentMinutesNow + 15) {
        return; // Slot has already passed or is within 15 mins
      }

      // Check if at least one stylist is free during this slot window
      const eligibleStylist = activeStaff.find(st => {
        // Check day of week shift
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        if (st.working_days && !st.working_days.includes(dayName)) {
          return false;
        }

        // Check if stylist is booked
        const stAppointments = dayAppointments.filter(a => a.staff_id === st.id && a.status !== 'cancelled');

        const hasConflict = stAppointments.some(apt => {
          return (
            (slot.startTime >= apt.start_time && slot.startTime < apt.end_time) ||
            (slot.endTime > apt.start_time && slot.endTime <= apt.end_time) ||
            (slot.startTime <= apt.start_time && slot.endTime >= apt.end_time)
          );
        });

        return !hasConflict;
      });

      if (eligibleStylist) {
        availableSlots.push({
          ...slot,
          assignedStylistId: eligibleStylist.id,
          assignedStylistName: eligibleStylist.full_name
        });
      }
    });

    renderTimeSlots(availableSlots);
  } catch (err) {
    console.error('Slot calculation error:', err);
    slotGridEl.innerHTML = '<p class="text-danger">Failed to calculate available times. Please try another date.</p>';
  }
}

/**
 * Render calculated bookable slots
 */
function renderTimeSlots(slots) {
  if (!slotGridEl) return;
  slotGridEl.innerHTML = '';

  if (slots.length === 0) {
    slotGridEl.innerHTML = `
      <div style="grid-column: 1/-1; padding: 1.5rem; text-align: center; background: var(--bg-subtle); border-radius: var(--radius-sm);">
        <p style="font-weight: 600; color: var(--dark);">No available slots for this date.</p>
        <p class="text-sm text-muted">Please select an alternate date or another stylist.</p>
      </div>
    `;
    bookingState.selectedTime = '';
    updateOrderSummary();
    return;
  }

  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `slot-button ${bookingState.selectedTime === slot.startTime ? 'selected' : ''}`;
    btn.innerHTML = `
      <span class="slot-time">${slot.display}</span>
      <span class="slot-duration text-sm">${bookingState.selectedService.duration_minutes}m</span>
    `;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.slot-button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      bookingState.selectedTime = slot.startTime;
      bookingState.computedEndTime = slot.endTime;
      bookingState.autoAssignedStaffId = slot.assignedStylistId;
      bookingState.autoAssignedStaffName = slot.assignedStylistName;
      updateOrderSummary();
      scrollToStep('step-client');
    });

    slotGridEl.appendChild(btn);
  });
}

/**
 * Update summary ticket on side / bottom
 */
function updateOrderSummary() {
  const summaryServiceEl = document.getElementById('summary-service-name');
  const summaryDurationEl = document.getElementById('summary-duration');
  const summaryPriceEl = document.getElementById('summary-price');
  const summaryStylistEl = document.getElementById('summary-stylist');
  const summaryDatetimeEl = document.getElementById('summary-datetime');

  if (summaryServiceEl) {
    summaryServiceEl.textContent = bookingState.selectedService ? bookingState.selectedService.name : 'Select a treatment';
  }
  if (summaryDurationEl && bookingState.selectedService) {
    summaryDurationEl.textContent = `${bookingState.selectedService.duration_minutes} Minutes`;
  }
  if (summaryPriceEl) {
    summaryPriceEl.textContent = bookingState.selectedService
      ? formatCurrency(bookingState.selectedService.price)
      : 'Le 0.00';
  }
  if (summaryStylistEl) {
    summaryStylistEl.textContent = bookingState.selectedStaff
      ? bookingState.selectedStaff.full_name
      : (bookingState.autoAssignedStaffName ? `${bookingState.autoAssignedStaffName} (Assigned)` : 'Any Available Stylist');
  }
  if (summaryDatetimeEl) {
    if (bookingState.selectedDate && bookingState.selectedTime) {
      summaryDatetimeEl.textContent = `${bookingState.selectedDate} at ${bookingState.selectedTime.substring(0, 5)}`;
    } else if (bookingState.selectedDate) {
      summaryDatetimeEl.textContent = `${bookingState.selectedDate} (Select a time)`;
    } else {
      summaryDatetimeEl.textContent = 'Not selected';
    }
  }
}

/**
 * Event Listeners and Guest / Client Form Submission
 */
function setupEventListeners() {
  // Date change
  dateInputEl?.addEventListener('change', (e) => {
    bookingState.selectedDate = e.target.value;
    bookingState.selectedTime = '';
    calculateAvailableSlots();
  });

  // Booking Form Submission
  bookingFormEl?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!bookingState.selectedService) {
      showToast('Action Required', 'Please select a salon service before proceeding.', 'error');
      scrollToStep('step-services');
      return;
    }

    if (!bookingState.selectedTime) {
      showToast('Action Required', 'Please select an available appointment time slot.', 'error');
      scrollToStep('step-datetime');
      return;
    }

    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const email = document.getElementById('client-email')?.value.trim() || null;
    const notes = document.getElementById('client-notes')?.value.trim() || null;

    if (!name || !phone) {
      showToast('Validation Error', 'Please provide your full name and phone number.', 'error');
      return;
    }

    const submitBtn = document.getElementById('submit-booking-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Securing Reservation...';
    }

    try {
      // Check if user is logged in (nullable client_id for guest checkout)
      let currentUserId = null;
      try {
        const user = await auth.getCurrentUser();
        if (user) currentUserId = user.id;
      } catch (_) {
        currentUserId = null;
      }

      const staffId = bookingState.selectedStaff
        ? bookingState.selectedStaff.id
        : (bookingState.autoAssignedStaffId || bookingState.staff[0]?.id);

      const appointmentRecord = {
        client_id: currentUserId,
        client_name: name,
        client_phone: phone,
        client_email: email,
        service_id: bookingState.selectedService.id,
        staff_id: staffId,
        appointment_date: bookingState.selectedDate,
        start_time: bookingState.selectedTime,
        end_time: bookingState.computedEndTime,
        origin: 'online',
        status: 'pending',
        notes: notes
      };

      console.log('[Booking Submission] Creating appointment:', appointmentRecord);
      const created = await db.createAppointment(appointmentRecord);

      // Show Instant Confirmation Modal with Ref ID
      showConfirmationModal(created, name, email, phone);
      showToast('Reservation Placed!', 'Your appointment has been registered successfully.', 'success');
    } catch (err) {
      console.error('Booking submission failed:', err);
      showToast('Booking Failed', err.message || 'Could not complete booking. Please choose another time slot.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Reservation';
      }
    }
  });
}

/**
 * Display confirmation modal with booking reference and arrival notice
 */
function showConfirmationModal(apt, name, email, phone) {
  if (!confirmModalEl) return;

  // Format booking reference ID #HBS-XXXX
  const idRaw = (apt.id || '').replace(/-/g, '').toUpperCase();
  const refCode = idRaw ? `#HBS-${idRaw.substring(0, 6)}` : `#HBS-${Math.floor(1000 + Math.random() * 9000)}`;
  const stylistName = bookingState.selectedStaff
    ? bookingState.selectedStaff.full_name
    : (bookingState.autoAssignedStaffName || 'Master Stylist');

  const modalBody = document.getElementById('confirm-modal-details');
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: #ecfdf5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 0.75rem; font-weight: bold;">✓</div>
        <h3 class="font-serif" style="font-size: 1.6rem; margin-bottom: 0.25rem;">Reservation Confirmed!</h3>
        <p class="text-sm text-muted">Thank you for booking with Hannah Beauty Salon.</p>
        <div style="background: var(--bg-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-top: 1rem; border: 1.5px dashed var(--border-focus); display: inline-block; width: 100%;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 600;">Booking Reference ID</span>
          <div style="font-family: monospace; font-size: 1.35rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; margin-top: 0.15rem;">${refCode}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.65rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Client Name:</span>
          <strong>${name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Contact Phone:</span>
          <strong>${phone}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Service / Treatment:</span>
          <strong>${bookingState.selectedService.name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Stylist:</span>
          <strong>${stylistName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Date & Time:</span>
          <strong style="color: var(--primary);">${bookingState.selectedDate} at ${bookingState.selectedTime.substring(0, 5)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Estimated Duration:</span>
          <span>${bookingState.selectedService.duration_minutes} Minutes</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-subtle); padding-top: 0.5rem; margin-top: 0.25rem;">
          <span class="text-muted font-semibold">Total Price:</span>
          <strong style="color: var(--primary); font-size: 1.15rem; font-family: var(--font-serif);">${formatCurrency(bookingState.selectedService.price)}</strong>
        </div>
      </div>

      <!-- Arrival Advice Notice -->
      <div style="background: #fff8e6; border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 0.75rem 1rem; margin-top: 1.25rem; font-size: 0.825rem; color: #92400e; display: flex; align-items: center; gap: 0.5rem;">
        <span>ℹ️</span>
        <span><strong>Important:</strong> Please arrive 10 minutes prior to your scheduled time.</span>
      </div>

      <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button id="modal-book-another-btn" class="btn btn-secondary btn-block">Book Another</button>
        <button id="modal-home-btn" class="btn btn-primary btn-block">Return Home</button>
      </div>
    `;
  }

  confirmModalEl.classList.add('active');

  document.getElementById('modal-book-another-btn')?.addEventListener('click', () => {
    confirmModalEl.classList.remove('active');
    window.location.reload();
  });

  document.getElementById('modal-home-btn')?.addEventListener('click', () => {
    confirmModalEl.classList.remove('active');
    window.location.href = 'index.html';
  });

  document.getElementById('close-confirm-modal')?.addEventListener('click', () => {
    confirmModalEl.classList.remove('active');
    window.location.href = 'index.html';
  });
}

function scrollToStep(stepId) {
  const el = document.getElementById(stepId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
