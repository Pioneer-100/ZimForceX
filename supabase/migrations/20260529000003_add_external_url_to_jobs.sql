-- Add external_url, source_site, and company_name to jobs table for aggregated external jobs
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS source_site text,
ADD COLUMN IF NOT EXISTS company_name text;

-- Add index on external_url to quickly prevent duplicate imports
CREATE INDEX IF NOT EXISTS idx_jobs_external_url ON public.jobs(external_url);
