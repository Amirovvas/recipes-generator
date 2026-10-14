import { createClient, type Session, type User } from '@supabase/supabase-js'
import { config } from './config.js'

// Новый клиент на каждый запрос: на сервере сессия не должна храниться
// в общем экземпляре, иначе пользователи «увидят» токены друг друга
export const createAuthClient = () =>
  createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

// Клиент от имени пользователя: запросы к БД идут с его JWT, и RLS
// сам ограничивает доступ его строками. Service role не нужен
export const createUserClient = (accessToken: string) =>
  createClient(config.supabase.url, config.supabase.publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailConfirmed: boolean
  createdAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
}

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email ?? '',
  name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null,
  emailConfirmed: Boolean(user.email_confirmed_at),
  createdAt: user.created_at,
})

export const toAuthSession = (session: Session): AuthSession => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at ?? null,
})
