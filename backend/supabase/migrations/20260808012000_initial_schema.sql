create extension if not exists pgcrypto;

create table public.sports (
  id text primary key,
  slug text not null unique,
  name text not null,
  participant_type text not null check (participant_type in ('team', 'pair', 'player', 'angler')),
  participant_limit integer not null check (participant_limit between 2 and 128),
  views text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournaments (
  id text primary key,
  sport_id text not null references public.sports(id) on update cascade on delete restrict,
  name text not null,
  format text not null check (format in ('single_elimination', 'group_and_single_elimination', 'group_competition', 'ranking')),
  status text not null default 'draft' check (status in ('draft', 'published', 'completed', 'archived')),
  timezone text not null default 'Asia/Jakarta',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('super_admin', 'sport_admin')),
  sport_id text references public.sports(id) on update cascade on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((role = 'super_admin' and sport_id is null) or (role = 'sport_admin' and sport_id is not null))
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on update cascade on delete restrict,
  name text not null,
  unit_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, name)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on update cascade on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  employee_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id text not null references public.tournaments(id) on update cascade on delete cascade,
  team_id uuid references public.teams(id) on delete restrict,
  participant_id uuid references public.participants(id) on delete restrict,
  display_name text not null,
  seed integer check (seed is null or seed > 0),
  created_at timestamptz not null default now(),
  unique (tournament_id, team_id),
  unique (tournament_id, participant_id),
  check (num_nonnulls(team_id, participant_id) = 1)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id text not null references public.tournaments(id) on update cascade on delete cascade,
  match_code text not null,
  round_number integer not null check (round_number > 0),
  round_name text not null,
  position integer not null check (position > 0),
  home_entry_id uuid references public.tournament_entries(id) on delete restrict,
  away_entry_id uuid references public.tournament_entries(id) on delete restrict,
  home_score integer check (home_score is null or home_score >= 0),
  away_score integer check (away_score is null or away_score >= 0),
  winner_entry_id uuid references public.tournament_entries(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'bye')),
  next_match_id uuid references public.matches(id) on delete set null,
  next_match_slot text check (next_match_slot in ('home', 'away')),
  scheduled_at timestamptz,
  venue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, match_code),
  unique (tournament_id, round_number, position),
  check ((next_match_id is null and next_match_slot is null) or (next_match_id is not null and next_match_slot is not null)),
  check (winner_entry_id is null or coalesce(winner_entry_id = home_entry_id, false) or coalesce(winner_entry_id = away_entry_id, false))
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  tournament_id text not null references public.tournaments(id) on update cascade on delete cascade,
  group_name text not null,
  entry_id uuid not null references public.tournament_entries(id) on delete cascade,
  rank integer not null check (rank > 0),
  played integer not null default 0 check (played >= 0),
  won integer not null default 0 check (won >= 0),
  drawn integer not null default 0 check (drawn >= 0),
  lost integer not null default 0 check (lost >= 0),
  points integer not null default 0,
  score_for integer not null default 0,
  score_against integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (tournament_id, group_name, entry_id),
  unique (tournament_id, group_name, rank)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_id text not null,
  title_en text,
  body_id text not null,
  body_en text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  sport_id text references public.sports(id) on update cascade on delete set null,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null unique,
  title_id text,
  title_en text,
  alt_id text,
  alt_en text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tournaments_sport_id_idx on public.tournaments(sport_id);
create index participants_sport_id_idx on public.participants(sport_id);
create index participants_team_id_idx on public.participants(team_id);
create index tournament_entries_tournament_id_idx on public.tournament_entries(tournament_id);
create index matches_tournament_round_idx on public.matches(tournament_id, round_number, position);
create index matches_scheduled_at_idx on public.matches(scheduled_at) where scheduled_at is not null;
create index standings_tournament_group_idx on public.standings(tournament_id, group_name, rank);
create index announcements_publication_idx on public.announcements(status, published_at desc);
create index gallery_items_publication_idx on public.gallery_items(status, sport_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sports_set_updated_at before update on public.sports for each row execute function public.set_updated_at();
create trigger tournaments_set_updated_at before update on public.tournaments for each row execute function public.set_updated_at();
create trigger admin_profiles_set_updated_at before update on public.admin_profiles for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams for each row execute function public.set_updated_at();
create trigger participants_set_updated_at before update on public.participants for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger standings_set_updated_at before update on public.standings for each row execute function public.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements for each row execute function public.set_updated_at();
create trigger gallery_items_set_updated_at before update on public.gallery_items for each row execute function public.set_updated_at();

alter table public.sports enable row level security;
alter table public.tournaments enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.teams enable row level security;
alter table public.participants enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.matches enable row level security;
alter table public.standings enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery_items enable row level security;

revoke all on public.sports, public.tournaments, public.admin_profiles, public.teams,
  public.participants, public.tournament_entries, public.matches, public.standings,
  public.announcements, public.gallery_items from anon, authenticated;

grant all on public.sports, public.tournaments, public.admin_profiles, public.teams,
  public.participants, public.tournament_entries, public.matches, public.standings,
  public.announcements, public.gallery_items to service_role;
