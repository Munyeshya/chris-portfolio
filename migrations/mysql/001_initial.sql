create table if not exists users (
  id char(36) primary key, email varchar(320) not null unique, password_hash varchar(255) not null,
  full_name varchar(160), role enum('client','staff','admin') not null default 'client',
  created_at timestamp not null default current_timestamp, updated_at timestamp not null default current_timestamp on update current_timestamp
);

create table if not exists booking_requests (
  id char(36) primary key, reference varchar(40) not null unique, client_name varchar(160) not null,
  phone varchar(80) not null, email varchar(320) not null, company varchar(200), project_name varchar(240) not null,
  project_type enum('event','non-event') not null, services json not null, brief text not null,
  event_date date, start_time time, end_time time, location varchar(500), delivery_deadline date,
  package_choice varchar(240), custom_requirements text, estimated_budget varchar(160), notes text,
  status enum('submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled') not null default 'submitted',
  assigned_to char(36), created_at timestamp not null default current_timestamp, updated_at timestamp not null default current_timestamp on update current_timestamp,
  index booking_status_idx(status), index booking_email_idx(email), constraint booking_assignee_fk foreign key (assigned_to) references users(id) on delete set null
);

create table if not exists booking_files (
  id char(36) primary key, booking_id char(36) not null, original_name varchar(500) not null,
  mime_type varchar(160), size_bytes bigint not null, contents longblob not null, created_at timestamp not null default current_timestamp,
  constraint booking_file_fk foreign key (booking_id) references booking_requests(id) on delete cascade
);

create table if not exists website_team (
  id char(36) primary key, name varchar(160) not null, role varchar(240) not null default '', photo_media_id char(36), photo_url text,
  sort_order int not null default 0, active boolean not null default true,
  created_at timestamp not null default current_timestamp, updated_at timestamp not null default current_timestamp on update current_timestamp
);
create table if not exists website_partners (
  id char(36) primary key, name varchar(200) not null, logo_url text not null, knockout boolean not null default false,
  sort_order int not null default 0, active boolean not null default true,
  created_at timestamp not null default current_timestamp, updated_at timestamp not null default current_timestamp on update current_timestamp
);
create table if not exists website_work (
  id char(36) primary key, title varchar(300) not null, external_url text not null, image_url text not null,
  categories json not null, width int default 1600, height int default 1067, sort_order int not null default 0, active boolean not null default true,
  created_at timestamp not null default current_timestamp, updated_at timestamp not null default current_timestamp on update current_timestamp
);
create table if not exists media (
  id char(36) primary key, file_name varchar(500) not null, mime_type varchar(160) not null,
  size_bytes bigint not null, contents longblob not null, created_at timestamp not null default current_timestamp
);

insert ignore into website_team (id,name,role,photo_url,sort_order) values
(uuid(),'Chris','','/team/chris.jpeg',1),(uuid(),'Cedrick','','/team/cedrick.jpeg',2),(uuid(),'Beni','','/team/beni.jpeg',3),(uuid(),'Ntwari','','/team/ntwari.jpeg',4);
insert ignore into website_partners (id,name,logo_url,knockout,sort_order) values
(uuid(),'Agakiza Investment Group Ltd','/partners/agakiza.jpeg',false,1),(uuid(),'Bohoka TV','/partners/bohoka.png',false,2),
(uuid(),'Beloved Souls','/partners/boloved.png',true,3),(uuid(),'Inkuru Factory','/partners/inkuru.png',false,4),
(uuid(),'Iyaaka Beauty Saloon','/partners/IYAAKA%20BEAUTY%20SALOON%20logo.png',false,5),(uuid(),'Chorale Umushumba Mwiza','/partners/umushumba.png',false,6);
