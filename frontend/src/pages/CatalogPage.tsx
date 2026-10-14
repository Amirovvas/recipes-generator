import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoryId, categories, dishes } from '../data/catalog'
import { DishCard } from '../components/DishCard'
import { BookIcon, XIcon } from '../components/Icons'
import { pluralRecipes } from '../utils/recipe'

type Filter = CategoryId | 'all'

const isCategory = (value: string | null): value is CategoryId => categories.some((c) => c.id === value)

// Ищем по названию, описанию и ингредиентам; регистр и «ё» не важны
const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

export function CatalogPage() {
  // Раздел — в адресе (?c=dinner): кнопка «назад» со страницы блюда вернёт тот же фильтр
  const [params, setParams] = useSearchParams()
  const raw = params.get('c')
  const filter: Filter = isCategory(raw) ? raw : 'all'
  const [query, setQuery] = useState('')

  const setFilter = (next: Filter) => {
    setParams(next === 'all' ? {} : { c: next }, { replace: true })
  }

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    return dishes.filter(
      (d) =>
        (filter === 'all' || d.category === filter) &&
        (!q ||
          normalize(d.title).includes(q) ||
          normalize(d.description).includes(q) ||
          d.ingredients.some((i) => normalize(i).includes(q))),
    )
  }, [filter, query])

  const sections = categories
    .map((c) => ({ ...c, items: visible.filter((d) => d.category === c.id) }))
    .filter((s) => s.items.length > 0)

  return (
    <main className="page__main shell">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">Кулинарная книга</p>
          <h1 className="hero__title">
            Проверенные рецепты <em>на каждый день</em>
          </h1>
          <p className="hero__lead">
            Классика, которую любят дома: от сырников на завтрак до медовика к чаю. Открывайте рецепт и готовьте по
            шагам — отмечайте ингредиенты и этапы прямо по ходу.
          </p>
        </div>
        <div className="catalog-stats" aria-hidden="true">
          <span className="catalog-stats__num">{dishes.length}</span>
          <span className="catalog-stats__label">{pluralRecipes(dishes.length)}</span>
          <span className="catalog-stats__sub">в {categories.length} разделах</span>
        </div>
      </section>

      <div className="catalog-toolbar">
        <div className="catalog-tabs" role="tablist" aria-label="Разделы каталога">
          {([{ id: 'all', title: 'Все' }, ...categories] as { id: Filter; title: string }[]).map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filter === c.id}
              className={filter === c.id ? 'catalog-tab is-active' : 'catalog-tab'}
              onClick={() => setFilter(c.id)}
            >
              {c.title}
              <span className="catalog-tab__count">
                {c.id === 'all' ? dishes.length : dishes.filter((d) => d.category === c.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="catalog-search">
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Блюдо или ингредиент: курица, яблоки…"
            aria-label="Поиск по каталогу"
          />
          {query && (
            <button type="button" className="catalog-search__clear" onClick={() => setQuery('')} aria-label="Очистить поиск">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="panel empty">
          <div className="empty__icon">
            <BookIcon />
          </div>
          <h3 className="empty__title">Ничего не нашлось</h3>
          <p className="empty__text">
            Попробуйте другое слово — или загляните в генератор: он придумает рецепт из любых продуктов.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.id} className="catalog-section" aria-labelledby={`cat-${section.id}`}>
            <header className="catalog-section__head">
              <h2 id={`cat-${section.id}`} className="catalog-section__title">
                {section.title}
              </h2>
              <span className="catalog-section__sub">{section.subtitle}</span>
            </header>
            <div className="dish-grid">
              {section.items.map((dish) => (
                <DishCard key={dish.slug} dish={dish} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
