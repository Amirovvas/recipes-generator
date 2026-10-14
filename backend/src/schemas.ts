import { z } from 'zod'

// ---------- Auth ----------

const email = z.string().trim().toLowerCase().pipe(z.email('Некорректный email'))

export const registerInput = z.object({
  email,
  // 72 байта — предел bcrypt, который использует Supabase
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов').max(72, 'Пароль слишком длинный'),
  name: z.string().trim().min(1).max(60).optional(),
})

export const loginInput = z.object({
  email,
  password: z.string().min(1, 'Введите пароль').max(72),
})

export const refreshInput = z.object({
  refreshToken: z.string().min(1, 'Не передан refreshToken'),
})

// ---------- Рецепты ----------

// Запрос: список продуктов
export const generateRecipeInput = z.object({
  ingredients: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Укажите хотя бы один продукт')
    .max(25, 'Слишком много продуктов — не больше 25'),
})

// Ответ модели — уходит в API как JSON Schema (structured output), поэтому все поля обязательные.
// Шаги — простой текст без HTML, чтобы фронт не рендерил разметку из ИИ
export const recipeSchema = z.object({
  title: z.string().min(1).describe('Название блюда'),
  description: z.string().min(1).describe('1–2 предложения о блюде'),
  cookingTime: z.string().min(1).describe('Общее время, например «40 минут»'),
  servings: z.number().int().positive().describe('Количество порций'),
  ingredients: z
    .array(z.string().min(1))
    .min(1)
    .describe('Строки в формате «Название — количество» через длинное тире'),
  steps: z
    .array(
      z.object({
        title: z.string().min(1).describe('Короткое название шага, 1–3 слова'),
        text: z.string().min(1).describe('Что сделать: конкретно, с температурой и временем'),
      }),
    )
    .min(1),
})

export type Recipe = z.infer<typeof recipeSchema>

/** Рецепт из истории */
export type SavedRecipe = Recipe & {
  id: string
  sourceIngredients: string[]
  /** Публичная ссылка на фото блюда; null — фото ещё нет */
  imageUrl: string | null
  createdAt: string
}

export const listRecipesInput = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // created_at последнего рецепта предыдущей страницы
  before: z.iso.datetime({ offset: true, error: 'Некорректный курсор страницы' }).optional(),
})

export const recipeIdParam = z.object({
  id: z.uuid('Некорректный id рецепта'),
})

