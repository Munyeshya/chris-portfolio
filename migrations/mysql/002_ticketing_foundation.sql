create table if not exists organizer_accounts (
  id char(36) primary key,
  user_id char(36) not null unique,
  organization_name varchar(240) not null,
  phone varchar(80),
  reason text,
  status enum('pending','approved','rejected','suspended') not null default 'pending',
  reviewed_by char(36),
  reviewed_at timestamp null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint organizer_user_fk foreign key (user_id) references users(id) on delete cascade,
  constraint organizer_reviewer_fk foreign key (reviewed_by) references users(id) on delete set null
);

create table if not exists ticketing_events (
  id char(36) primary key,
  organizer_id char(36) not null,
  title varchar(300) not null,
  description text,
  venue varchar(500) not null,
  starts_at datetime not null,
  ends_at datetime null,
  capacity int unsigned not null,
  registration_deadline datetime null,
  status enum('draft','published','closed','cancelled') not null default 'draft',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index ticketing_event_status_date_idx(status,starts_at),
  constraint event_organizer_fk foreign key (organizer_id) references organizer_accounts(id) on delete cascade
);

create table if not exists event_attendees (
  id char(36) primary key,
  event_id char(36) not null,
  ticket_code varchar(60) not null unique,
  qr_token varchar(100) not null unique,
  full_name varchar(180) not null,
  email varchar(320) not null,
  phone varchar(80),
  status enum('registered','cancelled','checked_in') not null default 'registered',
  checked_in_at timestamp null,
  checked_in_by char(36),
  created_at timestamp not null default current_timestamp,
  unique key event_attendee_email_unique(event_id,email),
  index attendee_event_name_idx(event_id,full_name),
  constraint attendee_event_fk foreign key (event_id) references ticketing_events(id) on delete cascade,
  constraint attendee_checkin_user_fk foreign key (checked_in_by) references users(id) on delete set null
);
