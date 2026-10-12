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