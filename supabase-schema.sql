create table if not exists public.draft_board_states (
    board_id text primary key,
    state jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.draft_board_states enable row level security;

drop policy if exists "draft board public read" on public.draft_board_states;
drop policy if exists "draft board public insert" on public.draft_board_states;
drop policy if exists "draft board public update" on public.draft_board_states;

create policy "draft board public read"
on public.draft_board_states
for select
using (true);

create policy "draft board public insert"
on public.draft_board_states
for insert
with check (true);

create policy "draft board public update"
on public.draft_board_states
for update
using (true)
with check (true);
