UPDATE users SET role = 'client' WHERE role = 'staff';

ALTER TABLE users
  MODIFY COLUMN role ENUM('client','admin') NOT NULL DEFAULT 'client';
