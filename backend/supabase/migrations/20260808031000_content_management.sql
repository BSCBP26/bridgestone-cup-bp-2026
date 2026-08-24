create table public.greetings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_id text not null,
  role_en text,
  message_id text not null,
  message_en text,
  photo_storage_path text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message_id text not null,
  message_en text,
  label text,
  photo_storage_path text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index greetings_publication_idx on public.greetings(status, sort_order);
create index support_messages_publication_idx on public.support_messages(status, sort_order);

create trigger greetings_set_updated_at before update on public.greetings
for each row execute function public.set_updated_at();

create trigger support_messages_set_updated_at before update on public.support_messages
for each row execute function public.set_updated_at();

alter table public.greetings enable row level security;
alter table public.support_messages enable row level security;

revoke all on public.greetings, public.support_messages from anon, authenticated;
grant all on public.greetings, public.support_messages to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
