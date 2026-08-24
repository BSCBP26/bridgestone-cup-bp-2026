insert into public.sports (id, slug, name, participant_type, participant_limit, views)
values
  ('sport-badminton', 'badminton', 'Badminton', 'pair', 16, array['bracket', 'schedule']),
  ('sport-futsal', 'futsal', 'Futsal', 'team', 16, array['standings', 'bracket', 'schedule']),
  ('sport-chess', 'chess', 'Chess', 'player', 32, array['standings', 'schedule']),
  ('sport-table-tennis', 'table-tennis', 'Table Tennis', 'player', 16, array['bracket', 'standings', 'winner']),
  ('sport-football', 'football', 'Football', 'team', 12, array['bracket', 'schedule']),
  ('sport-fishing', 'fishing', 'Fishing', 'angler', 24, array['bracket', 'winner'])
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  participant_type = excluded.participant_type,
  participant_limit = excluded.participant_limit,
  views = excluded.views;

insert into public.tournaments (id, sport_id, name, format, status, timezone)
values
  ('badminton-bp-2026', 'sport-badminton', 'Badminton Doubles Bridgestone Cup BP 2026', 'single_elimination', 'published', 'Asia/Jakarta'),
  ('badminton-singles-bp-2026', 'sport-badminton', 'Badminton Singles Bridgestone Cup BP 2026', 'single_elimination', 'published', 'Asia/Jakarta'),
  ('futsal-bp-2026', 'sport-futsal', 'Futsal Bridgestone Cup BP 2026', 'group_and_single_elimination', 'published', 'Asia/Jakarta'),
  ('chess-bp-2026', 'sport-chess', 'Chess Bridgestone Cup BP 2026', 'group_and_single_elimination', 'published', 'Asia/Jakarta'),
  ('table-tennis-bp-2026', 'sport-table-tennis', 'Table Tennis Singles Bridgestone Cup BP 2026', 'single_elimination', 'published', 'Asia/Jakarta'),
  ('table-tennis-doubles-bp-2026', 'sport-table-tennis', 'Table Tennis Doubles Bridgestone Cup BP 2026', 'single_elimination', 'published', 'Asia/Jakarta'),
  ('football-bp-2026', 'sport-football', 'Football Bridgestone Cup BP 2026', 'single_elimination', 'published', 'Asia/Jakarta'),
  ('fishing-bp-2026', 'sport-fishing', 'Fishing Bridgestone Cup BP 2026', 'ranking', 'published', 'Asia/Jakarta')
on conflict (id) do update set
  sport_id = excluded.sport_id,
  name = excluded.name,
  format = excluded.format,
  status = excluded.status,
  timezone = excluded.timezone;
