-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  location text,
  skills text[],
  role text check (role in ('job_seeker', 'employer', 'admin')) default 'job_seeker'
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create connections table
create table public.connections (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  unique(sender_id, receiver_id)
);

-- Enable RLS
alter table public.connections enable row level security;

-- Create policies
create policy "Users can view their own connections" on public.connections
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can create connection requests" on public.connections
  for insert with check (auth.uid() = sender_id);

create policy "Users can update connections they're involved in" on public.connections
  for update using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  posted_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  location text not null,
  salary_min integer,
  salary_max integer,
  currency text default 'ZWL',
  job_type text check (job_type in ('full_time', 'part_time', 'contract', 'remote')) not null,
  experience_level text check (experience_level in ('entry', 'mid', 'senior', 'executive')) default 'mid',
  skills_required text[],
  status text check (status in ('active', 'closed', 'draft')) default 'active',
  applications_count integer default 0
);

-- Enable RLS
alter table public.jobs enable row level security;

-- Create policies
create policy "Public jobs are viewable by everyone" on public.jobs
  for select using (status = 'active');

create policy "Users can view all jobs including their own" on public.jobs
  for select using (true);

create policy "Employers can create jobs" on public.jobs
  for insert with check (auth.uid() = posted_by and (select role from public.profiles where id = auth.uid()) = 'employer');

create policy "Employers can update their own jobs" on public.jobs
  for update using (auth.uid() = posted_by);

-- Create job applications table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  cover_letter text,
  resume_url text,
  status text check (status in ('submitted', 'reviewed', 'accepted', 'rejected')) default 'submitted',
  unique(job_id, applicant_id)
);

-- Enable RLS
alter table public.applications enable row level security;

-- Create policies
create policy "Users can view their own applications" on public.applications
  for select using (auth.uid() = applicant_id);

create policy "Employers can view applications for their jobs" on public.applications
  for select using (auth.uid() = (select posted_by from public.jobs where id = job_id));

create policy "Job seekers can apply for jobs" on public.applications
  for insert with check (auth.uid() = applicant_id);

create policy "Users can update their own applications" on public.applications
  for update using (auth.uid() = applicant_id);

create policy "Employers can update application status" on public.applications
  for update using (auth.uid() = (select posted_by from public.jobs where id = job_id));