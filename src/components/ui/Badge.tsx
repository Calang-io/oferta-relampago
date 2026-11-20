import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'critical' | 'moderate' | 'safe' | 'yellow' | 'purple' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs sm:text-sm px-2.5 py-1 font-semibold',
  }

  const variantClasses = {
    critical:
      'bg-brand-amber/15 text-brand-light border border-brand-amber/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]',
    moderate:
      'bg-risk-moderate/20 text-purple-200 border border-purple-400/30',
    safe:
      'bg-risk-safe/15 text-risk-safe border border-risk-safe/30',
    yellow:
      'bg-brand-amber text-purple-950 font-bold border border-brand-light shadow-sm',
    purple:
      'bg-purple-900/60 text-purple-200 border border-purple-700/50',
    neutral:
      'bg-slate-800/80 text-slate-300 border border-slate-700/60',
  }

  const dotColors = {
    critical: 'bg-brand-amber animate-pulse',
    moderate: 'bg-purple-400',
    safe: 'bg-risk-safe',
    yellow: 'bg-purple-950',
    purple: 'bg-purple-400',
    neutral: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
}
