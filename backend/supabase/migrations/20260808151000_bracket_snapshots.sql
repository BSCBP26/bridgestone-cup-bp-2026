create table public.bracket_snapshots (
  tournament_id text primary key references public.tournaments(id) on update cascade on delete cascade,
  bracket jsonb not null,
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(bracket) = 'object')
);

create trigger bracket_snapshots_set_updated_at before update on public.bracket_snapshots
for each row execute function public.set_updated_at();

alter table public.bracket_snapshots enable row level security;
revoke all on public.bracket_snapshots from anon, authenticated;
grant all on public.bracket_snapshots to service_role;
