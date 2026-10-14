import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { RecipePage, SavedRecipe } from '../types'

export const recipesQueryKey = ['recipes'] as const

type HistoryCache = InfiniteData<RecipePage, string | undefined>

/** История рецептов, по 20 штук, новые сверху */
export const useRecipeHistory = () =>
  useInfiniteQuery({
    queryKey: recipesQueryKey,
    queryFn: ({ pageParam }) => api.listRecipes(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

/** Генерация: новый рецепт сразу появляется вверху истории, без перезапроса */
export const useGenerateRecipe = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.generateRecipe,
    onSuccess: (recipe) => {
      queryClient.setQueryData<HistoryCache>(recipesQueryKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page, i) => (i === 0 ? { ...page, items: [recipe, ...page.items] } : page)),
            }
          : data,
      )
    },
  })
}

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recipe: SavedRecipe) => api.deleteRecipe(recipe.id),
    onSuccess: (_void, recipe) => {
      queryClient.setQueryData<HistoryCache>(recipesQueryKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== recipe.id),
              })),
            }
          : data,
      )
    },
  })
}

/** Фото блюда: обновлённый рецепт (с imageUrl) сразу подменяется в истории */
export const useGeneratePhoto = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recipe: SavedRecipe) => api.generatePhoto(recipe.id),
    onSuccess: (updated) => {
      queryClient.setQueryData<HistoryCache>(recipesQueryKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (item.id === updated.id ? updated : item)),
              })),
            }
          : data,
      )
    },
  })
}
