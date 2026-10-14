import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { recipesRouter } from './routes/recipes.js'
import { authRouter } from './routes/auth.js'
import { errorHandler } from './errors.js'
import { requireAuth } from './middleware/auth.js'
import { authLimiter } from './middleware/rateLimit.js'

const app = express()

// За прокси (Render, Railway, nginx) — чтобы лимиты считались по реальному IP.
// Без прокси не включать: иначе IP подделывается заголовком X-Forwarded-For
app.set('trust proxy', config.trustProxy)

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiEnabled: Boolean(config.ai),
    textModel: config.ai?.textModel ?? null,
    imageProvider: config.image.provider,
  })
})

app.use('/api/auth', authLimiter, authRouter)
// aiLimiter — только на генерацию (внутри роутера), история не лимитируется
app.use('/api/recipes', requireAuth, recipesRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Не найдено' })
})

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`API запущен: http://localhost:${config.port}`)
})
