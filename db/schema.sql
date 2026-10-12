create table if not exists funds (
  code text primary key,
  name text not null,
  company text,
  category text,
  plan text,
  option text
);

create table if not exists nav_history (
  code text not null references funds(code),
  nav_date date not null,
  nav numeric(12,4) not null,
  primary key (code, nav_date)
);
-- AUM figures (scheme level and category level), one row per period so history is kept
create table if not exists aum (
  kind text not null check (kind in ('scheme', 'category')),
  key text not null,                 -- normalised name, e.g. 'altivahybridlongshort'
  name text not null,
  aum_cr numeric(14,2) not null,     -- in rupees crore
  as_of date not null,               -- last day of the period the figure covers
  source text not null,
  updated_at timestamptz not null default now(),
  primary key (kind, key, as_of)
);

-- Remembers what AMFI returned last time, so we can tell when it really changed
create table if not exists aum_sync_state (
  id text primary key,
  content_hash text,
  checked_at timestamptz,
  changed_at timestamptz
);