import React from 'react'

/** Орнамент-разделитель: линия — венчик, ложка, листик — линия. */
export const KitchenDivider: React.FC = () => (
  <div className="kitchen-divider" aria-hidden="true">
    <span className="kitchen-divider__line" />
    <svg viewBox="0 0 96 24" width="96" height="24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Венчик */}
      <g stroke="currentColor" strokeWidth="1.4">
        <path d="M14 3c-4 4-4 10 0 13c4-3 4-9 0-13zM14 3c-1.6 4-1.6 9 0 13M14 16v6" />
      </g>
      {/* Ложка */}
      <g stroke="currentColor" strokeWidth="1.4">
        <ellipse cx="48" cy="7" rx="3.6" ry="5" />
        <path d="M48 12v10" />
      </g>
      {/* Листик */}
      <g stroke="var(--accent)" strokeWidth="1.4">
        <path d="M74 20c2-9 10-14 16-15c-1 7-6 15-16 15zM75 19l10-9" />
      </g>
    </svg>
    <span className="kitchen-divider__line" />
  </div>
)
