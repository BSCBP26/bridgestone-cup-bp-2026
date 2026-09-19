insert into public.sports (id, slug, name, participant_type, participant_limit, views)
values ('sport-running', 'running', 'Running', 'player', 500, array['leaderboard'])
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  participant_type = excluded.participant_type,
  participant_limit = excluded.participant_limit,
  views = excluded.views;

insert into public.tournaments (id, sport_id, name, format, status, timezone)
values ('running-bp-2026', 'sport-running', 'Running Bridgestone Cup BP 2026', 'ranking', 'published', 'Asia/Jakarta')
on conflict (id) do update set
  sport_id = excluded.sport_id,
  name = excluded.name,
  format = excluded.format,
  status = excluded.status,
  timezone = excluded.timezone;

create table public.running_activities (
  id uuid primary key default gen_random_uuid(),
  runner_name text not null,
  activity_date date not null,
  distance_km numeric(8, 3) not null check (distance_km > 0 and distance_km <= 200),
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 172800),
  pace_seconds_per_km integer not null check (pace_seconds_per_km > 0),
  source_hash text not null unique,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index running_activities_runner_idx on public.running_activities (lower(runner_name));
create index running_activities_date_idx on public.running_activities (activity_date desc);

alter table public.running_activities enable row level security;
revoke all on public.running_activities from anon, authenticated;
grant all on public.running_activities to service_role;
