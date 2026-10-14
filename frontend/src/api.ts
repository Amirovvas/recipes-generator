import { RecipePage, SavedRecipe, Session, User } from './types'

const SESSION_KEY = 'chefai.session'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

// ---------- Хранение сессии ----------

export const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

const saveSession = (session: Session | null) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

// Контекст авторизации подписывается, чтобы разлогинить при протухшей сессии
let onSessionExpired: (() => void) | null = null
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler
}

// ---------- Базовый запрос ----------

const send = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new ApiError(0, 'Нет связи с сервером. Проверьте подключение к интернету.')
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'Что-то пошло не так, попробуйте ещё раз')
  }
  return data as T
}

// Несколько одновременных запросов должны делить одно обновление токена
let refreshing: Promise<Session | null> | null = null

const refreshSession = (): Promise<Session | null> => {
  refreshing ??= (async () => {
    const current = loadSession()
    if (!current) return null
    try {
      const { session } = await send<{ session: Session }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
      saveSession(session)
      return session
    } catch (err) {
      // Сервер явно отклонил токен — сессия мертва. При сетевой ошибке не разлогиниваем
      if (err instanceof ApiError && err.status === 401) {
        saveSession(null)
        onSessionExpired?.()
      }
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

const isExpiringSoon = (session: Session) =>
  session.expiresAt !== null && session.expiresAt * 1000 - Date.now() < 60_000

// Запрос от имени пользователя: заранее обновляет токен и повторяет один раз при 401
const authed = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let session = loadSession()
  if (!session) {
    onSessionExpired?.()
    throw new ApiError(401, 'Войдите в аккаунт')
  }
  if (isExpiringSoon(session)) {
    session = (await refreshSession()) ?? session
  }

  try {
    return await send<T>(path, init, session.accessToken)
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err
    const fresh = await refreshSession()
    if (!fresh) throw new ApiError(401, 'Сессия истекла, войдите снова')
    return send<T>(path, init, fresh.accessToken)
  }
}

// ---------- Auth ----------

type AuthResponse = { user: User; session: Session }
type RegisterResponse = { user: User; session: Session | null; emailConfirmationRequired: boolean }

export const api = {
  async login(email: string, password: string): Promise<User> {
    const { user, session } = await send<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveSession(session)
    return user
  },

  async register(email: string, password: string, name?: string): Promise<RegisterResponse> {
    const data = await send<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(name ? { name } : {}) }),
    })
    if (data.session) saveSession(data.session)
    return data
  },

  /** Текущий пользователь или null, если не вошли / сессия истекла */
  async me(): Promise<User | null> {
    if (!loadSession()) return null
    try {
      const { user } = await authed<{ user: User }>('/auth/me')
      return user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null
      throw err
    }
  },

  async logout(): Promise<void> {
    try {
      await authed<void>('/auth/logout', { method: 'POST' })
    } finally {
      // Локально выходим в любом случае, даже если сервер недоступен
      saveSession(null)
    }
  },

  // ---------- Рецепты ----------

  /** Генерирует рецепт; сервер сразу сохраняет его в историю */
  generateRecipe(ingredients: string[]): Promise<SavedRecipe> {
    return authed<SavedRecipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    })
  },

  listRecipes(before?: string): Promise<RecipePage> {
    const params = new URLSearchParams({ limit: '20' })
    if (before) params.set('before', before)
    return authed<RecipePage>(`/recipes?${params}`)
  },

  /** Рисует фото блюда (10–20 с) и возвращает рецепт с imageUrl */
  generatePhoto(id: string): Promise<SavedRecipe> {
    return authed<SavedRecipe>(`/recipes/${encodeURIComponent(id)}/image`, { method: 'POST' })
  },

  deleteRecipe(id: string): Promise<void> {
    return authed<void>(`/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
