import React, { useState } from 'react'
import { useLogin, useRegister } from '../auth/useAuth'
import { ApiError } from '../api'
import { ErrorBanner } from './ErrorBanner'
import { KitchenPattern } from './KitchenPattern'
import { ThemeToggle } from './ThemeToggle'
import { CheckIcon, ClockIcon, EyeIcon, EyeOffIcon, MailIcon, UsersIcon, UtensilsIcon } from './Icons'

type Mode = 'login' | 'register'

const MIN_PASSWORD = 8

export const AuthScreen: React.FC = () => {
  const login = useLogin()
  const register = useRegister()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Ошибка проверки формы до отправки
  const [formError, setFormError] = useState('')
  const [confirmEmailFor, setConfirmEmailFor] = useState<string | null>(null)

  const isRegister = mode === 'register'
  const mutation = isRegister ? register : login
  const submitting = mutation.isPending
  const serverError = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : 'Что-то пошло не так, попробуйте ещё раз'
    : ''
  const error = formError || serverError

  const switchMode = (next: Mode) => {
    setMode(next)
    setFormError('')
    setConfirmEmailFor(null)
    login.reset()
    register.reset()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (isRegister && password.length < MIN_PASSWORD) {
      setFormError(`Пароль должен быть не короче ${MIN_PASSWORD} символов`)
      return
    }

    if (isRegister) {
      register.mutate(
        { email, password, name: name.trim() || undefined },
        {
          onSuccess: ({ emailConfirmationRequired }) => {
            if (emailConfirmationRequired) setConfirmEmailFor(email)
          },
        },
      )
    } else {
      login.mutate({ email, password })
    }
  }

  return (
    <div className="auth">
      <ThemeToggle className="auth__theme" />

      {/* Левая панель: настроение кухни */}
      <aside className="auth__art">
        <KitchenPattern />

        <div className="auth__art-inner">
          <div className="brand brand--light">
            <div className="brand__mark">
              <UtensilsIcon />
            </div>
            <span className="brand__name">ChefAI</span>
          </div>

          <div className="auth__pitch">
            <h1 className="auth__headline">
              Из того, что есть в&nbsp;холодильнике — <em>в&nbsp;ужин</em>
            </h1>
            <p className="auth__lead">
              Назовите продукты, а шеф-ассистент предложит блюдо с точными граммовками и пошаговым рецептом.
            </p>
          </div>

          {/* Декоративная карточка рецепта */}
          <div className="note-card" aria-hidden="true">
            <div className="note-card__pin" />
            <div className="note-card__eyebrow">Рецепт дня</div>
            <div className="note-card__title">Шакшука с зеленью</div>
            <div className="note-card__meta">
              <span>
                <ClockIcon /> 20 минут
              </span>
              <span>
                <UsersIcon /> 2 порции
              </span>
            </div>
            <ul className="note-card__list">
              <li className="is-done">
                <span className="note-card__check"><CheckIcon /></span>Яйца — 4 шт.
              </li>
              <li className="is-done">
                <span className="note-card__check"><CheckIcon /></span>Помидоры — 400 г
              </li>
              <li>
                <span className="note-card__check" />Лук репчатый — 1 шт.
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Правая панель: форма */}
      <main className="auth__main">
        <div className="auth__box">
          {confirmEmailFor ? (
            <div className="auth__confirm">
              <div className="empty__icon">
                <MailIcon />
              </div>
              <h2 className="auth__title">Проверьте почту</h2>
              <p className="auth__subtitle">
                Мы отправили ссылку для подтверждения на <strong>{confirmEmailFor}</strong>. После подтверждения
                войдите в аккаунт.
              </p>
              <button type="button" className="btn" onClick={() => switchMode('login')}>
                Перейти ко входу
              </button>
            </div>
          ) : (
            <>
              <div className="segmented" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isRegister}
                  className={!isRegister ? 'segmented__item is-active' : 'segmented__item'}
                  onClick={() => switchMode('login')}
                >
                  Вход
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isRegister}
                  className={isRegister ? 'segmented__item is-active' : 'segmented__item'}
                  onClick={() => switchMode('register')}
                >
                  Регистрация
                </button>
              </div>

              <h2 className="auth__title">{isRegister ? 'Новый повар на кухне' : 'С возвращением'}</h2>
              <p className="auth__subtitle">
                {isRegister
                  ? 'Создайте аккаунт — это займёт полминуты.'
                  : 'Войдите, чтобы продолжить готовить.'}
              </p>

              <form className="auth__form" onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="form-row">
                    <label className="label" htmlFor="name">
                      Имя <span className="label__optional">— необязательно</span>
                    </label>
                    <input
                      id="name"
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="given-name"
                      placeholder="Как к вам обращаться"
                      maxLength={60}
                    />
                  </div>
                )}

                <div className="form-row">
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="chef@example.com"
                    required
                  />
                </div>

                <div className="form-row">
                  <label className="label" htmlFor="password">
                    Пароль
                  </label>
                  <div className="input-wrap">
                    <input
                      id="password"
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      placeholder={isRegister ? `Минимум ${MIN_PASSWORD} символов` : 'Ваш пароль'}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      className="input-wrap__toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {error && <ErrorBanner title={isRegister ? 'Не удалось зарегистрироваться' : 'Не удалось войти'} message={error} />}

                <button type="submit" className="btn" disabled={submitting}>
                  {submitting && <span className="spinner" />}
                  <span>
                    {submitting
                      ? isRegister
                        ? 'Создаём аккаунт…'
                        : 'Входим…'
                      : isRegister
                        ? 'Создать аккаунт'
                        : 'Войти'}
                  </span>
                </button>
              </form>

              <p className="auth__switch">
                {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
                <button type="button" className="link" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                  {isRegister ? 'Войти' : 'Зарегистрироваться'}
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
