-- Dashboard roles, policies, and dynamic public website content.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('client','staff','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,full_name)
  values (new.id,new.email,new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id,email,full_name)
select id,email,raw_user_meta_data->>'full_name' from auth.users
on conflict (id) do nothing;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('staff','admin'));
$$;

create table public.website_team (
  id uuid primary key default gen_random_uuid(), name text not null, role text default '', photo_url text default '',
  sort_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.website_partners (
  id uuid primary key default gen_random_uuid(), name text not null, logo_url text not null, knockout boolean not null default false,
  sort_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.website_work (
  id uuid primary key default gen_random_uuid(), title text not null, external_url text not null, image_url text not null,
  categories text[] not null default '{}', width integer default 1600, height integer default 1067,
  sort_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

insert into public.website_team (name,role,photo_url,sort_order) values
('Chris','','/team/chris.jpeg',1),('Cedrick','','/team/cedrick.jpeg',2),('Beni','','/team/beni.jpeg',3),('Ntwari','','/team/ntwari.jpeg',4);

insert into public.website_partners (name,logo_url,knockout,sort_order) values
('Agakiza Investment Group Ltd','/partners/agakiza.jpeg',false,1),('Bohoka TV','/partners/bohoka.png',false,2),
('Beloved Souls','/partners/boloved.png',true,3),('Inkuru Factory','/partners/inkuru.png',false,4),
('Iyaaka Beauty Saloon','/partners/IYAAKA%20BEAUTY%20SALOON%20logo.png',false,5),('Chorale Umushumba Mwiza','/partners/umushumba.png',false,6);

insert into public.website_work (title,external_url,image_url,categories,sort_order) values
('Book launch : Rising with Dignity by Joy Uwanziga','https://www.flickr.com/photos/196950681@N03/albums/72177720335395383','/portfolio/55499778600.jpg',array['Photography'],1),
('Kigali Twataramye 3rd edition','https://www.flickr.com/photos/196950681@N03/albums/72177720335314989','/portfolio/55487392634.jpg',array['Photography','Events & LED Displays'],2),
('kigali Youth Festival','https://www.flickr.com/photos/196950681@N03/albums/72177720332543364','/portfolio/55146382924.jpg',array['Photography','Events & LED Displays'],3),
('The Kigali Countdown Festivals (Igisope)','https://www.flickr.com/photos/196950681@N03/albums/72177720332513746','/portfolio/55146453605.jpg',array['Photography','Events & LED Displays'],4),
('CFA Investment','https://www.flickr.com/photos/196950681@N03/albums/72177720323625247','/portfolio/54307746242.jpg',array['Photography'],5),
('Kigali Triennial 2024_photo','https://www.flickr.com/photos/196950681@N03/albums/72177720320431280','/portfolio/54006086584.jpg',array['Photography'],6),
('Rwanda National Seed Congress 2024','https://www.flickr.com/photos/196950681@N03/albums/72177720320387721','/portfolio/54001835913.jpg',array['Photography'],7),
('EJO Heza 3x3 games by RSSB','https://www.flickr.com/photos/196950681@N03/albums/72177720320405594','/portfolio/54001519166.jpg',array['Photography'],8),
('CAASymposium2024','https://www.flickr.com/photos/196950681@N03/albums/72177720320386741','/portfolio/54001506426.jpg',array['Photography'],9);

alter table public.profiles enable row level security;
alter table public.website_team enable row level security;
alter table public.website_partners enable row level security;
alter table public.website_work enable row level security;

create policy "profile owner reads profile" on public.profiles for select using (id=auth.uid() or public.is_staff());
create policy "admins update profiles" on public.profiles for update using (public.is_staff()) with check (public.is_staff());
create policy "public reads active team" on public.website_team for select using (active or public.is_staff());
create policy "staff manages team" on public.website_team for all using (public.is_staff()) with check (public.is_staff());
create policy "public reads active partners" on public.website_partners for select using (active or public.is_staff());
create policy "staff manages partners" on public.website_partners for all using (public.is_staff()) with check (public.is_staff());
create policy "public reads active work" on public.website_work for select using (active or public.is_staff());
create policy "staff manages work" on public.website_work for all using (public.is_staff()) with check (public.is_staff());

create policy "staff reads bookings" on public.booking_requests for select using (public.is_staff());
create policy "staff updates bookings" on public.booking_requests for update using (public.is_staff()) with check (public.is_staff());
create policy "staff reads booking files" on public.booking_files for select using (public.is_staff());
create policy "staff manages quotations" on public.quotations for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manages contracts" on public.contracts for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manages invoices" on public.invoices for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manages payments" on public.payments for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manages projects" on public.projects for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manages messages" on public.booking_messages for all using (public.is_staff()) with check (public.is_staff());
create policy "staff reads audit" on public.audit_log for select using (public.is_staff());

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger website_team_updated_at before update on public.website_team for each row execute function public.set_updated_at();
create trigger website_partners_updated_at before update on public.website_partners for each row execute function public.set_updated_at();
create trigger website_work_updated_at before update on public.website_work for each row execute function public.set_updated_at();
