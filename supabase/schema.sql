-- Supabase schema for optional feedback persistence
-- Bonvoy L5 Checker

create extension if not exists pgcrypto;

create table if not exists merchant_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  normalized_name text,
  brand_group text not null default 'marriott',
  confidence text not null check (confidence in ('certain', 'high', 'medium', 'low', 'none')),
  status text not null default 'active' check (status in ('active', 'needs_review', 'rejected')),
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists merchant_rules_pattern_idx on merchant_rules (pattern);
create index if not exists merchant_rules_status_idx on merchant_rules (status);

create table if not exists merchant_feedback (
  id uuid primary key default gen_random_uuid(),
  merchant_raw_name text not null,
  normalized_merchant_name text,
  user_action text not null check (user_action in ('include', 'exclude', 'unsure')),
  detected_status text,
  detected_confidence text,
  point_type text,
  expected_difference integer,
  anonymous_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists merchant_feedback_merchant_idx on merchant_feedback (merchant_raw_name);
create index if not exists merchant_feedback_created_at_idx on merchant_feedback (created_at);

-- Lock both tables down: the anon key shipped in the client bundle may only
-- INSERT feedback. Reads, updates, deletes, and rule management are reserved
-- for the service role (which bypasses RLS) during manual review.
alter table merchant_rules enable row level security;
alter table merchant_feedback enable row level security;

drop policy if exists merchant_feedback_insert_anon on merchant_feedback;
create policy merchant_feedback_insert_anon on merchant_feedback
  for insert to anon
  with check (true);

-- Anonymous parse-failure reports: privacy-safe diagnostics only (headers with
-- digits masked — no amounts, merchant names, card numbers, or file names).
create table if not exists parse_error_reports (
  id uuid primary key default gen_random_uuid(),
  diagnostic text not null check (char_length(diagnostic) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists parse_error_reports_created_at_idx on parse_error_reports (created_at);

alter table parse_error_reports enable row level security;

drop policy if exists parse_error_reports_insert_anon on parse_error_reports;
create policy parse_error_reports_insert_anon on parse_error_reports
  for insert to anon
  with check (true);

-- security_invoker so the anon role cannot read aggregates through the view;
-- it is meant for service-role/manual review only.
create or replace view merchant_candidates with (security_invoker = true) as
select
  upper(trim(merchant_raw_name)) as merchant_key,
  min(merchant_raw_name) as example_merchant_name,
  count(*) filter (where user_action = 'include') as include_count,
  count(*) filter (where user_action = 'exclude') as exclude_count,
  count(*) filter (where user_action = 'unsure') as unsure_count,
  count(*) as total_count,
  case
    when (count(*) filter (where user_action in ('include', 'exclude'))) = 0 then null
    else
      (count(*) filter (where user_action = 'include'))::float /
      nullif((count(*) filter (where user_action in ('include', 'exclude'))), 0)
  end as include_ratio,
  max(created_at) as last_feedback_at
from merchant_feedback
group by upper(trim(merchant_raw_name));

-- Seed known rules
insert into merchant_rules (pattern, normalized_name, brand_group, confidence, status, source, notes)
values
  ('TIAD', 'TIAD, Autograph Collection', 'marriott', 'high', 'active', 'manual', 'Known Autograph Collection hotel.'),
  ('POSTCARD CABINS', 'Postcard Cabins / Outdoor Collection by Marriott Bonvoy', 'marriott', 'high', 'active', 'manual', 'Known Marriott Bonvoy Outdoor Collection related merchant.'),
  ('HOTEL CLEVELAND', 'Hotel Cleveland, Autograph Collection', 'marriott', 'high', 'active', 'manual', 'Known Autograph Collection property.'),
  ('HOTEL 55 CHICAGO', 'Hotel 55 Chicago', 'marriott_candidate', 'medium', 'needs_review', 'manual', 'Ambiguous prior user case; should require review.')
on conflict do nothing;
