import OpenAI from 'openai'
import { config } from './config.js'
import { HttpError } from './errors.js'

export interface GeneratedImage {
  data: Buffer
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
}

const TIMEOUT_MS = 60_000
const MAX_BYTES = 5 * 1024 * 1024 // как file_size_limit у bucket dish-photos

const buildPrompt = (dish: string) =>
  [
    `Professional food photography: ${dish}`,
    'Served on a ceramic plate on a rustic wooden table, natural soft window light,',
    'shallow depth of field, 45-degree angle, appetizing, realistic, high detail.',
    'No text, no people, no hands.',
  ].join(' ')

const detectType = (bytes: Buffer): GeneratedImage['contentType'] | null => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
  if (bytes.subarray(0, 4).toString('hex') === '89504e47') return 'image/png'
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  return null
}

// Проверяем по сигнатуре файла, а не по заголовку: сервис может вернуть HTML с ошибкой и 200
const toImage = (bytes: Buffer): GeneratedImage => {
  if (bytes.length > MAX_BYTES) throw new HttpError(502, 'Сервис вернул слишком большое изображение')
  const contentType = detectType(bytes)
  if (!contentType) throw new HttpError(502, 'Сервис изображений вернул не картинку')
  return { data: bytes, contentType }
}

const download = async (url: string, headers: Record<string, string> = {}): Promise<Buffer> => {
  let res: Response
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new HttpError(504, 'Фото рисуется слишком долго, попробуйте ещё раз')
    }
    throw new HttpError(502, 'Сервис изображений недоступен')
  }
  if (res.status === 429) throw new HttpError(429, 'Сервис изображений перегружен, попробуйте через минуту')
  // Анонимный Pollinations отвечает 402, когда бесплатная квота на IP исчерпана
  if (res.status === 402) {
    throw new HttpError(429, 'Бесплатный лимит фото временно исчерпан — попробуйте через пару минут')
  }
  if (!res.ok) {
    console.error(`[image] ${res.status} ${new URL(url).host}`)
    throw new HttpError(502, 'Сервис изображений временно недоступен')
  }
  return Buffer.from(await res.arrayBuffer())
}

// Бесплатно и без ключа, но с водяным знаком сервиса
const generateAnonymous = async (prompt: string): Promise<GeneratedImage> => {
  const params = new URLSearchParams({
    width: '1024',
    height: '768',
    model: 'flux',
    nologo: 'true',
    seed: String(Math.floor(Math.random() * 1_000_000)),
  })
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`
  return toImage(await download(url))
}

const generateWithKey = async (prompt: string): Promise<GeneratedImage> => {
  const { apiKey, baseURL, model, size } = config.image
  const client = new OpenAI({ apiKey: apiKey!, baseURL, timeout: TIMEOUT_MS, maxRetries: 0 })

  const result = await client.images.generate({
    model,
    prompt,
    n: 1,
    size: size as OpenAI.Images.ImageGenerateParams['size'],
  })

  const image = result.data?.[0]
  if (image?.b64_json) return toImage(Buffer.from(image.b64_json, 'base64'))
  if (image?.url) return toImage(await download(image.url))
  throw new HttpError(502, 'Сервис изображений не вернул картинку')
}

export const generateDishImage = (dishDescription: string): Promise<GeneratedImage> => {
  const prompt = buildPrompt(dishDescription)
  return config.image.provider === 'openai-compatible' ? generateWithKey(prompt) : generateAnonymous(prompt)
}
