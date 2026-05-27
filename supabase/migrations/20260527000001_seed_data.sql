-- Dummy Data Seed Script for Testing Purposes
-- This populates auth.users, profiles, connections, jobs, applications, credentials, verifications, endorsements, and profile views.

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ 
DECLARE
  employer_id uuid := 'e0000000-0000-0000-0000-000000000001';
  seeker1_id uuid := 'e0000000-0000-0000-0000-000000000002';
  seeker2_id uuid := 'e0000000-0000-0000-0000-000000000003';
  job1_id uuid;
  job2_id uuid;
  cred1_id uuid;
  cred2_id uuid;
BEGIN
  -- Delete existing users to ensure clean slate (and avoid conflict)
  DELETE FROM auth.users WHERE id IN (employer_id, seeker1_id, seeker2_id);

  -- 1. Insert Auth Users with correct structures for modern GoTrue (with empty strings instead of NULLs for token fields and with identities linked)
  INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin,
    is_sso_user
  )
  VALUES 
    (
      employer_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      'employer@test.com', 
      crypt('password123', gen_salt('bf')), 
      now(), 
      '{"provider":"email","providers":["email"]}'::jsonb, 
      '{"full_name":"Acme Corp HR"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      false
    ),
    (
      seeker1_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      'john.doe@test.com', 
      crypt('password123', gen_salt('bf')), 
      now(), 
      '{"provider":"email","providers":["email"]}'::jsonb, 
      '{"full_name":"John Doe"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      false
    ),
    (
      seeker2_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      'jane.smith@test.com', 
      crypt('password123', gen_salt('bf')), 
      now(), 
      '{"provider":"email","providers":["email"]}'::jsonb, 
      '{"full_name":"Jane Smith"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      false
    );

  -- 2. Link Identities so they can log in
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      employer_id,
      employer_id,
      format('{"sub": "%s", "email": "employer@test.com"}', employer_id::text)::jsonb,
      'email',
      employer_id::text,
      now(),
      now(),
      now()
    ),
    (
      seeker1_id,
      seeker1_id,
      format('{"sub": "%s", "email": "john.doe@test.com"}', seeker1_id::text)::jsonb,
      'email',
      seeker1_id::text,
      now(),
      now(),
      now()
    ),
    (
      seeker2_id,
      seeker2_id,
      format('{"sub": "%s", "email": "jane.smith@test.com"}', seeker2_id::text)::jsonb,
      'email',
      seeker2_id::text,
      now(),
      now(),
      now()
    );

  -- 2. Update Profiles (since they were created automatically by the auth trigger)
  UPDATE public.profiles 
  SET role = 'employer', bio = 'Tech recruiter at Acme Corp.', location = 'Harare, Zimbabwe', experience_level = 'senior'
  WHERE id = employer_id;

  UPDATE public.profiles 
  SET role = 'job_seeker', bio = 'Full-stack developer passionate about React and Node.js.', location = 'Bulawayo, Zimbabwe', skills = ARRAY['React', 'Node.js', 'TypeScript', 'SQL'], target_role = 'Full Stack Developer', experience_level = 'mid', open_to_mentoring = true
  WHERE id = seeker1_id;

  UPDATE public.profiles 
  SET role = 'job_seeker', bio = 'UI/UX Designer focused on accessibility and glassmorphism.', location = 'Harare, Zimbabwe', skills = ARRAY['Figma', 'UI Design', 'CSS', 'React'], target_role = 'UI/UX Designer', experience_level = 'senior', open_to_mentoring = true
  WHERE id = seeker2_id;

  -- 3. Create Connections
  INSERT INTO public.connections (sender_id, receiver_id, status)
  VALUES 
    (seeker1_id, seeker2_id, 'accepted'),
    (employer_id, seeker1_id, 'accepted'),
    (seeker2_id, employer_id, 'pending')
  ON CONFLICT (sender_id, receiver_id) DO NOTHING;

  -- 4. Create Jobs
  INSERT INTO public.jobs (posted_by, title, description, location, salary_min, salary_max, currency, job_type, experience_level, skills_required, status)
  VALUES 
    (employer_id, 'Senior React Developer', 'Looking for an experienced React developer to build modern web apps.', 'Remote', 3000, 5000, 'USD', 'full_time', 'senior', ARRAY['React', 'TypeScript', 'Next.js'], 'active')
  RETURNING id INTO job1_id;

  INSERT INTO public.jobs (posted_by, title, description, location, salary_min, salary_max, currency, job_type, experience_level, skills_required, status)
  VALUES 
    (employer_id, 'Creative UI/UX Designer', 'Join our team to design beautiful interfaces.', 'Harare, Zimbabwe', 1500, 2500, 'USD', 'full_time', 'mid', ARRAY['Figma', 'UI Design', 'User Research'], 'active')
  RETURNING id INTO job2_id;

  -- 5. Create Credentials & Verifications
  INSERT INTO public.credentials (user_id, credential_type, title, issuing_organization, verification_status)
  VALUES (seeker1_id, 'degree', 'BSc Computer Science', 'University of Zimbabwe', 'verified')
  RETURNING id INTO cred1_id;

  INSERT INTO public.verifications (credential_id, verification_status, ai_confidence_score, verification_details)
  VALUES (cred1_id, 'valid', 0.98, '{"message": "Verified against transcript"}');

  INSERT INTO public.credentials (user_id, credential_type, title, issuing_organization, verification_status)
  VALUES (seeker2_id, 'certificate', 'Advanced UI/UX Design', 'Coursera', 'verified')
  RETURNING id INTO cred2_id;

  INSERT INTO public.verifications (credential_id, verification_status, ai_confidence_score, verification_details)
  VALUES (cred2_id, 'valid', 0.95, '{"message": "Verified via Coursera API"}');

  -- 6. Create Applications
  INSERT INTO public.applications (job_id, applicant_id, cover_letter, status)
  VALUES 
    (job1_id, seeker1_id, 'I have 5 years of experience with React.', 'reviewed'),
    (job2_id, seeker2_id, 'Here is my portfolio showcasing my UI designs.', 'submitted')
  ON CONFLICT (job_id, applicant_id) DO NOTHING;

  -- 7. Create Skill Endorsements
  INSERT INTO public.skill_endorsements (endorser_id, endorsee_id, skill)
  VALUES 
    (seeker2_id, seeker1_id, 'React'),
    (employer_id, seeker1_id, 'TypeScript'),
    (seeker1_id, seeker2_id, 'Figma')
  ON CONFLICT (endorser_id, endorsee_id, skill) DO NOTHING;

  -- 8. Create Profile Views
  INSERT INTO public.profile_views (viewer_id, profile_id)
  VALUES 
    (employer_id, seeker1_id),
    (employer_id, seeker1_id),
    (seeker2_id, seeker1_id),
    (employer_id, seeker2_id);

  RAISE NOTICE 'Database successfully seeded with testing data.';
END $$;
