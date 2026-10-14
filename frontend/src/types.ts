export type RecipeStep = {
  title: string
  text: string
}

export type Recipe = {
  title: string
  description: string
  cookingTime: string
  servings: number
  /** Строки вида «Название — количество» */
  ingredients: string[]
  steps: RecipeStep[]
}

/** Рецепт, сохранённый в истории */
export type SavedRecipe = Recipe & {
  id: string
  /** Что пользователь ввёл в форму */
  sourceIngredients: string[]
  /** Фото блюда; null — ещё не сгенерировано */
  imageUrl: string | null
  createdAt: string
}

export type RecipePage = {
  items: SavedRecipe[]
  /** createdAt последнего элемента; null — страниц больше нет */
  nextCursor: string | null
}

/** Состояние экрана: покой, загрузка, ошибка, готовый рецепт. */
export type Status = 'idle' | 'loading' | 'error' | 'success'

export type User = {
  id: string
  email: string
  name: string | null
  emailConfirmed: boolean
  createdAt: string
}

export type Session = {
  accessToken: string
  refreshToken: string
  /** Unix-время истечения access token, в секундах */
  expiresAt: number | null
}
