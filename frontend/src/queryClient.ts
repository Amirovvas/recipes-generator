import { QueryClient } from '@tanstack/react-query'
import { ApiError, setSessionExpiredHandler } from './api'

/** Кэш текущего пользователя: User — вошли, null — гость */
export const meQueryKey = ['me'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ошибки 4xx (нет доступа, неверные данные) повторять бессмысленно
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Генерация стоит денег и времени — без автоповторов
      retry: false,
    },
  },
})

// Протухшая сессия в любом запросе → экран входа
setSessionExpiredHandler(() => queryClient.setQueryData(meQueryKey, null))
