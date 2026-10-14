import React from 'react'

/** Контурная кастрюля с паром — тихий декор рядом с заголовком. */
export const SteamPot: React.FC = () => (
  <svg className="steam-pot" viewBox="0 0 200 150" aria-hidden="true">
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Пар */}
      <g className="steam-pot__steam" stroke="var(--terracotta)" strokeWidth="2">
        <path d="M78 52c-8-10 8-16 0-28" />
        <path d="M100 48c-8-10 8-18 0-32" />
        <path d="M122 52c-8-10 8-16 0-28" />
      </g>
      {/* Кастрюля */}
      <g stroke="var(--text-dim)" strokeWidth="2">
        <path d="M44 70h112" />
        <path d="M52 70v42a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V70" />
        <path d="M52 82H36a6 6 0 0 1 0-12h16M148 82h16a6 6 0 0 0 0-12h-16" />
        <path d="M86 70v-4a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v4" />
        {/* Конфорка */}
        <path d="M30 140h140" />
      </g>
      {/* Веточка розмарина у кастрюли */}
      <g stroke="var(--accent)" strokeWidth="1.6" opacity="0.7">
        <path d="M168 138c4-18 6-30 14-44" />
        <path d="M171 126l-7-4M173 116l-7-5M176 106l-6-6M171 126l7-2M173 116l7-3M176 106l7-2" />
      </g>
    </g>
  </svg>
)
