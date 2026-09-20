ALTER TABLE ticketing_events
  ADD COLUMN image_media_id CHAR(36) NULL AFTER registration_fields,
  ADD COLUMN image_url TEXT NULL AFTER image_media_id;
