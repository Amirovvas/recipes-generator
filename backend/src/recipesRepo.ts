import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import { createUserClient } from './supabase.js'
import { HttpError } from './errors.js'
import type { GeneratedImage } from './images.js'
import type { Recipe, SavedRecipe } from './schemas.js'

const PHOTO_BUCKET = 'dish-photos'

const COLUMNS = 'id, title, description, cooking_time, servings, ingredients, steps, source_ingredients, image_path, created_at'

type RecipeRow = {
  id: string
  title: string
  description: string
  cooking_time: string
  servings: number
  ingredients: string[]
  steps: { title: string; text: string }[]
  source_ingredients: string[]
  image_path: string | null
  created_at: string
}

// Bucket публичный: ссылку собираем сами, без запроса к Storage
const photoUrl = (path: string | null) =>
  path ? `${config.supabase.url}/storage/v1/object/public/${PHOTO_BUCKET}/${path}` : null

const EXTENSIONS: Record<GeneratedImage['contentType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const toSavedRecipe = (row: RecipeRow): SavedRecipe => ({
  id: row.id,
  title: row.title,
  description: row.description,
  cookingTime: row.cooking_time,
  servings: row.servings,
  ingredients: row.ingredients,
  steps: row.steps,
  sourceIngredients: row.source_ingredients,
  imageUrl: photoUrl(row.image_path),
  createdAt: row.created_at,
})

const dbError = (action: string, err: { message: string; code?: string }) => {
  console.error(`[db] ${action}: ${err.code ?? '-'} ${err.message}`)
  return new HttpError(502, 'База данных временно недоступна')
}

// Все функции работают от имени пользователя: RLS не даст тронуть чужие строки
export const recipesRepo = (accessToken: string, userId: string) => {
  const db = createUserClient(accessToken)

  return {
    async create(recipe: Recipe, sourceIngredients: string[]): Promise<SavedRecipe> {
      const { data, error } = await db
        .from('recipes')
        .insert({
          title: recipe.title,
          description: recipe.description,
          cooking_time: recipe.cookingTime,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          source_ingredients: sourceIngredients,
        })
        .select(COLUMNS)
        .single<RecipeRow>()
      if (error) throw dbError('insert', error)
      return toSavedRecipe(data)
    },

    async list(limit: number, before?: string): Promise<{ items: SavedRecipe[]; nextCursor: string | null }> {
      let query = db
        .from('recipes')
        .select(COLUMNS)
        .order('created_at', { ascending: false })
        // +1 строка, чтобы понять, есть ли следующая страница
        .limit(limit + 1)
      if (before) query = query.lt('created_at', before)

      const { data, error } = await query.returns<RecipeRow[]>()
      if (error) throw dbError('list', error)

      const rows = data.slice(0, limit)
      return {
        items: rows.map(toSavedRecipe),
        nextCursor: data.length > limit ? rows[rows.length - 1].created_at : null,
      }
    },

    async get(id: string): Promise<SavedRecipe> {
      const { data, error } = await db.from('recipes').select(COLUMNS).eq('id', id).maybeSingle<RecipeRow>()
      if (error) throw dbError('get', error)
      if (!data) throw new HttpError(404, 'Рецепт не найден')
      return toSavedRecipe(data)
    },

    async remove(id: string): Promise<void> {
      const { data, error } = await db.from('recipes').delete().eq('id', id).select('image_path')
      if (error) throw dbError('delete', error)
      if (!data.length) throw new HttpError(404, 'Рецепт не найден')
      await removePhoto(data[0].image_path)
    },

    /** Сохраняет фото в Storage и привязывает к рецепту; старое фото удаляется */
    async setPhoto(recipe: SavedRecipe, image: GeneratedImage): Promise<SavedRecipe> {
      const oldPath = await currentPhotoPath(recipe.id)
      // Новое имя при каждой генерации: браузер не покажет старую картинку из кэша
      const path = `${userId}/${recipe.id}-${randomUUID().slice(0, 8)}.${EXTENSIONS[image.contentType]}`

      const upload = await db.storage
        .from(PHOTO_BUCKET)
        .upload(path, image.data, { contentType: image.contentType, cacheControl: '31536000' })
      if (upload.error) throw dbError('photo upload', upload.error)

      const { data, error } = await db
        .from('recipes')
        .update({ image_path: path })
        .eq('id', recipe.id)
        .select(COLUMNS)
        .maybeSingle<RecipeRow>()
      if (error || !data) {
        // Рецепт исчез или запись не удалась — не оставляем файл-сироту
        await removePhoto(path)
        if (error) throw dbError('photo update', error)
        throw new HttpError(404, 'Рецепт не найден')
      }

      await removePhoto(oldPath)
      return toSavedRecipe(data)
    },
  }

  async function currentPhotoPath(id: string): Promise<string | null> {
    const { data } = await db.from('recipes').select('image_path').eq('id', id).maybeSingle<{ image_path: string | null }>()
    return data?.image_path ?? null
  }

  // Ошибка удаления файла не должна ломать основное действие — только логируем
  async function removePhoto(path: string | null) {
    if (!path) return
    const { error } = await db.storage.from(PHOTO_BUCKET).remove([path])
    if (error) console.warn(`[storage] не удалось удалить ${path}: ${error.message}`)
  }
}
