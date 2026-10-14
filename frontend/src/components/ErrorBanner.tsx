import React from 'react'
import { AlertIcon } from './Icons'

interface ErrorBannerProps {
  message: string
  title?: string
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, title = 'Не удалось получить рецепт' }) => {
  return (
    <div className="error" role="alert">
      <div className="error__icon">
        <AlertIcon />
      </div>
      <div>
        <h4 className="error__title">{title}</h4>
        <p className="error__text">{message}</p>
      </div>
    </div>
  )
}
