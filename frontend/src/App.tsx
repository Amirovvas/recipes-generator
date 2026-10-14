import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { AuthScreen } from './components/AuthScreen'
import { AppLayout } from './components/AppLayout'
import { GeneratorPage } from './pages/GeneratorPage'
import { CatalogPage } from './pages/CatalogPage'
import { DishPage } from './pages/DishPage'

export default function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="splash">
        <span className="spinner" />
      </div>
    )
  }

  if (status !== 'authenticated') return <AuthScreen />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<GeneratorPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:slug" element={<DishPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
