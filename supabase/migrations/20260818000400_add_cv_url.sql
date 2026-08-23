ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS cv_url text;

ALTER TABLE public.professional_details 
ADD COLUMN IF NOT EXISTS availability BOOLEAN NOT NULL DEFAULT TRUE;
