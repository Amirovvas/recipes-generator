import { Router, type Request } from 'express'
import { describeDishForImage, generateRecipe } from '../ai.js'
import { generateDishImage } from '../images.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import { recipesRepo } from '../recipesRepo.js'
import { generateRecipeInput, listRecipesInput, recipeIdParam } from '../schemas.js'

// Все маршруты за requireAuth (см. index.ts): req.user и req.accessToken есть всегда
export const recipesRouter = Router()

const repo = (req: Request) => recipesRepo(req.accessToken!, req.user!.id)

// POST /api/recipes  { ingredients: string[] } → SavedRecipe
// Генерирует рецепт и сразу сохраняет в историю
recipesRouter.post('/', aiLimiter, async (req, res) => {
  const { ingredients } = generateRecipeInput.parse(req.body)
  const recipe = await generateRecipe(ingredients)
  const saved = await repo(req).create(recipe, ingredients)
  res.status(201).json(saved)
})

// GET /api/recipes?limit=20&before=<createdAt> → { items, nextCursor }
recipesRouter.get('/', async (req, res) => {
  const { limit, before } = listRecipesInput.parse(req.query)
  res.json(await repo(req).list(limit, before))
})

// GET /api/recipes/:id → SavedRecipe
recipesRouter.get('/:id', async (req, res) => {
  const { id } = recipeIdParam.parse(req.params)
  res.json(await repo(req).get(id))
})

// POST /api/recipes/:id/image → SavedRecipe с imageUrl
// Рисует фото блюда, кладёт в Storage и привязывает к рецепту. Повторный вызов — новое фото
recipesRouter.post('/:id/image', aiLimiter, async (req, res) => {
  const { id } = recipeIdParam.parse(req.params)
  const recipes = repo(req)

  // Сначала убеждаемся, что рецепт свой (RLS) — не тратим генерацию на чужой id
  const recipe = await recipes.get(id)
  const dish = await describeDishForImage(recipe.title, recipe.description)
  const image = await generateDishImage(dish)

  res.json(await recipes.setPhoto(recipe, image))
})

// DELETE /api/recipes/:id → 204 (вместе с фото)
recipesRouter.delete('/:id', async (req, res) => {
  const { id } = recipeIdParam.parse(req.params)
  await repo(req).remove(id)
  res.status(204).end()
})
