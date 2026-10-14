import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'chefai.theme'
const META_COLORS: Record<Theme, string> = { light: '#f8f5ef', dark: '#161412' }

const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

const savedTheme = (): Theme | null => {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

const apply = (theme: Theme, animate: boolean) => {
  const root = document.documentElement
  if (animate) {
    // Временный класс включает плавный переход цветов только на момент переключения
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
  }
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme])
}

/** Тема: выбор пользователя из localStorage, иначе — системная. Начальную ставит скрипт в index.html */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || systemTheme())

  // Пока пользователь сам не выбрал тему — следуем за системой
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (savedTheme()) return
      const next = systemTheme()
      apply(next, true)
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    apply(next, true)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
