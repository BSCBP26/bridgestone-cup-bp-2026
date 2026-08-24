create table if not exists public.sport_category_settings (
  sport_slug text primary key references public.sports(slug) on update cascade on delete cascade,
  active_categories text[] not null,
  updated_at timestamptz not null default now(),
  check (cardinality(active_categories) between 1 and 2),
  check (active_categories <@ array['singles','doubles']::text[])
);
alter table public.sport_category_settings enable row level security;
revoke all on public.sport_category_settings from anon, authenticated;
grant all on public.sport_category_settings to service_role;
insert into public.tournaments(id,sport_id,name,format,status,timezone) values
 ('badminton-singles-bp-2026','sport-badminton','Badminton Singles Bridgestone Cup BP 2026','single_elimination','published','Asia/Jakarta'),
 ('table-tennis-doubles-bp-2026','sport-table-tennis','Table Tennis Doubles Bridgestone Cup BP 2026','single_elimination','published','Asia/Jakarta')
on conflict(id) do nothing;
insert into public.sport_category_settings(sport_slug,active_categories) values
 ('badminton',array['doubles']),('table-tennis',array['singles'])
on conflict(sport_slug) do nothing;
