-- Clean Start: Drop existing tables
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.portfolio_items CASCADE;
DROP TABLE IF EXISTS public.company_details CASCADE;
DROP TABLE IF EXISTS public.professional_details CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;

-- Create Enums
CREATE TYPE public.user_role AS ENUM ('visitor', 'professional', 'company', 'admin');
CREATE TYPE public.job_status AS ENUM ('open', 'closed');
CREATE TYPE public.application_status AS ENUM ('submitted', 'shortlisted', 'hired', 'rejected');

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'professional'::public.user_role,
    full_name TEXT NOT NULL,
    phone TEXT,
    age INT,
    address TEXT,
    city TEXT,
    avatar_cloudinary_url TEXT,
    suspended BOOLEAN NOT NULL DEFAULT false,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Professional Details Table
CREATE TABLE public.professional_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    skills TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    experience_years INT NOT NULL DEFAULT 0
);

-- 3. Company Details Table
CREATE TABLE public.company_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT '',
    industry TEXT DEFAULT '',
    description TEXT DEFAULT '',
    website TEXT DEFAULT '',
    logo_cloudinary_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT false
);

-- 4. Portfolio Items Table
CREATE TABLE public.portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Jobs Table
CREATE TABLE public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location_address TEXT NOT NULL,
    status public.job_status NOT NULL DEFAULT 'open'::public.job_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Job Applications Table
CREATE TABLE public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cover_note TEXT,
    status public.application_status NOT NULL DEFAULT 'submitted'::public.application_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (job_id, professional_id)
);

-- 7. Reviews Table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Notifications Table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Reports Table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'job', 'professional', 'review'
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'::public.user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert self profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update self profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));

-- Professional Details Policies
CREATE POLICY "Public read professional_details" ON public.professional_details FOR SELECT USING (true);
CREATE POLICY "Users can insert self professional_details" ON public.professional_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update self professional_details" ON public.professional_details FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access professional_details" ON public.professional_details FOR ALL USING (public.is_admin(auth.uid()));

-- Company Details Policies
CREATE POLICY "Public read company_details" ON public.company_details FOR SELECT USING (true);
CREATE POLICY "Users can insert self company_details" ON public.company_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update self company_details" ON public.company_details FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access company_details" ON public.company_details FOR ALL USING (public.is_admin(auth.uid()));

-- Portfolio Items Policies
CREATE POLICY "Public read portfolio_items" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Users can insert self portfolio_items" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete self portfolio_items" ON public.portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- Jobs Policies
CREATE POLICY "Public read jobs" ON public.jobs FOR SELECT USING (status = 'open'::public.job_status OR auth.uid() = company_id OR public.is_admin(auth.uid()));
CREATE POLICY "Companies can insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies can update jobs" ON public.jobs FOR UPDATE USING (auth.uid() = company_id) WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Admin full access jobs" ON public.jobs FOR ALL USING (public.is_admin(auth.uid()));

-- Job Applications Policies
CREATE POLICY "Companies and applicants read applications" ON public.job_applications FOR SELECT USING (
    auth.uid() = professional_id OR 
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()) OR
    public.is_admin(auth.uid())
);
CREATE POLICY "Professionals can insert applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "Applicants can delete applications" ON public.job_applications FOR DELETE USING (auth.uid() = professional_id);
CREATE POLICY "Companies and applicants update applications" ON public.job_applications FOR UPDATE USING (
    auth.uid() = professional_id OR 
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()) OR
    public.is_admin(auth.uid())
) WITH CHECK (
    auth.uid() = professional_id OR 
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Reviews Policies
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Admin full access reviews" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

-- Notifications Policies
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Reports Policies
CREATE POLICY "Admin read reports" ON public.reports FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated users can insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin update reports" ON public.reports FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Explicit grants to ensure roles have proper permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;
