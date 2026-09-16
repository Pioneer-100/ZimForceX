-- Update the trigger function to capture role from metadata
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
    location,
    role
  )
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    (new.raw_user_meta_data->>'dob')::date,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'location',
    coalesce(new.raw_user_meta_data->>'role', 'job_seeker')
  );
  return new;
end;
$$ language plpgsql security definer;
