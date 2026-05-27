-- Create the uploads bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Enable RLS for the objects table if not already enabled
alter table storage.objects enable row level security;

-- Policy to allow public viewing of objects in the uploads bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'uploads' );

-- Policy to allow authenticated users to upload files to the uploads bucket
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'uploads' and auth.role() = 'authenticated' );

-- Policy to allow users to update their own files
create policy "Users can update own files"
  on storage.objects for update
  using ( bucket_id = 'uploads' and auth.uid() = owner );

-- Policy to allow users to delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using ( bucket_id = 'uploads' and auth.uid() = owner );
