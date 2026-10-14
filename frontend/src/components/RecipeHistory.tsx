import React, { useState } from 'react'
import { ApiError } from '../api'
import { useDeleteRecipe, useRecipeHistory } from '../recipes/useRecipes'
import { SavedRecipe } from '../types'
import { BookIcon, ClockIcon, TrashIcon } from './Icons'

interface RecipeHistoryProps {
  activeId: string | null
  onSelect: (recipe: SavedRecipe) => void
  onDeleted: (recipe: SavedRecipe) => void
}

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const dayYearFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

// «Сегодня, 14:38» / «Вчера, 09:10» / «12 окт.» / «12 окт. 2025 г.»
const formatDate = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return `Сегодня, ${timeFormat.format(date)}`
  if (diffDays === 1) return `Вчера, ${timeFormat.format(date)}`
  return date.getFullYear() === today.getFullYear() ? dayFormat.format(date) : dayYearFormat.format(date)
}

export const RecipeHistory: React.FC<RecipeHistoryProps> = ({ activeId, onSelect, onDeleted }) => {
  const history = useRecipeHistory()
  const remove = useDeleteRecipe()
  // Рецепт, для которого показано «Удалить?» вместо обычной строки
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const items = history.data?.pages.flatMap((page) => page.items) ?? []

  const handleDelete = (recipe: SavedRecipe) => {
    remove.mutate(recipe, {
      onSuccess: () => {
        setConfirmId(null)
        onDeleted(recipe)
      },
    })
  }

  return (
    <section className="panel history" aria-labelledby="history-title">
      <header className="history__head">
        <h2 id="history-title" className="history__title">
          <BookIcon />
          Моя кулинарная книга
        </h2>
        {items.length > 0 && <span className="history__count">{items.length}{history.hasNextPage ? '+' : ''}</span>}
      </header>

      {history.isPending && (
        <div className="history__loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="history__sk">
              <div className="sk sk--line sk--w80" />
              <div className="sk sk--line sk--w40" />
            </div>
          ))}
        </div>
      )}

      {history.isError && (
        <div className="history__state">
          <p>Не удалось загрузить историю.</p>
          <button type="button" className="link" onClick={() => history.refetch()}>
            Повторить
          </button>
        </div>
      )}

      {history.isSuccess && items.length === 0 && (
        <div className="history__state">
          <span className="history__state-icon">
            <BookIcon />
          </span>
          <p>Здесь появится ваша кулинарная книга — каждый сгенерированный рецепт сохраняется автоматически.</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="history__list">
          {items.map((recipe) => {
            const isActive = recipe.id === activeId

            if (confirmId === recipe.id) {
              const isDeleting = remove.isPending && remove.variables?.id === recipe.id
              return (
                <li key={recipe.id} className="history__item history__item--confirm">
                  <span className="history__confirm-text">Удалить «{recipe.title}»?</span>
                  <div className="history__confirm-actions">
                    <button
                      type="button"
                      className="history__btn history__btn--danger"
                      onClick={() => handleDelete(recipe)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Удаляем…' : 'Удалить'}
                    </button>
                    <button
                      type="button"
                      className="history__btn"
                      onClick={() => setConfirmId(null)}
                      disabled={isDeleting}
                    >
                      Отмена
                    </button>
                  </div>
                  {remove.isError && remove.variables?.id === recipe.id && (
                    <span className="history__confirm-error">
                      {remove.error instanceof ApiError ? remove.error.message : 'Не удалось удалить'}
                    </span>
                  )}
                </li>
              )
            }

            return (
              <li key={recipe.id} className={isActive ? 'history__item is-active' : 'history__item'}>
                <button
                  type="button"
                  className="history__open"
                  onClick={() => onSelect(recipe)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="history__name">
                    {recipe.imageUrl && <img className="history__thumb" src={recipe.imageUrl} alt="" loading="lazy" />}
                    <span className="history__name-text">{recipe.title}</span>
                  </span>
                  <span className="history__meta">
                    <span>{formatDate(recipe.createdAt)}</span>
                    <span className="history__dot" />
                    <span className="history__time">
                      <ClockIcon /> {recipe.cookingTime}
                    </span>
                  </span>
                  {recipe.sourceIngredients.length > 0 && (
                    <span className="history__source">{recipe.sourceIngredients.join(', ')}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="history__delete"
                  onClick={() => {
                    remove.reset()
                    setConfirmId(recipe.id)
                  }}
                  aria-label={`Удалить рецепт «${recipe.title}»`}
                  title="Удалить"
                >
                  <TrashIcon />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {history.hasNextPage && (
        <div className="history__more">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => history.fetchNextPage()}
            disabled={history.isFetchingNextPage}
          >
            {history.isFetchingNextPage && <span className="spinner" />}
            <span>{history.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}</span>
          </button>
        </div>
      )}
    </section>
  )
}
