create extension if not exists pgcrypto;

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(), reference text unique not null,
  client_name text not null, phone text not null, email text not null, company text,
  project_name text not null, project_type text not null check (project_type in ('event','non-event')),
  services text[] not null check (cardinality(services) > 0), brief text not null,
  event_date date, start_time time, end_time time, location text, delivery_deadline date,
  package_choice text, custom_requirements text, estimated_budget text, notes text,
  status text not null default 'submitted' check (status in ('submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled')),
  assigned_to uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((project_type='event' and event_date is not null and start_time is not null and end_time is not null and location is not null) or (project_type='non-event' and delivery_deadline is not null))
);

create table public.booking_files (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id) on delete cascade,
  object_path text unique not null, original_name text not null, mime_type text, size_bytes bigint not null check (size_bytes >= 0),
  file_kind text not null default 'reference' check (file_kind in ('reference','contract','invoice','proof_of_payment','draft','final_delivery')),
  created_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id) on delete cascade,
  version integer not null default 1, currency text not null default 'RWF', subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0, total numeric(14,2) not null default 0, details jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired')), expires_at timestamptz, created_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id) on delete cascade,
  quotation_id uuid references public.quotations(id), status text not null default 'draft' check (status in ('draft','sent','signed','void')),
  signed_at timestamptz, created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id) on delete cascade,
  invoice_number text unique not null, currency text not null default 'RWF', amount numeric(14,2) not null, amount_paid numeric(14,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partially_paid','paid','overdue','void')), due_at timestamptz, created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade,
  provider text not null, provider_reference text, amount numeric(14,2) not null,
  status text not null default 'pending' check (status in ('pending','verified','failed','refunded')),
  verified_by uuid references auth.users(id), verified_at timestamptz, created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), booking_id uuid unique not null references public.booking_requests(id) on delete cascade,
  progress smallint not null default 0 check (progress between 0 and 100), phase text not null default 'planning', internal_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.booking_messages (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id) on delete cascade,
  sender_id uuid references auth.users(id), sender_type text not null check (sender_type in ('client','staff','system')),
  message text not null, created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id), entity_type text not null,
  entity_id uuid, action text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;
alter table public.booking_files enable row level security;
alter table public.quotations enable row level security;
alter table public.contracts enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.projects enable row level security;
alter table public.booking_messages enable row level security;
alter table public.audit_log enable row level security;

insert into storage.buckets (id,name,public,file_size_limit) values ('booking-references','booking-references',false,10485760)
on conflict (id) do update set public=false,file_size_limit=10485760;

create index booking_requests_status_idx on public.booking_requests(status);
create index booking_requests_event_date_idx on public.booking_requests(event_date);
create index booking_requests_email_idx on public.booking_requests(lower(email));
create index booking_files_booking_idx on public.booking_files(booking_id);
create index quotations_booking_idx on public.quotations(booking_id);
create index invoices_booking_idx on public.invoices(booking_id);
create index messages_booking_idx on public.booking_messages(booking_id,created_at);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
create trigger booking_requests_updated_at before update on public.booking_requests for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

-- Public submissions go through the validated Node API. Staff/client RLS policies
-- will be added together with authentication and the management portal.
