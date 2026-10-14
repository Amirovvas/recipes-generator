import React, { useRef, useState } from 'react'
import { ApiError } from '../api'
import { useAuth } from '../auth/useAuth'
import { useGenerateRecipe } from '../recipes/useRecipes'
import { SavedRecipe, Status } from '../types'
import { demoRecipe } from '../data/demoRecipe'
import { RecipeHistory } from '../components/RecipeHistory'
import { SteamPot } from '../components/SteamPot'
import { Composer } from '../components/Composer'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeSkeleton } from '../components/RecipeSkeleton'
import { ErrorBanner } from '../components/ErrorBanner'
import { RefreshIcon } from '../components/Icons'

export function GeneratorPage() {
  const { user } = useAuth()
  // useMutation хранит только результат последнего вызова — устаревший ответ не перетрёт свежий
  const generate = useGenerateRecipe()
  // Ошибка проверки ввода до отправки
  const [inputError, setInputError] = useState('')
  // Рецепт в правой колонке: только что сгенерированный или открытый из истории
  const [current, setCurrent] = useState<{ recipe: SavedRecipe; fromHistory: boolean } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)


  const status: Status = inputError
    ? 'error'
    : generate.isPending
      ? 'loading'
      : generate.isError
        ? 'error'
        : current
          ? 'success'
          : 'idle'

  const errorMessage =
    inputError ||
    (generate.error instanceof ApiError ? generate.error.message : 'Что-то пошло не так, попробуйте ещё раз')

  // На узком экране результат ниже формы и истории — подкручиваем к нему
  const revealResult = () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleGenerate = (ingredientsStr: string) => {
    const list = ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (list.length === 0) {
      generate.reset()
      setInputError('Введите хотя бы один продукт или выберите из списка подсказок.')
      return
    }

    setInputError('')
    generate.mutate(list, {
      onSuccess: (recipe) => setCurrent({ recipe, fromHistory: false }),
    })
    revealResult()
  }

  const handleSelect = (recipe: SavedRecipe) => {
    generate.reset()
    setInputError('')
    setCurrent({ recipe, fromHistory: true })
    revealResult()
  }

  const handleDeleted = (recipe: SavedRecipe) => {
    setCurrent((prev) => (prev?.recipe.id === recipe.id ? null : prev))
  }

  return (
    <main className="page__main shell">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">{user?.name ? `${user.name}, что готовим?` : 'Кулинарный ассистент'}</p>
          <h1 className="hero__title">
            Рецепт из того, что есть <em>под рукой</em>
          </h1>
          <p className="hero__lead">
            Укажите доступные продукты — модель подберёт блюдо, рассчитает ингредиенты и распишет шаги приготовления.
          </p>
        </div>
        <SteamPot />
      </section>

      <div className="layout">
        {/* Левая колонка: ввод продуктов */}
        <div className="layout__aside">
          <Composer onGenerate={handleGenerate} isLoading={status === 'loading'} />

          {status === 'error' && <ErrorBanner message={errorMessage} />}

          <RecipeHistory
            activeId={current?.recipe.id ?? null}
            onSelect={handleSelect}
            onDeleted={handleDeleted}
          />
        </div>

        {/* Правая колонка: результат / скелетон / пустое состояние */}
        <div className="layout__result" ref={resultRef}>
          {status === 'idle' && <RecipeCard recipe={demoRecipe} titleBadge="Пример рецепта" />}

          {status === 'loading' && <RecipeSkeleton />}

          {/* key сбрасывает отметки ингредиентов при смене рецепта */}
          {status === 'success' && current && (
            <RecipeCard
              key={current.recipe.id}
              recipe={current.recipe}
              titleBadge={current.fromHistory ? 'Из истории' : undefined}
              onRecipeUpdated={(updated) =>
                setCurrent((prev) => (prev?.recipe.id === updated.id ? { ...prev, recipe: updated } : prev))
              }
            />
          )}

          {status === 'error' && (
            <div className="panel empty">
              <div className="empty__icon">
                <RefreshIcon />
              </div>
              <h3 className="empty__title">Рецепт не сгенерирован</h3>
              <p className="empty__text">
                Проверьте список продуктов и попробуйте ещё раз — иногда со второй попытки получается вкуснее.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
