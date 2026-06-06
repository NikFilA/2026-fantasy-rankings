create table if not exists public.draft_board_states (
    board_id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    state jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.draft_board_states
add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'draft_board_states_user_id_key'
    ) then
        alter table public.draft_board_states
        add constraint draft_board_states_user_id_key unique (user_id);
    end if;
end $$;

alter table public.draft_board_states enable row level security;

drop policy if exists "draft board public read" on public.draft_board_states;
drop policy if exists "draft board public insert" on public.draft_board_states;
drop policy if exists "draft board public update" on public.draft_board_states;
drop policy if exists "draft board legacy seed read" on public.draft_board_states;
drop policy if exists "draft board user read" on public.draft_board_states;
drop policy if exists "draft board user insert" on public.draft_board_states;
drop policy if exists "draft board user update" on public.draft_board_states;
drop policy if exists "draft board user delete" on public.draft_board_states;

create policy "draft board legacy seed read"
on public.draft_board_states
for select
using (user_id is null);

create policy "draft board user read"
on public.draft_board_states
for select
using (auth.uid() = user_id);

create policy "draft board user insert"
on public.draft_board_states
for insert
with check (auth.uid() = user_id);

create policy "draft board user update"
on public.draft_board_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "draft board user delete"
on public.draft_board_states
for delete
using (auth.uid() = user_id);
