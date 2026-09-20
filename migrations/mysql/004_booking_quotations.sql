create table if not exists booking_quotations (
  booking_id char(36) primary key,
  file_name varchar(500) not null,
  mime_type varchar(160) not null,
  size_bytes bigint not null,
  contents longblob not null,
  uploaded_by char(36),
  sent_at timestamp null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint quotation_booking_fk foreign key (booking_id) references booking_requests(id) on delete cascade,
  constraint quotation_uploader_fk foreign key (uploaded_by) references users(id) on delete set null
);
