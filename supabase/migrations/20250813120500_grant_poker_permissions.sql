-- Ensure poker schema exists
create schema if not exists poker;

-- Grant schema usage to service_role (server-side operations)
grant usage on schema poker to service_role;

-- Grant privileges on existing objects
grant select, insert, update, delete on all tables in schema poker to service_role;
grant usage, select on all sequences in schema poker to service_role;

-- Ensure future objects also get proper privileges
alter default privileges in schema poker grant select, insert, update, delete on tables to service_role;
alter default privileges in schema poker grant usage, select on sequences to service_role;


