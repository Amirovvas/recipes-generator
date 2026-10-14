import 'dotenv/config'
import type OpenAI from 'openai'

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Не задана переменная окружения ${name} (см. .env.example)`)
  }
  return value
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  // Число прокси перед сервером (0 — запуск напрямую)
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? 'http://localhost:5173',
  supabase: {
    url: required('SUPABASE_URL'),
    // Публичный ключ (sb_publishable_... или legacy anon). Service role здесь не нужен
    publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
    // Куда ведёт ссылка из письма подтверждения email
    emailRedirectTo: process.env.AUTH_EMAIL_REDIRECT_TO?.trim() || undefined,
  },
  // ИИ необязателен: без него работает auth, а генерация отвечает 503
  ai: readAiConfig(),
  image: readImageConfig(),
}

// Фото блюда. С IMAGE_API_KEY — любой OpenAI-совместимый API картинок
// (по умолчанию Pollinations). Без ключа — бесплатный анонимный Pollinations с водяным знаком
function readImageConfig() {
  const apiKey = process.env.IMAGE_API_KEY?.trim() || null
  return {
    apiKey,
    baseURL: process.env.IMAGE_BASE_URL?.trim() || 'https://gen.pollinations.ai/v1',
    model: process.env.IMAGE_MODEL?.trim() || 'black-forest-labs/flux.1-schnell',
    size: process.env.IMAGE_SIZE?.trim() || '1024x1024',
    provider: apiKey ? ('openai-compatible' as const) : ('pollinations-anonymous' as const),
  }
}

function readAiConfig() {
  const baseURL = process.env.AI_BASE_URL?.trim()
  const apiKey = process.env.AI_API_KEY?.trim()
  const textModel = process.env.AI_TEXT_MODEL?.trim()

  if (!baseURL || !apiKey || !textModel) {
    console.warn('[config] AI_BASE_URL / AI_API_KEY / AI_TEXT_MODEL не заданы — генерация рецептов отключена')
    return null
  }

  return {
    baseURL,
    apiKey,
    textModel,
    // Глубина «размышлений» модели: low — быстрее, high — тщательнее. Пусто — по умолчанию у модели
    reasoningEffort: (process.env.AI_REASONING_EFFORT?.trim() || null) as OpenAI.ReasoningEffort | null,
  }
}
