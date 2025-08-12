-- Add preferred language column to users
-- Safe to run multiple times

alter table users
  add column if not exists language varchar(8);

-- Optional: basic index for filtering/reporting
create index if not exists idx_users_language on users(language);


