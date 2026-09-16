-- Add columns to public.profiles
alter table public.profiles
  add column if not exists dob date,
  add column if not exists gender text,
  add column if not exists phone_number text,
  add column if not exists email text,
  add column if not exists linkedin_url text,
  add column if not exists github_url text,
  add column if not exists past_experiences jsonb default '[]'::jsonb;

-- Update the new user creation handler function to set initial fields
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    full_name, 
    avatar_url, 
    email, 
    phone_number, 
    dob, 
    gender, 
    location
  )
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    (new.raw_user_meta_data->>'dob')::date,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'location'
  );
  return new;
end;
$$ language plpgsql security definer;
