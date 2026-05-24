-- Seed file to populate test jobs in the jobs table
-- You can run this in your Supabase SQL Editor

DO $$ 
DECLARE
  test_user_id uuid;
BEGIN
  -- Try to find an existing user who is an employer
  SELECT id INTO test_user_id FROM public.profiles WHERE role = 'employer' LIMIT 1;
  
  -- If no employer exists, try to find any user and make them an employer
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM public.profiles LIMIT 1;
    IF test_user_id IS NOT NULL THEN
      UPDATE public.profiles SET role = 'employer' WHERE id = test_user_id;
    END IF;
  END IF;

  -- If we found a user, insert test jobs for them
  IF test_user_id IS NOT NULL THEN
    -- Clear existing test jobs if you want to run this multiple times without duplication
    -- (Optional, uncomment if needed)
    -- DELETE FROM public.jobs WHERE posted_by = test_user_id;

    INSERT INTO public.jobs (
      posted_by, title, description, location, 
      salary_min, salary_max, currency, job_type, 
      experience_level, skills_required, status
    )
    VALUES 
    (
      test_user_id, 
      'Senior Full-Stack Developer', 
      'We are looking for a senior full-stack developer to lead our engineering team. You will be building cutting-edge web applications using Next.js, Supabase, and Tailwind CSS. The ideal candidate has experience with scalable architectures.', 
      'Harare, Zimbabwe', 
      3000, 5000, 'USD', 'full_time', 
      'senior', ARRAY['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Supabase'], 'active'
    ),
    (
      test_user_id, 
      'Marketing Manager', 
      'Exciting opportunity for a Marketing Manager to join our fast-growing startup. You will be responsible for defining our digital marketing strategy, managing campaigns, and driving user acquisition across multiple channels.', 
      'Remote', 
      1500, 2500, 'USD', 'remote', 
      'mid', ARRAY['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media'], 'active'
    ),
    (
      test_user_id, 
      'DevOps Engineer', 
      'Looking for a talented DevOps engineer to manage our cloud infrastructure and optimize our CI/CD pipelines. You will ensure high availability and performance of our services.', 
      'Bulawayo, Zimbabwe', 
      2500, 4000, 'USD', 'full_time', 
      'mid', ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'], 'active'
    ),
    (
      test_user_id, 
      'Junior UI/UX Designer', 
      'Join our creative team to design beautiful, glassmorphic, and intuitive user interfaces. You will work closely with developers to bring your designs to life. A portfolio of recent work is required.', 
      'Harare, Zimbabwe', 
      800, 1500, 'USD', 'part_time', 
      'entry', ARRAY['Figma', 'UI Design', 'User Research', 'Prototyping'], 'active'
    ),
    (
      test_user_id, 
      'Data Analyst', 
      'We need a data analyst to interpret complex datasets and provide actionable insights for our business operations. Experience with SQL and building dashboards is essential.', 
      'Mutare, Zimbabwe', 
      1200, 2000, 'USD', 'contract', 
      'mid', ARRAY['SQL', 'Python', 'Data Visualization', 'Tableau'], 'active'
    );
    
    RAISE NOTICE 'Test jobs successfully inserted.';
  ELSE
    RAISE EXCEPTION 'No users found in the profiles table. Please sign up at least one user first.';
  END IF;
END $$;
