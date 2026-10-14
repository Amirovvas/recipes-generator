import { rateLimit } from 'express-rate-limit'

const limitReached = { error: 'Слишком много запросов, попробуйте позже' }

// Вход/регистрация: защита от перебора паролей
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: limitReached,
})

// Генерация: каждый запрос стоит денег у провайдера ИИ
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Считаем по пользователю, а не по IP (requireAuth стоит раньше)
  keyGenerator: (req) => req.user?.id ?? 'anonymous',
  message: limitReached,
})
