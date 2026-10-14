-- Фото блюда: путь к файлу в Storage (bucket dish-photos)
alter table public.recipes add column image_path text;

-- Пользователь может обновлять свои рецепты (нужно, чтобы привязать фото)
create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Публичный bucket: <img src> работает без подписанных ссылок.
-- Путь {user_id}/{recipe_id}-{random}.jpg не угадать, а писать можно только в свою папку
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "dish_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "dish_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage API перед удалением читает запись объекта — нужен select на свою папку
create policy "dish_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
