import React from 'react'

/** Фоновый узор из контурной кухонной утвари: венчик, ложка, лист, перец, яйцо, кастрюля. */
export const KitchenPattern: React.FC<{ id?: string; className?: string }> = ({
  id = 'kitchen',
  className = 'kitchen-pattern',
}) => (
  <svg className={className} aria-hidden="true" width="100%" height="100%">
    <defs>
      <pattern id={id} width="220" height="220" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Венчик */}
          <g transform="translate(24 18)">
            <path d="M14 0c-9 10-9 30 0 40c9-10 9-30 0-40z" />
            <path d="M14 0c-4 10-4 30 0 40M14 0c4 10 4 30 0 40" />
            <path d="M14 40v26" />
          </g>
          {/* Ложка */}
          <g transform="translate(120 10) rotate(30)">
            <ellipse cx="10" cy="12" rx="9" ry="12" />
            <path d="M10 24v40" />
          </g>
          {/* Лист базилика */}
          <g transform="translate(150 120)">
            <path d="M0 30C6 8 30 2 40 0c-2 12-10 34-38 32z" />
            <path d="M2 30L28 10" />
          </g>
          {/* Перец чили */}
          <g transform="translate(40 130) rotate(-20)">
            <path d="M6 6c10 4 30 10 40 34c-14-6-34-14-40-28z" />
            <path d="M6 6c-2-4-4-6-8-6" />
          </g>
          {/* Яйцо */}
          <g transform="translate(96 92)">
            <path d="M14 0C6 0 0 14 0 24c0 8 6 14 14 14s14-6 14-14C28 14 22 0 14 0z" />
          </g>
          {/* Кастрюля */}
          <g transform="translate(70 180)">
            <path d="M0 6h44v16a10 10 0 0 1-10 10H10A10 10 0 0 1 0 22z" />
            <path d="M-6 6h56M16 0h12" />
          </g>
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
)
