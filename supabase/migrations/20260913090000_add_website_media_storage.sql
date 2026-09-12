insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-media','website-media',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

create policy "staff uploads website media" on storage.objects for insert to authenticated
with check (bucket_id='website-media' and public.is_staff());
create policy "staff updates website media" on storage.objects for update to authenticated
using (bucket_id='website-media' and public.is_staff()) with check (bucket_id='website-media' and public.is_staff());
create policy "staff deletes website media" on storage.objects for delete to authenticated
using (bucket_id='website-media' and public.is_staff());
