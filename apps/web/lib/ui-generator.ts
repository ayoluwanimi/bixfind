// UI Component Generator
// Generates beautiful, consistent UI components based on templates

export interface ComponentConfig {
  type: string
  variant?: string
  props?: Record<string, string>
  content?: string
}

export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  bg: string
  text: string
  border: string
}

const bixfindTheme: ThemeConfig = {
  primary: '#001A4D',
  secondary: '#FF1E75',
  accent: '#00D84F',
  bg: '#0F172A',
  text: '#F8FAFC',
  border: '#334155'
}

const componentTemplates: Record<string, (config: any, theme: ThemeConfig) => string> = {
  Card: (config, theme) => {
    const { title = '', description = '', badge = '' } = config.props || {}
    return `
import React from 'react'

interface Props {
  title?: string
  description?: string
  badge?: string
  className?: string
}

export default function Card({ title = "${title}", description = "${description}", badge = "${badge}", className = '' }: Props) {
  return (
    <div className={"bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 " + className}>
      {badge && (
        <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-secondary rounded-full mb-3">
          {badge}
        </span>
      )}
      {title && <h3 className="text-xl font-bold text-white mb-2">{title}</h3>}
      {description && <p className="text-slate-300">{description}</p>}
    </div>
  )
}
`.trim()
  },

  Button: (config, theme) => {
    const { label = '', variant = 'primary' } = config.props || {}
    return `
import React from 'react'

interface ButtonProps {
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export default function Button({
  label = "${label}",
  variant = "${variant}",
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  children
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary hover:bg-primary/80 text-white',
    secondary: 'bg-secondary hover:bg-secondary/80 text-white',
    outline: 'border-2 border-slate-600 hover:border-secondary hover:text-secondary text-slate-300',
    ghost: 'hover:bg-slate-700 text-slate-300'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={"font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed " + variants[variant] + " " + sizes[size] + " " + className}
    >
      {children || label}
    </button>
  )
}
`.trim()
  },

  Input: (config, theme) => {
    const { label = '', placeholder = '', type = 'text' } = config.props || {}
    return `
import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  placeholder?: string
  error?: string
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label = "${label}",
  placeholder = "${placeholder}",
  type = "${type}",
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={"w-full " + className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={"w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all duration-200 " + (error ? 'border-red-500 focus:ring-red-500/50' : '')}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
`.trim()
  },

  Modal: (config, theme) => {
    const { title = '', width = 'max-w-lg' } = config.props || {}
    return `
import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  width?: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title = "${title}", width = "${width}", children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={"relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full " + width + " max-h-[90vh] overflow-y-auto"}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
`.trim()
  },

  Table: (config, theme) => {
    return `
import React from 'react'

interface Column {
  key: string
  header: string
  render?: (value: any, row: any) => React.ReactNode
}

interface TableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  className?: string
}

export default function Table({ columns, data, onRowClick, className = '' }: TableProps) {
  return (
    <div className={"overflow-x-auto rounded-xl border border-slate-700 " + className}>
      <table className="w-full">
        <thead className="bg-slate-800/50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={"bg-slate-900 hover:bg-slate-800 transition-colors " + (onRowClick ? 'cursor-pointer' : '')}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
`.trim()
  }
}

export const generateComponent = (type: string, config: ComponentConfig, outputPath?: string) => {
  const template = componentTemplates[type]
  if (!template) {
    throw new Error('Component type "' + type + '" not found. Available: ' + Object.keys(componentTemplates).join(', '))
  }

  const componentCode = template(config, bixfindTheme)

  return {
    name: type + '.tsx',
    code: componentCode,
    path: outputPath || './components/' + type + '.tsx'
  }
}

export const generateAllComponents = () => {
  return Object.keys(componentTemplates).map(type => 
    generateComponent(type, { type, props: {} })
  )
}

export const getAvailableComponents = () => Object.keys(componentTemplates)
