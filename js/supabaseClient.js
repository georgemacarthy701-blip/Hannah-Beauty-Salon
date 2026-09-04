/**
 * HANNAH BEAUTY SALON OMS — SUPABASE CLIENT & DATA ACCESS LAYER
 * Connects directly to live Supabase backend via @supabase/supabase-js
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Authoritative Live Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Universal Database Data Access Layer
 * All queries execute strictly against live Supabase PostgreSQL tables
 */
export const db = {
  // 1. Services Catalog
  async getServices(activeOnly = true) {
    let query = supabase.from('services').select('*').order('name');
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
    return data || [];
  },

  async createService(service) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();
    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }
    return data;
  },

  async updateService(id, updates) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }
    return data;
  },

  async deleteService(id) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
    return true;
  },

  // 2. Staff Management
  async getStaff(activeOnly = true) {
    let query = supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
    return data || [];
  },

  async createStaff(staffMember) {
    const { data, error } = await supabase
      .from('staff')
      .insert([staffMember])
      .select()
      .single();
    if (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
    return data;
  },

  async updateStaff(id, updates) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
    return data;
  },

  async deleteStaff(id) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting staff member:', error);
      throw error;
    }
    return true;
  },

  // 3. Appointments
  async getAppointments(filters = {}) {
    try {
      let query = supabase.from('appointments').select(`
        *,
        service:services(id, name, duration_minutes, price, category),
        staff:staff(id, full_name, role_title)
      `).order('appointment_date', { ascending: true }).order('start_time', { ascending: true });

      if (filters.date) query = query.eq('appointment_date', filters.date);
      if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.client_id) query = query.eq('client_id', filters.client_id);

      const { data, error } = await query;
      if (error) {
        console.warn('Warning fetching appointments (may be restricted by RLS):', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Catch fetching appointments:', err);
      return [];
    }
  },

  async createAppointment(appointment) {
    // Generate a secure client-side UUID if not provided
    const id = appointment.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null);
    const appointmentPayload = id ? { id, ...appointment } : { ...appointment };

    // Check conflicts before insertion (server trigger also enforces this atomically)
    let existing = [];
    try {
      existing = await this.getAppointments({
        date: appointment.appointment_date,
        staff_id: appointment.staff_id
      });
    } catch (_) {
      existing = [];
    }

    if (existing && existing.length > 0) {
      const hasConflict = existing.some(ext => {
        if (ext.status === 'cancelled') return false;
        const extStart = ext.start_time;
        const extEnd = ext.end_time;
        const newStart = appointment.start_time;
        const newEnd = appointment.end_time;

        return (
          (newStart >= extStart && newStart < extEnd) ||
          (newEnd > extStart && newEnd <= extEnd) ||
          (newStart <= extStart && newEnd >= extEnd)
        );
      });

      if (hasConflict) {
        throw new Error('Scheduling Conflict: The selected stylist is already booked during this time window.');
      }
    }

    // Attempt insert with .select()
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentPayload])
      .select();

    if (error) {
      // If error occurred on SELECT returning clause, try raw insert without .select()
      console.warn('Insert with select failed, attempting direct insert:', error.message);
      const { error: rawInsertErr } = await supabase
        .from('appointments')
        .insert([appointmentPayload]);

      if (rawInsertErr) {
        console.error('Error creating appointment:', rawInsertErr);
        throw rawInsertErr;
      }
      return appointmentPayload;
    }

    return (data && data.length > 0) ? data[0] : appointmentPayload;
  },

  async updateAppointmentStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
    return data;
  },

  // 4. Consumables & Inventory
  async getInventory() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('item_name');

    if (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
    return data || [];
  },

  async adjustInventoryStock(id, delta) {
    const { data: item, error: fetchErr } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const newStock = Math.max(0, (item.current_stock || 0) + delta);
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error adjusting inventory:', error);
      throw error;
    }
    return data;
  },

  async createInventoryItem(item) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
    return data;
  },

  // 5. Billing Transactions & Reconciliation
  async getTransactions(dateStr = null) {
    let query = supabase.from('transactions').select(`
      *,
      appointment:appointments(client_name, service:services(name))
    `).order('created_at', { ascending: false });

    if (dateStr) {
      query = query
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    return data || [];
  },

  async recordTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }

    // Mark appointment as completed upon payment
    if (transaction.appointment_id) {
      await this.updateAppointmentStatus(transaction.appointment_id, 'completed');
    }

    return data;
  }
};
