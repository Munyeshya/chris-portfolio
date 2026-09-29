CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160),
  role ENUM('client', 'admin') NOT NULL DEFAULT 'client',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id CHAR(36) PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  client_name VARCHAR(160) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  email VARCHAR(320) NOT NULL,
  company VARCHAR(200),
  project_name VARCHAR(240) NOT NULL,
  project_type ENUM('event', 'non-event') NOT NULL,
  services JSON NOT NULL,
  brief TEXT NOT NULL,
  event_date DATE,
  event_end_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(500),
  delivery_deadline DATE,
  package_choice VARCHAR(240),
  custom_requirements TEXT,
  estimated_budget VARCHAR(160),
  notes TEXT,
  status ENUM('submitted', 'under_review', 'quoted', 'contract_sent', 'deposit_pending', 'confirmed', 'in_production', 'client_review', 'completed', 'cancelled') NOT NULL DEFAULT 'submitted',
  assigned_to CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX booking_status_idx (status),
  INDEX booking_email_idx (email),
  CONSTRAINT booking_assignee_fk FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS booking_files (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(160),
  size_bytes BIGINT NOT NULL,
  contents LONGBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT booking_file_fk FOREIGN KEY (booking_id) REFERENCES booking_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id CHAR(36) PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  size_bytes BIGINT NOT NULL,
  contents LONGBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_team (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(240) NOT NULL DEFAULT '',
  photo_media_id CHAR(36),
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT team_media_fk FOREIGN KEY (photo_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS website_partners (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  logo_url TEXT NOT NULL,
  knockout BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_work (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  external_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  video_url TEXT,
  categories JSON NOT NULL,
  width INT DEFAULT 1600,
  height INT DEFAULT 1067,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_quotations (
  booking_id CHAR(36) PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  size_bytes BIGINT NOT NULL,
  contents LONGBLOB NOT NULL,
  uploaded_by CHAR(36),
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT quotation_booking_fk FOREIGN KEY (booking_id) REFERENCES booking_requests(id) ON DELETE CASCADE,
  CONSTRAINT quotation_uploader_fk FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
