-- Mega Expansion Schema

-- 1. COURSES (Learning Hub)
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  provider text not null,
  url text not null,
  description text,
  image_url text,
  skills_taught text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Authenticated users can insert courses" on public.courses for insert with check (auth.role() = 'authenticated');

-- 2. MENTORSHIP SESSIONS
create table public.mentorship_sessions (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  mentee_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined', 'completed')) default 'pending' not null,
  meeting_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mentorship_sessions enable row level security;
create policy "Users can view their own mentorship sessions" on public.mentorship_sessions
  for select using (auth.uid() = mentor_id or auth.uid() = mentee_id);
create policy "Mentees can request mentorship" on public.mentorship_sessions
  for insert with check (auth.uid() = mentee_id);
create policy "Mentors and mentees can update sessions" on public.mentorship_sessions
  for update using (auth.uid() = mentor_id or auth.uid() = mentee_id);

-- 3. EVENTS
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  event_date timestamp with time zone not null,
  location text not null,
  event_type text check (event_type in ('online', 'in_person')) not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;
create policy "Events are viewable by everyone" on public.events for select using (true);
create policy "Authenticated users can create events" on public.events for insert with check (auth.role() = 'authenticated' and auth.uid() = organizer_id);

create table public.event_attendees (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rsvp_status text check (rsvp_status in ('going', 'maybe', 'declined')) default 'going' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;
create policy "Event attendees are viewable by everyone" on public.event_attendees for select using (true);
create policy "Users can RSVP to events" on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "Users can update their RSVP" on public.event_attendees for update using (auth.uid() = user_id);
create policy "Users can remove their RSVP" on public.event_attendees for delete using (auth.uid() = user_id);

-- 4. COMMUNITY FORUMS
create table public.forum_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  upvotes integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.forum_posts enable row level security;
create policy "Forum posts are viewable by everyone" on public.forum_posts for select using (true);
create policy "Authenticated users can post" on public.forum_posts for insert with check (auth.role() = 'authenticated' and auth.uid() = author_id);
create policy "Authors can update their posts" on public.forum_posts for update using (auth.uid() = author_id);

create table public.forum_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.forum_posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.forum_comments enable row level security;
create policy "Forum comments are viewable by everyone" on public.forum_comments for select using (true);
create policy "Authenticated users can comment" on public.forum_comments for insert with check (auth.role() = 'authenticated' and auth.uid() = author_id);
create policy "Authors can update their comments" on public.forum_comments for update using (auth.uid() = author_id);
