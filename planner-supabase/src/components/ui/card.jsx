/* Card component — Life OS design system
   Lightweight card primitives using design tokens.
   No dependencies, no shadcn/ui. */
import { createContext, useContext } from 'react'

const CardContext = createContext(null)

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface rounded-md border border-border shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`px-5 pt-5 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-lg font-semibold text-fg leading-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-sm text-muted mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`px-5 pb-5 pt-1 ${className}`} {...props}>
      {children}
    </div>
  )
}
