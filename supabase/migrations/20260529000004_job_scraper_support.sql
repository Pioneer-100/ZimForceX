-- Migration: 20260529000004_job_scraper_support.sql

-- 1. Ensure external job metadata columns exist
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS source_site text,
ADD COLUMN IF NOT EXISTS company_name text;

-- 2. Create index on external_url for fast duplicate checks
CREATE INDEX IF NOT EXISTS idx_jobs_external_url ON public.jobs(external_url);

-- 3. Create Security Definer RPC function to safely insert aggregated jobs
CREATE OR REPLACE FUNCTION public.insert_aggregated_job(
  p_title text,
  p_description text,
  p_location text,
  p_job_type text,
  p_experience_level text,
  p_skills_required text[],
  p_external_url text,
  p_source_site text,
  p_company_name text,
  p_posted_by uuid DEFAULT 'e0000000-0000-0000-0000-000000000001'::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id uuid;
  v_existing_id uuid;
BEGIN
  -- Check if job with same external_url or title already exists to prevent duplicates
  IF p_external_url IS NOT NULL AND p_external_url <> '' THEN
    SELECT id INTO v_existing_id FROM public.jobs WHERE external_url = p_external_url LIMIT 1;
  END IF;

  IF v_existing_id IS NULL THEN
    SELECT id INTO v_existing_id FROM public.jobs WHERE title = p_title LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'skipped', 'id', v_existing_id, 'reason', 'duplicate');
  END IF;

  -- Insert new aggregated job
  INSERT INTO public.jobs (
    posted_by,
    title,
    description,
    location,
    job_type,
    experience_level,
    skills_required,
    status,
    external_url,
    source_site,
    company_name
  ) VALUES (
    p_posted_by,
    p_title,
    p_description,
    p_location,
    p_job_type,
    p_experience_level,
    p_skills_required,
    'active',
    p_external_url,
    p_source_site,
    p_company_name
  ) RETURNING id INTO v_job_id;

  RETURN jsonb_build_object('status', 'inserted', 'id', v_job_id);
END;
$$;
