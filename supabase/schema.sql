-- =====================================================================
-- HANNAH BEAUTY SALON: DIGITAL RESERVATION & OPERATIONS MANAGEMENT SYSTEM
-- PostgreSQL Database Schema, Triggers, RLS Policies & Seed Data
-- Prepared in accordance with IEEE Std 830-1998 SRS Specification
-- =====================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_origin AS ENUM ('online', 'walk_in');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'pos_card', 'mobile_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE DEFINITIONS

-- 2.1 Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'client',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Services Catalog Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Staff & Stylist Management Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Senior Stylist',
    specialties TEXT[] DEFAULT '{}',
    working_days TEXT[] DEFAULT '{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}',
    shift_start TIME NOT NULL DEFAULT '09:00:00',
    shift_end TIME NOT NULL DEFAULT '18:00:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    origin appointment_origin NOT NULL DEFAULT 'online',
    status appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- 2.5 Inventory & Consumables Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Consumables',
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_threshold INTEGER NOT NULL DEFAULT 5 CHECK (minimum_threshold >= 0),
    unit TEXT NOT NULL DEFAULT 'bottles',
    cost_per_unit DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Transactions & Billing Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_status payment_status NOT NULL DEFAULT 'paid',
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR HIGH-PERFORMANCE OPERATIONAL QUERIES
CREATE INDEX IF NOT EXISTS idx_appointments_date_staff ON public.appointments(appointment_date, staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff(is_active);

-- 4. DATABASE FUNCTIONS AND TRIGGERS

-- 4.1 Automatically handle new user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_text TEXT;
    assigned_role user_role := 'client';
    user_name TEXT;
    user_phone TEXT;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    user_phone := new.raw_user_meta_data->>'phone';
    role_text := new.raw_user_meta_data->>'role';

    IF role_text IN ('admin', 'staff', 'client') THEN
        assigned_role := role_text::user_role;
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (new.id, user_name, user_phone, assigned_role)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = EXCLUDED.role;

    -- If the role is staff, automatically register a staff profile entry if not existing
    IF assigned_role = 'staff' THEN
        INSERT INTO public.staff (user_id, full_name, role_title)
        VALUES (new.id, user_name, 'Stylist')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (new.id, split_part(new.email, '@', 1), null, 'client')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Updated Timestamp Trigger Helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated ON public.profiles;
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_services_updated ON public.services;
CREATE TRIGGER tr_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_staff_updated ON public.staff;
CREATE TRIGGER tr_staff_updated BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_appointments_updated ON public.appointments;
CREATE TRIGGER tr_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.3 Slot Conflict Validation Trigger (Authoritative Server-Side Guard)
CREATE OR REPLACE FUNCTION public.validate_appointment_slot()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for overlapping active appointments for the same staff on the same date
    IF new.status != 'cancelled' THEN
        SELECT COUNT(*)
        INTO conflict_count
        FROM public.appointments
        WHERE staff_id = new.staff_id
          AND appointment_date = new.appointment_date
          AND status != 'cancelled'
          AND id != COALESCE(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND (
              (new.start_time >= start_time AND new.start_time < end_time) OR
              (new.end_time > start_time AND new.end_time <= end_time) OR
              (new.start_time <= start_time AND new.end_time >= end_time)
          );

        IF conflict_count > 0 THEN
            RAISE EXCEPTION 'Scheduling Conflict: Stylist is already booked during this time window.';
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_appointment_slot ON public.appointments;
CREATE TRIGGER tr_check_appointment_slot
    BEFORE INSERT OR UPDATE OF staff_id, appointment_date, start_time, end_time, status
    ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_slot();


-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper role checker functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.1 Profiles RLS
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins full manage profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.2 Services Catalog RLS
CREATE POLICY "Public services read active"
    ON public.services FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_staff_or_admin());

CREATE POLICY "Admins manage services"
    ON public.services FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.3 Staff RLS
CREATE POLICY "Public staff read active"
    ON public.staff FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_staff_or_admin());

CREATE POLICY "Admins manage staff"
    ON public.staff FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.4 Appointments RLS
-- Allow public or client to insert appointments (online booking & walk-in)
CREATE POLICY "Public and Clients can create appointments"
    ON public.appointments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Clients can read their own appointments
CREATE POLICY "Clients read own appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (client_id = auth.uid() OR public.is_staff_or_admin());

-- Staff can view all appointments or assigned ones
CREATE POLICY "Staff read appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (public.is_staff_or_admin());

-- Staff and Admin can update appointments
CREATE POLICY "Staff and Admin update appointments"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (public.is_staff_or_admin());

-- Admin delete appointments
CREATE POLICY "Admins delete appointments"
    ON public.appointments FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5.5 Inventory Items RLS
CREATE POLICY "Staff and Admin can read inventory"
    ON public.inventory_items FOR SELECT
    TO authenticated
    USING (public.is_staff_or_admin());

CREATE POLICY "Staff and Admin can update inventory quantities"
    ON public.inventory_items FOR UPDATE
    TO authenticated
    USING (public.is_staff_or_admin());

CREATE POLICY "Admins full manage inventory"
    ON public.inventory_items FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.6 Transactions RLS
CREATE POLICY "Staff and Admin can read transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (public.is_staff_or_admin());

CREATE POLICY "Staff and Admin can record transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Admins full manage transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (public.is_admin());


-- 6. INITIAL SEED DATA FOR TESTING & DEMONSTRATION

-- 6.1 Services Seed
INSERT INTO public.services (name, category, description, duration_minutes, price, is_active)
VALUES
    ('Executive Haircut & Styling', 'Hair', 'Precision cut, wash, scalp massage, and custom styling finish.', 45, 35.00, true),
    ('Hydra-Gloss Hair Treatment & Blowdry', 'Hair Treatments', 'Deep conditioning keratin repair treatment for silky, revitalized hair.', 60, 65.00, true),
    ('Signature Balayage & Toning', 'Hair Coloring', 'Hand-painted dimensional highlights with custom gloss toning.', 120, 140.00, true),
    ('Luxury Gel Manicure & Hand Spa', 'Nails', 'Cuticle treatment, organic exfoliation, and chip-free gel polish application.', 45, 40.00, true),
    ('Deluxe Pedicure & Foot Scrub', 'Nails', 'Aromatherapy foot soak, callus buffing, massage, and polish.', 50, 45.00, true),
    ('Radiance Renewal Facial', 'Skincare', 'Deep pore cleansing, enzyme peel, lymphatic facial massage, and LED therapy.', 60, 75.00, true),
    ('Bridal Glam Makeup & Lashes', 'Makeup', 'High-definition long-lasting bridal makeup with mink lash application.', 90, 110.00, true),
    ('Keratin Straightening Therapy', 'Hair Treatments', 'Formaldehyde-free smoothing system reducing frizz for up to 4 months.', 150, 180.00, true)
ON CONFLICT DO NOTHING;

-- 6.2 Staff Seed
INSERT INTO public.staff (full_name, role_title, specialties, working_days, shift_start, shift_end, is_active)
VALUES
    ('Hannah Davies', 'Master Stylist & Creative Director', '{"Hair", "Hair Coloring", "Hair Treatments"}', '{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}', '09:00:00', '18:00:00', true),
    ('Amina Yusuf', 'Senior Colorist & Hair Specialist', '{"Hair", "Hair Coloring"}', '{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"}', '09:00:00', '17:00:00', true),
    ('Elena Rostova', 'Lead Esthetician & Makeup Artist', '{"Skincare", "Makeup"}', '{"Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}', '10:00:00', '18:00:00', true),
    ('Chloe Bennett', 'Nail Artisan & Spa Specialist', '{"Nails"}', '{"Monday", "Wednesday", "Thursday", "Friday", "Saturday"}', '09:30:00', '17:30:00', true)
ON CONFLICT DO NOTHING;

-- 6.3 Inventory Consumables Seed
INSERT INTO public.inventory_items (item_name, category, current_stock, minimum_threshold, unit, cost_per_unit)
VALUES
    ('Organic Argan Shampoo (1000ml)', 'Hair Care', 8, 4, 'bottles', 18.50),
    ('Keratin Repair Hair Mask (500g)', 'Hair Care', 3, 5, 'tubs', 24.00), -- Low stock flag
    ('Developer 20 Vol (1000ml)', 'Coloring', 12, 5, 'bottles', 9.00),
    ('Ash Blonde Dye Tube 60ml', 'Coloring', 2, 6, 'tubes', 7.50), -- Low stock flag
    ('Professional Nail Prep Dehydrator', 'Nail Care', 15, 5, 'bottles', 6.00),
    ('UV/LED Top Coat Gel 15ml', 'Nail Care', 4, 6, 'bottles', 12.00), -- Low stock flag
    ('Hydrating Facial Serum (100ml)', 'Skincare', 7, 3, 'bottles', 32.00),
    ('Disposable Bamboo Spatulas (Pack 100)', 'Disposables', 22, 10, 'packs', 4.50)
ON CONFLICT DO NOTHING;
