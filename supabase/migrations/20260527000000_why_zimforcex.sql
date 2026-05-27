-- 1. Update profiles table
ALTER TABLE public.profiles
ADD COLUMN target_role text,
ADD COLUMN experience_level text check (experience_level in ('entry', 'mid', 'senior', 'executive')) default 'entry',
ADD COLUMN open_to_mentoring boolean default false,
ADD COLUMN is_public boolean default true,
ADD COLUMN show_connections boolean default true,
ADD COLUMN show_skills boolean default true;

-- 2. Create skill_endorsements table
CREATE TABLE public.skill_endorsements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  endorser_id uuid references public.profiles(id) on delete cascade not null,
  endorsee_id uuid references public.profiles(id) on delete cascade not null,
  skill text not null,
  unique(endorser_id, endorsee_id, skill)
);

-- Enable RLS
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Policies for endorsements
CREATE POLICY "Public can view endorsements" ON public.skill_endorsements
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.can_endorse(endorser uuid, endorsee uuid)
RETURNS boolean AS $$
DECLARE
  is_connected boolean;
  has_power boolean;
BEGIN
  -- Check if they are connected
  SELECT EXISTS (
    SELECT 1 FROM public.connections 
    WHERE status = 'accepted' 
      AND ((sender_id = endorser AND receiver_id = endorsee) OR (sender_id = endorsee AND receiver_id = endorser))
  ) INTO is_connected;

  IF NOT is_connected THEN
    RETURN false;
  END IF;

  -- Check if endorser has power: experience_level in ('senior', 'executive') OR has verified credentials
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.credentials c ON c.user_id = p.id AND c.verification_status = 'verified'
    WHERE p.id = endorser AND (p.experience_level IN ('senior', 'executive') OR c.id IS NOT NULL)
  ) INTO has_power;

  RETURN has_power;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can endorse if they have power and are connected" ON public.skill_endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id AND public.can_endorse(auth.uid(), endorsee_id));

CREATE POLICY "Users can delete their own endorsements" ON public.skill_endorsements
  FOR DELETE USING (auth.uid() = endorser_id);

-- 3. Create profile_views table
CREATE TABLE public.profile_views (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  viewer_id uuid references public.profiles(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade not null
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views" ON public.profile_views
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can insert profile views" ON public.profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 4. Create match_jobs RPC
CREATE OR REPLACE FUNCTION public.match_jobs(p_user_id uuid)
RETURNS TABLE (
  job_id uuid,
  title text,
  description text,
  location text,
  salary_min integer,
  salary_max integer,
  currency text,
  job_type text,
  experience_level text,
  posted_by uuid,
  created_at timestamp with time zone,
  skills_required text[],
  match_percentage integer,
  is_target_role boolean
) AS $$
DECLARE
  v_user_skills text[];
  v_target_role text;
BEGIN
  -- Get user skills and target role
  SELECT skills, target_role INTO v_user_skills, v_target_role
  FROM public.profiles
  WHERE id = p_user_id;

  -- Default to empty array if null
  IF v_user_skills IS NULL THEN
    v_user_skills := ARRAY[]::text[];
  END IF;

  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.description,
    j.location,
    j.salary_min,
    j.salary_max,
    j.currency,
    j.job_type,
    j.experience_level,
    j.posted_by,
    j.created_at,
    j.skills_required,
    -- Calculate match percentage
    CASE 
      WHEN array_length(j.skills_required, 1) IS NULL OR array_length(j.skills_required, 1) = 0 THEN 0
      ELSE (
        SELECT (count(*)::float / array_length(j.skills_required, 1)::float * 100)::integer
        FROM unnest(j.skills_required) AS req_skill
        WHERE req_skill = ANY(v_user_skills)
      )
    END AS match_percentage,
    -- Check if it matches target role (case insensitive partial match)
    (v_target_role IS NOT NULL AND j.title ILIKE '%' || v_target_role || '%') AS is_target_role
  FROM public.jobs j
  WHERE j.status = 'active'
  ORDER BY 
    is_target_role DESC, 
    match_percentage DESC, 
    j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
