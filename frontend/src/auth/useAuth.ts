import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { meQueryKey } from '../queryClient'
import { User } from '../types'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

/** Текущий пользователь. Кэш ['me']: User — вошли, null — гость. */
export const useAuth = () => {
  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: api.me,
    staleTime: Infinity,
  })

  // Сервер недоступен при старте — показываем вход, а не вечный спиннер
  const status: AuthStatus = me.isPending ? 'loading' : me.data ? 'authenticated' : 'guest'

  return { status, user: me.data ?? null }
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (user) => queryClient.setQueryData<User | null>(meQueryKey, user),
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name?: string }) =>
      api.register(email, password, name),
    onSuccess: ({ user, session }) => {
      // Без сессии (нужно подтвердить email) остаёмся гостем
      if (session) queryClient.setQueryData<User | null>(meQueryKey, user)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    // Выходим локально, даже если сервер недоступен
    onSettled: () => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== meQueryKey[0] })
      queryClient.setQueryData(meQueryKey, null)
    },
  })
}
