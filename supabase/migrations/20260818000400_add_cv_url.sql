ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS cv_url text;
