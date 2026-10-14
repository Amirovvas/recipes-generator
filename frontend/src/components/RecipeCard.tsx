import React, { useState } from 'react'
import { Recipe, SavedRecipe } from '../types'
import { DishPhoto } from './DishPhoto'
import { pluralServings, splitIngredient } from '../utils/recipe'
import { CheckIcon, ClockIcon, ListIcon, UsersIcon } from './Icons'

interface RecipeCardProps {
  /** Recipe — демо без фото; SavedRecipe — рецепт из истории, ему можно нарисовать фото */
  recipe: Recipe | SavedRecipe
  titleBadge?: string
  onRecipeUpdated?: (recipe: SavedRecipe) => void
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  titleBadge = 'Сгенерировано ИИ',
  onRecipeUpdated,
}) => {
  const isAi = titleBadge === 'Сгенерировано ИИ'
  // Отметки «уже есть / уже добавил» — как галочки на листке с рецептом
  const [checked, setChecked] = useState<Set<number>>(() => new Set())

  const toggle = (idx: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })

  return (
    <div className="result">
      <div className="result__head">
        <h2 className="result__title">Рецепт</h2>
        <span className={isAi ? 'tag tag--accent' : 'tag'}>{titleBadge}</span>
      </div>

      <article className="panel recipe">
        <header className="recipe__header">
          <h3 className="recipe__title">{recipe.title}</h3>
          <p className="recipe__desc">{recipe.description}</p>
        </header>

        <div className="meta">
          <div className="meta__item">
            <div className="meta__label">
              <ClockIcon />
              Время
            </div>
            <div className="meta__value">{recipe.cookingTime}</div>
          </div>
          <div className="meta__item">
            <div className="meta__label">
              <UsersIcon />
              Порции
            </div>
            <div className="meta__value">
              {recipe.servings} {pluralServings(recipe.servings)}
            </div>
          </div>
          <div className="meta__item">
            <div className="meta__label">
              <ListIcon />
              Ингредиенты
            </div>
            <div className="meta__value">{recipe.ingredients.length} шт.</div>
          </div>
        </div>

        <div className="recipe__cols">
          <section className="recipe__col">
            <h4 className="block__title">
              Ингредиенты
              {checked.size > 0 && (
                <span className="block__counter">
                  {checked.size} из {recipe.ingredients.length}
                </span>
              )}
            </h4>
            <ul className="ingredients">
              {recipe.ingredients.map((ing, idx) => {
                const [name, qty] = splitIngredient(ing)
                const isChecked = checked.has(idx)
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      className={isChecked ? 'ingredient is-checked' : 'ingredient'}
                      onClick={() => toggle(idx)}
                      aria-pressed={isChecked}
                    >
                      <span className="ingredient__box">{isChecked && <CheckIcon />}</span>
                      <span className="ingredient__name">{name}</span>
                      {qty && <span className="ingredients__qty">{qty}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="recipe__col">
            <h4 className="block__title">Приготовление</h4>
            <ol className="steps">
              {recipe.steps.map((step, idx) => (
                <li key={idx}>
                  <strong>{step.title}.</strong> {step.text}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <DishPhoto recipe={'id' in recipe ? recipe : null} title={recipe.title} onUpdated={onRecipeUpdated} />
      </article>
    </div>
  )
}
