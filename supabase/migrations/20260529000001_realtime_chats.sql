-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_status boolean default false
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Security Policies
create policy "Users can view chats they're involved in" on public.chat_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages as themselves" on public.chat_messages
  for insert with check (auth.uid() = sender_id);

-- Enable Realtime replication for chat messages
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.chat_messages;
