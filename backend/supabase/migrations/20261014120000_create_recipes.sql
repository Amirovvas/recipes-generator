-- История рецептов пользователя
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title text not null check (char_length(title) between 1 and 300),
  description text not null,
  cooking_time text not null,
  servings integer not null check (servings > 0),
  -- ["Картофель — 500 г", ...]
  ingredients jsonb not null check (jsonb_typeof(ingredients) = 'array'),
  -- [{ "title": "...", "text": "..." }, ...]
  steps jsonb not null check (jsonb_typeof(steps) = 'array'),
  -- Что пользователь ввёл в форму
  source_ingredients text[] not null default '{}',

  created_at timestamptz not null default now()
);

comment on table public.recipes is 'Сгенерированные ИИ рецепты, история пользователя';

-- Лента истории: свои рецепты, новые сверху
create index recipes_user_id_created_at_idx on public.recipes (user_id, created_at desc);

-- RLS: каждый видит и меняет только свои рецепты
alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "recipes_insert_own" on public.recipes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "recipes_delete_own" on public.recipes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
