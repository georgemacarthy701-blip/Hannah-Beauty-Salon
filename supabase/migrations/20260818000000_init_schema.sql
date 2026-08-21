-- Create Role Enum
CREATE TYPE user_role AS ENUM ('visitor', 'professional', 'company', 'admin');

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'professional',
    full_name TEXT NOT NULL,
    age INT,
    date_of_birth DATE,
    address TEXT,
    city_region TEXT,
    avatar_cloudinary_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Professional Details Table
CREATE TABLE public.professional_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    profession_title TEXT NOT NULL,
    bio TEXT,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Company Details Table
CREATE TABLE public.company_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    logo_cloudinary_url TEXT,
    office_address TEXT,
    website TEXT,
    description TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Portfolio Items Table
CREATE TABLE public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professional_details(id) ON DELETE CASCADE,
    cloudinary_public_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Jobs Table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_details(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL, -- Full-time, Part-time, Contract, One-off
    job_address_location TEXT NOT NULL,
    budget NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'open', -- open, closed, filled
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Applications Table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_details(id) ON DELETE CASCADE,
    cover_note TEXT,
    status TEXT NOT NULL DEFAULT 'submitted', -- submitted, reviewed, shortlisted, rejected, hired, withdrawn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_job_professional UNIQUE (job_id, professional_id)
);

-- 7. Services Table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professional_details(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Reviews Table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    professional_id UUID NOT NULL REFERENCES public.professional_details(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- application_status, new_application, general, moderation
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Reports Table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL, -- job, professional, review
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- PostgreSQL Helpers to identify Admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES

-- Profiles RLS
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Update Self Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Professional Details RLS
CREATE POLICY "Public Read Professional Details" ON public.professional_details FOR SELECT USING (true);
CREATE POLICY "Manage Self Professional Details" ON public.professional_details FOR ALL USING (auth.uid() = user_id);

-- Company Details RLS
CREATE POLICY "Public Read Company Details" ON public.company_details FOR SELECT USING (true);
CREATE POLICY "Manage Self Company Details" ON public.company_details FOR ALL USING (auth.uid() = user_id);

-- Portfolio Items RLS
CREATE POLICY "Public Read Portfolio Items" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Manage Professional Portfolio Items" ON public.portfolio_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.professional_details pd
        WHERE pd.id = portfolio_items.professional_id AND pd.user_id = auth.uid()
    )
);

-- Jobs RLS
CREATE POLICY "Public Read Jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Manage Company Jobs" ON public.jobs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.company_details cd
        WHERE cd.id = jobs.company_id AND cd.user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
);

-- Applications RLS
CREATE POLICY "View Applications (Owner or Employer)" ON public.applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.professional_details pd WHERE pd.id = applications.professional_id AND pd.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.jobs j JOIN public.company_details cd ON j.company_id = cd.id WHERE j.id = applications.job_id AND cd.user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
);
CREATE POLICY "Submit Application (Professional only)" ON public.applications FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.professional_details pd WHERE pd.id = applications.professional_id AND pd.user_id = auth.uid()
    )
);
CREATE POLICY "Update Application (Status or Withdrawal)" ON public.applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.professional_details pd WHERE pd.id = applications.professional_id AND pd.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.jobs j JOIN public.company_details cd ON j.company_id = cd.id WHERE j.id = applications.job_id AND cd.user_id = auth.uid()
    )
);

-- Services RLS
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Manage Services" ON public.services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.professional_details pd WHERE pd.id = services.professional_id AND pd.user_id = auth.uid()
    )
);

-- Reviews RLS
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Write Review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Manage Review (Owner or Admin)" ON public.reviews FOR ALL USING (auth.uid() = reviewer_id OR public.is_admin(auth.uid()));

-- Notifications RLS
CREATE POLICY "Access Self Notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Reports RLS
CREATE POLICY "Submit Reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Manage Reports (Admin only)" ON public.reports FOR ALL USING (public.is_admin(auth.uid()));

-- PROFILE SYNC TRIGGER (When user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, avatar_cloudinary_url, phone, created_at)
    VALUES (
        new.id,
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'professional'::user_role),
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.raw_user_meta_data->>'avatar_cloudinary_url',
        new.raw_user_meta_data->>'phone',
        now()
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
