import React from 'react'
import { Link } from 'react-router-dom'
import { Dish, categories, formatTime } from '../data/catalog'
import { pluralServings } from '../utils/recipe'
import { ClockIcon, UsersIcon } from './Icons'

const categoryTitle = (id: Dish['category']) => categories.find((c) => c.id === id)?.title ?? ''

export const DishCard: React.FC<{ dish: Dish; showCategory?: boolean }> = ({ dish, showCategory = false }) => (
  <Link to={`/catalog/${dish.slug}`} className="dish-card">
    <div className="dish-card__media">
      <img src={dish.photo.src} alt={dish.title} loading="lazy" decoding="async" />
      <span className={`dish-card__level dish-card__level--${dish.difficulty === 'Легко' ? 'easy' : dish.difficulty === 'Средне' ? 'mid' : 'hard'}`}>
        {dish.difficulty}
      </span>
    </div>
    <div className="dish-card__body">
      {showCategory && <span className="dish-card__category">{categoryTitle(dish.category)}</span>}
      <h3 className="dish-card__title">{dish.title}</h3>
      <p className="dish-card__desc">{dish.description}</p>
      <div className="dish-card__meta">
        <span>
          <ClockIcon /> {formatTime(dish.time)}
        </span>
        <span>
          <UsersIcon /> {dish.servings} {pluralServings(dish.servings)}
        </span>
      </div>
    </div>
  </Link>
)
