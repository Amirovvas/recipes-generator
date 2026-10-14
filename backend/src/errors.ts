import type { ErrorRequestHandler } from 'express'
import OpenAI from 'openai'
import { ZodError } from 'zod'
import { isAuthError, type AuthError } from '@supabase/supabase-js'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

// Коды ошибок Supabase Auth → понятные сообщения. Неизвестные не раскрываем
const mapAuthError = (err: AuthError): { status: number; message: string } => {
  switch (err.code) {
    case 'invalid_credentials':
      return { status: 401, message: 'Неверный email или пароль' }
    case 'email_not_confirmed':
      return { status: 403, message: 'Подтвердите email — ссылка отправлена на почту' }
    case 'user_already_exists':
    case 'email_exists':
      return { status: 409, message: 'Пользователь с таким email уже зарегистрирован' }
    case 'weak_password':
      return { status: 400, message: 'Пароль слишком простой' }
    case 'email_address_invalid':
      return { status: 400, message: 'Этот email не принимается' }
    case 'signup_disabled':
    case 'email_provider_disabled':
      return { status: 403, message: 'Регистрация временно отключена' }
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'session_not_found':
    case 'session_expired':
    case 'bad_jwt':
      return { status: 401, message: 'Сессия истекла, войдите снова' }
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return { status: 429, message: 'Слишком много попыток, попробуйте позже' }
  }

  console.error(`[auth] ${err.status ?? '-'} ${err.code ?? '-'} ${err.message}`)
  return { status: 502, message: 'Сервис авторизации временно недоступен' }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Ошибки express.json(): битый JSON или слишком большое тело
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некорректный JSON в теле запроса' })
    return
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Слишком большой запрос' })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? 'Некорректный запрос' })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }

  if (isAuthError(err)) {
    const { status, message } = mapAuthError(err)
    res.status(status).json({ error: message })
    return
  }

  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    console.error('[ai] timeout')
    res.status(504).json({ error: 'Сервис ИИ отвечает слишком долго, попробуйте ещё раз' })
    return
  }

  // Ошибки провайдера ИИ: не отдаём клиенту детали (там могут быть ключи/URL)
  if (err instanceof OpenAI.APIError) {
    console.error(`[ai] ${err.status ?? '-'} ${err.message}`)
    const message =
      err.status === 401 || err.status === 403
        ? 'Сервис ИИ отклонил ключ доступа'
        : err.status === 429
          ? 'Сервис ИИ перегружен, попробуйте через минуту'
          : 'Сервис ИИ временно недоступен'
    res.status(502).json({ error: message })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
}
