import { Router } from 'express'
import { config } from '../config.js'
import { HttpError } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'
import { loginInput, refreshInput, registerInput } from '../schemas.js'
import { createAuthClient, toAuthSession, toAuthUser } from '../supabase.js'

export const authRouter = Router()

// POST /api/auth/register  { email, password, name? }
// Если в Supabase включено подтверждение email, сессии ещё нет — фронт показывает «проверьте почту»
authRouter.post('/register', async (req, res) => {
  const { email, password, name } = registerInput.parse(req.body)

  const { data, error } = await createAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: config.supabase.emailRedirectTo,
    },
  })
  if (error) throw error
  if (!data.user) throw new HttpError(502, 'Не удалось создать пользователя')

  res.status(201).json({
    user: toAuthUser(data.user),
    session: data.session ? toAuthSession(data.session) : null,
    emailConfirmationRequired: !data.session,
  })
})

// POST /api/auth/login  { email, password }
authRouter.post('/login', async (req, res) => {
  const { email, password } = loginInput.parse(req.body)

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password })
  if (error) throw error

  res.json({
    user: toAuthUser(data.user),
    session: toAuthSession(data.session),
  })
})

// POST /api/auth/refresh  { refreshToken } — новая пара токенов
authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = refreshInput.parse(req.body)

  const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken })
  // На битый/отозванный токен Supabase отвечает по-разному (validation_failed,
  // refresh_token_not_found, ...) — для клиента это всегда «войдите снова»
  if (error && error.status && error.status < 500) {
    throw new HttpError(401, 'Сессия истекла, войдите снова')
  }
  if (error) throw error
  if (!data.session || !data.user) throw new HttpError(401, 'Сессия истекла, войдите снова')

  res.json({
    user: toAuthUser(data.user),
    session: toAuthSession(data.session),
  })
})

// POST /api/auth/logout — отзывает refresh token текущей сессии
authRouter.post('/logout', requireAuth, async (req, res) => {
  const { error } = await createAuthClient().auth.admin.signOut(req.accessToken!, 'local')
  if (error) throw error
  res.status(204).end()
})

// GET /api/auth/me — текущий пользователь
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})
