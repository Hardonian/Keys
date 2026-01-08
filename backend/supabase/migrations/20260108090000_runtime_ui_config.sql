-- Runtime UI configuration (public, runtime-editable)
-- Purpose: enable final UI polish without frontend rebuilds by storing a
-- strictly-sanitized PUBLIC configuration document in the database.
--
-- Security model:
-- - Read: allowed for anon/authenticated (public-safe document only)
-- - Write: no RLS write policies; only service role can update via backend

create table if not exists public.runtime_ui_config (
  id text primary key,
  public_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

create or replace function public.set_runtime_ui_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_runtime_ui_config_updated_at on public.runtime_ui_config;
create trigger trg_runtime_ui_config_updated_at
before update on public.runtime_ui_config
for each row
execute function public.set_runtime_ui_config_updated_at();

alter table public.runtime_ui_config enable row level security;

drop policy if exists "runtime_ui_config_read_all" on public.runtime_ui_config;
create policy "runtime_ui_config_read_all"
on public.runtime_ui_config
for select
to anon, authenticated
using (true);

-- Seed a safe default config.
insert into public.runtime_ui_config (id, public_config)
values (
  'default',
  '{
    "version": 1,
    "tokens": {
      "radius": "0.5rem"
    },
    "banner": {
      "enabled": false,
      "tone": "info",
      "text": "",
      "href": null,
      "dismissible": true
    },
    "features": {},
    "sections": {},
    "copy": {}
  }'::jsonb
)
on conflict (id) do nothing;

