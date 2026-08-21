-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update Self Profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert Self Profile" ON public.profiles;

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Update Self Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Insert Self Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Professional Details Table Policies
DROP POLICY IF EXISTS "Public Read Professional Details" ON public.professional_details;
DROP POLICY IF EXISTS "Manage Self Professional Details" ON public.professional_details;
DROP POLICY IF EXISTS "Select Self Professional Details" ON public.professional_details;
DROP POLICY IF EXISTS "Insert Self Professional Details" ON public.professional_details;
DROP POLICY IF EXISTS "Update Self Professional Details" ON public.professional_details;
DROP POLICY IF EXISTS "Delete Self Professional Details" ON public.professional_details;

CREATE POLICY "Public Read Professional Details" ON public.professional_details FOR SELECT USING (true);
CREATE POLICY "Insert Self Professional Details" ON public.professional_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update Self Professional Details" ON public.professional_details FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete Self Professional Details" ON public.professional_details FOR DELETE USING (auth.uid() = user_id);

-- 3. Company Details Table Policies
DROP POLICY IF EXISTS "Public Read Company Details" ON public.company_details;
DROP POLICY IF EXISTS "Manage Self Company Details" ON public.company_details;
DROP POLICY IF EXISTS "Select Self Company Details" ON public.company_details;
DROP POLICY IF EXISTS "Insert Self Company Details" ON public.company_details;
DROP POLICY IF EXISTS "Update Self Company Details" ON public.company_details;
DROP POLICY IF EXISTS "Delete Self Company Details" ON public.company_details;

CREATE POLICY "Public Read Company Details" ON public.company_details FOR SELECT USING (true);
CREATE POLICY "Insert Self Company Details" ON public.company_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update Self Company Details" ON public.company_details FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete Self Company Details" ON public.company_details FOR DELETE USING (auth.uid() = user_id);
