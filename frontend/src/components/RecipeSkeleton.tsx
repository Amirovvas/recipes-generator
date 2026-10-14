import React, { useEffect, useState } from 'react'

// Пока модель думает — немного кухонной жизни вместо одной сухой строки
const PHRASES = [
  'Заглядываем в холодильник…',
  'Разогреваем сковороду…',
  'Нарезаем лук…',
  'Подбираем специи…',
  'Взвешиваем ингредиенты…',
  'Пробуем на соль…',
]

export const RecipeSkeleton: React.FC = () => {
  const [phrase, setPhrase] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setPhrase((i) => (i + 1) % PHRASES.length), 1600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="result">
      <div className="result__head">
        <h2 className="result__title">Рецепт</h2>
        <span className="tag">Генерация…</span>
      </div>

      <div className="panel recipe" aria-busy="true">
        <div className="recipe__header">
          <div className="sk sk--title" />
          <div className="sk sk--line sk--w80" />
          <div className="sk sk--line sk--w60" />
          <div className="skeleton__status">
            <span className="spinner" />
            <span key={phrase} className="skeleton__phrase" aria-live="polite">
              {PHRASES[phrase]}
            </span>
          </div>
        </div>

        <div className="recipe__cols">
          <div className="recipe__col">
            <div className="sk sk--head" />
            <div className="sk sk--line sk--w80" />
            <div className="sk sk--line sk--w60" />
            <div className="sk sk--line sk--w80" />
            <div className="sk sk--line sk--w40" />
          </div>
          <div className="recipe__col">
            <div className="sk sk--head" />
            <div className="sk sk--line" />
            <div className="sk sk--line sk--w80" />
            <div className="sk sk--line sk--w60" />
            <div className="sk sk--line sk--w80" />
          </div>
        </div>
      </div>
    </div>
  )
}
