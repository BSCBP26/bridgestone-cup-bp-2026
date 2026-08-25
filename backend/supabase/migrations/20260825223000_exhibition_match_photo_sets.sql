alter table public.greetings
  add column if not exists photo_storage_paths text[] not null default '{}';

comment on column public.greetings.photo_storage_paths is
  'Ordered gallery of photos for this Exhibition Match panel.';
