import React, { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categories, dishes, findDish, formatTime } from '../data/catalog'
import { DishCard } from '../components/DishCard'
import { BookIcon, CheckIcon, ClockIcon, RefreshIcon, UsersIcon } from '../components/Icons'
import { pluralServings, splitIngredient } from '../utils/recipe'

const toggleIn = (set: Set<number>, idx: number) => {
  const next = new Set(set)
  if (next.has(idx)) next.delete(idx)
  else next.add(idx)
  return next
}

export function DishPage() {
  const { slug } = useParams()
  const dish = findDish(slug)

  if (!dish) {
    return (
      <main className="page__main shell">
        <div className="panel empty">
          <div className="empty__icon">
            <BookIcon />
          </div>
          <h1 className="empty__title">Рецепт не найден</h1>
          <p className="empty__text">Возможно, ссылка устарела. Загляните в каталог — там много вкусного.</p>
          <Link to="/catalog" className="btn btn--secondary">
            Открыть каталог
          </Link>
        </div>
      </main>
    )
  }

  // key: при переходе к другому блюду состояние готовки сбрасывается
  return <DishView key={dish.slug} slug={dish.slug} />
}

function DishView({ slug }: { slug: string }) {
  const dish = findDish(slug)!
  const category = categories.find((c) => c.id === dish.category)!
  const more = dishes.filter((d) => d.category === dish.category && d.slug !== dish.slug).slice(0, 3)

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(() => new Set())
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set())
  const stepsRef = useRef<HTMLElement>(null)

  const total = dish.steps.length
  const progress = Math.round((doneSteps.size / total) * 100)
  const allDone = doneSteps.size === total
  // Текущий шаг — первый невыполненный: его подсвечиваем
  const currentStep = dish.steps.findIndex((_, i) => !doneSteps.has(i))

  const reset = () => {
    setDoneSteps(new Set())
    setCheckedIngredients(new Set())
  }

  return (
    <main className="page__main shell dish">
      <nav className="dish__crumbs" aria-label="Навигация">
        <Link to="/catalog">Каталог</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/catalog?c=${category.id}`}>{category.title}</Link>
      </nav>

      <section className="dish__hero">
        <figure className="dish__photo">
          <img src={dish.photo.src} alt={dish.title} />
          <figcaption className="dish__credit">
            Фото:{' '}
            <a href={dish.photo.source} target="_blank" rel="noreferrer noopener">
              {dish.photo.author}
            </a>
            {' · '}
            {dish.photo.licenseUrl ? (
              <a href={dish.photo.licenseUrl} target="_blank" rel="noreferrer noopener">
                {dish.photo.license}
              </a>
            ) : (
              dish.photo.license
            )}
            , Wikimedia Commons
          </figcaption>
        </figure>

        <div className="dish__intro">
          <p className="hero__eyebrow">{category.title}</p>
          <h1 className="dish__title">{dish.title}</h1>
          <p className="dish__desc">{dish.description}</p>

          <dl className="dish__facts">
            <div>
              <dt>
                <ClockIcon /> Время
              </dt>
              <dd>{formatTime(dish.time)}</dd>
            </div>
            <div>
              <dt>
                <UsersIcon /> Порции
              </dt>
              <dd>
                {dish.servings} {pluralServings(dish.servings)}
              </dd>
            </div>
            <div>
              <dt>Сложность</dt>
              <dd>{dish.difficulty}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="btn dish__start"
            onClick={() => stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Начать готовить
          </button>
        </div>
      </section>

      <div className="dish__body">
        <aside className="panel dish__ingredients">
          <h2 className="dish__section-title">
            Ингредиенты
            {checkedIngredients.size > 0 && (
              <span className="block__counter">
                {checkedIngredients.size} из {dish.ingredients.length}
              </span>
            )}
          </h2>
          <p className="dish__hint">Отмечайте, что уже подготовили</p>
          <ul className="ingredients">
            {dish.ingredients.map((ing, idx) => {
              const [name, qty] = splitIngredient(ing)
              const isChecked = checkedIngredients.has(idx)
              return (
                <li key={idx}>
                  <button
                    type="button"
                    className={isChecked ? 'ingredient is-checked' : 'ingredient'}
                    onClick={() => setCheckedIngredients((s) => toggleIn(s, idx))}
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
        </aside>

        <section className="panel dish__steps" ref={stepsRef} aria-labelledby="steps-title">
          <header className="cook__head">
            <h2 id="steps-title" className="dish__section-title">
              Приготовление
            </h2>
            <span className="cook__count">
              {doneSteps.size} из {total}
            </span>
          </header>

          <div
            className="cook__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Прогресс приготовления"
          >
            <span style={{ width: `${progress}%` }} />
          </div>

          <ol className="cook__steps">
            {dish.steps.map((step, idx) => {
              const done = doneSteps.has(idx)
              const state = done ? 'is-done' : idx === currentStep ? 'is-current' : ''
              return (
                <li key={idx} className={`cook__step ${state}`}>
                  <button
                    type="button"
                    className="cook__step-btn"
                    onClick={() => setDoneSteps((s) => toggleIn(s, idx))}
                    aria-pressed={done}
                  >
                    <span className="cook__num">{done ? <CheckIcon /> : idx + 1}</span>
                    <span className="cook__text">
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {allDone && (
            <div className="cook__done" role="status">
              <p className="cook__done-title">Готово! Приятного аппетита</p>
              <p className="cook__done-text">Вы прошли все шаги рецепта «{dish.title}».</p>
              <button type="button" className="btn btn--secondary" onClick={reset}>
                <RefreshIcon />
                <span>Начать заново</span>
              </button>
            </div>
          )}

          <aside className="chef-tip">
            <span className="chef-tip__label">Совет шефа</span>
            <p>{dish.tip}</p>
          </aside>
        </section>
      </div>

      {more.length > 0 && (
        <section className="catalog-section" aria-labelledby="more-title">
          <header className="catalog-section__head">
            <h2 id="more-title" className="catalog-section__title">
              Ещё — {category.title.toLowerCase()}
            </h2>
            <Link to={`/catalog?c=${category.id}`} className="link">
              Весь раздел →
            </Link>
          </header>
          <div className="dish-grid">
            {more.map((d) => (
              <DishCard key={d.slug} dish={d} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
