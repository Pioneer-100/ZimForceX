-- Create work_experiences table
create table if not exists public.work_experiences (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  company text not null,
  role text not null,
  start_date date not null,
  end_date text default 'Present',
  description text
);

-- Enable RLS
alter table public.work_experiences enable row level security;

-- Create Security Policies
create policy "Work experiences are viewable by everyone" on public.work_experiences
  for select using (true);

create policy "Users can insert their own work experiences" on public.work_experiences
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own work experiences" on public.work_experiences
  for update using (auth.uid() = user_id);

create policy "Users can delete their own work experiences" on public.work_experiences
  for delete using (auth.uid() = user_id);
