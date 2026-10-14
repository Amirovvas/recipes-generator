import type { RequestHandler } from 'express'
import { createAuthClient, toAuthUser, type AuthUser } from '../supabase.js'
import { HttpError } from '../errors.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      accessToken?: string
    }
  }
}

const readBearer = (header: string | undefined): string | null => {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

// Проверяет access token у Supabase и кладёт пользователя в req.user
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readBearer(req.headers.authorization)
  if (!token) {
    throw new HttpError(401, 'Требуется авторизация')
  }

  const { data, error } = await createAuthClient().auth.getUser(token)
  if (error || !data.user) {
    throw new HttpError(401, 'Сессия истекла, войдите снова')
  }

  req.user = toAuthUser(data.user)
  req.accessToken = token
  next()
}
