alter table if exists public.greetings rename to exhibition_matches;
alter index if exists public.greetings_publication_idx rename to exhibition_matches_publication_idx;
alter trigger if exists greetings_set_updated_at on public.exhibition_matches rename to exhibition_matches_set_updated_at;
comment on table public.exhibition_matches is 'Exhibition Match panels managed by event administrators.';
