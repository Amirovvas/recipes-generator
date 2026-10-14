import React, { useState } from 'react'
import { XIcon } from './Icons'
import { suggestions } from '../data/suggestions'

interface ComposerProps {
  onGenerate: (ingredients: string) => void
  isLoading: boolean
}

export const Composer: React.FC<ComposerProps> = ({ onGenerate, isLoading }) => {
  const [value, setValue] = useState('')

  const handleChipClick = (item: string) => {
    if (!value.trim()) {
      setValue(item)
    } else {
      // Аккуратно добавляем через запятую с пробелом
      const items = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!items.includes(item)) {
        setValue([...items, item].join(', '))
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onGenerate(value)
    }
  }

  return (
    <div className="panel composer">
      <form onSubmit={handleSubmit}>
        <h2 className="composer__title">Ингредиенты</h2>
        <p className="composer__note">Перечислите продукты через запятую.</p>

        <label className="label" htmlFor="ingredients">
          Список продуктов
        </label>
        <div className="field">
          <textarea
            id="ingredients"
            className="field__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: картофель, яйца, сыр, курица"
            rows={4}
            disabled={isLoading}
          />
          {value && !isLoading && (
            <button
              type="button"
              className="field__clear"
              onClick={() => setValue('')}
              title="Очистить"
              aria-label="Очистить"
            >
              <XIcon />
            </button>
          )}
        </div>

        <div className="chips__label">Часто используемые</div>
        <div className="chips">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="chip"
              onClick={() => handleChipClick(item)}
              disabled={isLoading}
            >
              <span className="chip__plus">+</span>
              {item}
            </button>
          ))}
        </div>

        <div className="actions">
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading && <span className="spinner" />}
            <span>{isLoading ? 'Готовим рецепт…' : 'Сгенерировать рецепт'}</span>
          </button>
          <p className="hint">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> — быстрый запуск
          </p>
        </div>
      </form>
    </div>
  )
}
