/**
 * HANNAH BEAUTY SALON OMS — CONFIGURATION
 * Supabase Connection Constants, Operational Business Rules & Currency Formatter
 */

// Supabase Live Project Credentials
export const SUPABASE_URL = 'https://rhjgjwdibkweusqjccpk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_wNzmxDrl2w0KmlU1FWu5BA_czjgv-fy';

// Salon Operational Business Rules (Sierra Leone Leones: Le)
export const SALON_CONFIG = {
  name: 'Hannah Beauty Salon',
  tagline: 'Luxury Hair, Nails & Aesthetic Spa Care',
  phone: '+1 (555) 234-5678',
  email: 'appointments@hannahbeautysalon.com',
  address: '142 Luxury Boulevard, Suite 300, Beverly Hills, CA',
  openingHour: '09:00',
  closingHour: '18:00',
  slotIntervalMinutes: 30, // 30-minute booking step intervals
  currencySymbol: 'Le',
  taxRate: 0.0,
  roles: {
    CLIENT: 'client',
    STAFF: 'staff',
    ADMIN: 'admin'
  }
};

/**
 * Global Currency Formatter (Sierra Leone Leones - Le)
 * Formats numeric values to standard "Le 180.00" string
 */
export function formatCurrency(amount) {
  const numericAmount = Number(amount) || 0;
  return `Le ${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
