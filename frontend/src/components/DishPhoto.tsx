import React, { useEffect, useState } from 'react'
import { ApiError } from '../api'
import { useGeneratePhoto } from '../recipes/useRecipes'
import { SavedRecipe } from '../types'
import { ImageIcon, RefreshIcon, SparklesIcon } from './Icons'

interface DishPhotoProps {
  /** null — демо-рецепт: показываем место под фото, но генерировать нечего */
  recipe: SavedRecipe | null
  title: string
  onUpdated?: (recipe: SavedRecipe) => void
}

export const DishPhoto: React.FC<DishPhotoProps> = ({ recipe, title, onUpdated }) => {
  const generate = useGeneratePhoto()
  const [loaded, setLoaded] = useState(false)
  const imageUrl = recipe?.imageUrl ?? null

  // Новая картинка — снова плавно проявляем после загрузки
  useEffect(() => setLoaded(false), [imageUrl])

  const run = () => {
    if (!recipe) return
    generate.mutate(recipe, { onSuccess: (updated) => onUpdated?.(updated) })
  }

  const error = generate.isError
    ? generate.error instanceof ApiError
      ? generate.error.message
      : 'Не удалось нарисовать фото, попробуйте ещё раз'
    : ''

  return (
    <section className="photo">
      <h4 className="block__title">Фото блюда</h4>

      {imageUrl && !generate.isPending ? (
        <figure className="photo__frame">
          <img
            className={loaded ? 'photo__img is-loaded' : 'photo__img'}
            src={imageUrl}
            alt={title}
            onLoad={() => setLoaded(true)}
          />
          <button type="button" className="photo__redo" onClick={run}>
            <RefreshIcon />
            <span>Перерисовать</span>
          </button>
          <figcaption className="photo__caption">Изображение сгенерировано ИИ и может отличаться от готового блюда</figcaption>
        </figure>
      ) : (
        <div className={generate.isPending ? 'photo__placeholder is-pending' : 'photo__placeholder'}>
          {generate.isPending ? (
            <>
              <span className="spinner" />
              <p className="photo__text">
                Раскладываем на тарелке и ставим свет…
                <br />
                <span className="photo__hint">обычно 10–20 секунд</span>
              </p>
            </>
          ) : (
            <>
              <ImageIcon />
              <p className="photo__text">
                {recipe ? 'Посмотрите, как блюдо может выглядеть на тарелке' : 'Здесь появится фото готового блюда'}
              </p>
              <button type="button" className="btn btn--secondary" onClick={run} disabled={!recipe}>
                <SparklesIcon />
                <span>Сгенерировать фото</span>
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="photo__error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
