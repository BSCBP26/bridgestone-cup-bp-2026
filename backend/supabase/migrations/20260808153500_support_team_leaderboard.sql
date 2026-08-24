alter table public.support_messages add column team_name text;
update public.support_messages set team_name = 'OTHER TEAM' where team_name is null;
alter table public.support_messages alter column team_name set not null;
alter table public.support_messages add constraint support_messages_team_name_length check (char_length(trim(team_name)) between 2 and 120);
create index support_messages_team_leaderboard_idx on public.support_messages(status, team_name);
