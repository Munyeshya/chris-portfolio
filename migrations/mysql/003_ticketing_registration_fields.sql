alter table ticketing_events
  add column registration_fields json null after registration_deadline;

alter table event_attendees
  add column registration_data json null after phone;
