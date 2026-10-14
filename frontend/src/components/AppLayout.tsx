import React, { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth, useLogout } from '../auth/useAuth'
import { ThemeToggle } from './ThemeToggle'
import { KitchenPattern } from './KitchenPattern'
import { KitchenDivider } from './KitchenDivider'
import { BookIcon, LogOutIcon, SparklesIcon, UtensilsIcon } from './Icons'

const initials = (nameOrEmail: string) =>
  nameOrEmail
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav__link is-active' : 'nav__link')

/** Общий каркас страниц: шапка с навигацией, узор, подвал */
export const AppLayout: React.FC = () => {
  const { user } = useAuth()
  const logout = useLogout()
  const { pathname } = useLocation()

  const displayName = user?.name || user?.email || ''

  // Новая страница открывается с начала, а не с позиции прокрутки предыдущей
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="page">
      <header className="topbar">
        <div className="shell topbar__inner">
          <div className="topbar__left">
            <NavLink to="/" className="brand" aria-label="ChefAI — на главную">
              <div className="brand__mark">
                <UtensilsIcon />
              </div>
              <span className="brand__name">ChefAI</span>
            </NavLink>

            <nav className="nav" aria-label="Разделы">
              <NavLink to="/" end className={navClass}>
                <SparklesIcon />
                <span>Генератор</span>
              </NavLink>
              <NavLink to="/catalog" className={navClass}>
                <BookIcon />
                <span>Каталог</span>
              </NavLink>
            </nav>
          </div>

          <div className="user">
            <ThemeToggle />
            <span className="user__avatar" aria-hidden="true">
              {initials(displayName)}
            </span>
            <span className="user__name">{displayName}</span>
            <button
              type="button"
              className="user__logout"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOutIcon />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Бледный узор утвари за шапкой страницы, растворяется книзу */}
      <div className="page__pattern" aria-hidden="true">
        <KitchenPattern id="kitchen-page" className="page__pattern-svg" />
      </div>

      <Outlet />

      <div className="shell">
        <KitchenDivider />
      </div>

      <footer className="footer">
        <div className="shell footer__inner">
          <span>
            © 2026 ChefAI · <span className="footer__wish">Приятного аппетита!</span>
          </span>
          <span>Проверяйте время и температуру приготовления — духовки бывают разными.</span>
        </div>
      </footer>
    </div>
  )
}
