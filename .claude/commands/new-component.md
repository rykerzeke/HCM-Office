# New Glass-Morphism Component

Scaffold a new reusable UI component following the HCM-Office design system.

**Usage:** `/new-component <ComponentName> [description of what it does]`

## Instructions

Create a new component at `minister-portal/frontend/src/components/<ComponentName>.tsx` following these exact patterns:

### Base Component Template
```tsx
import { Icons } from './icons'

interface <ComponentName>Props {
  // Define props here — be explicit with types
  className?: string
}

export const <ComponentName> = ({ className = '' }: <ComponentName>Props) => {
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      {/* content */}
    </div>
  )
}
```

### Modal/Dialog Template (if component is a modal)
```tsx
import { Icons } from './icons'

interface <ComponentName>Props {
  isOpen: boolean
  onClose: () => void
  // ... other props
}

export const <ComponentName> = ({ isOpen, onClose }: <ComponentName>Props) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Title</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Icons.Dismiss className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* content */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Badge/Status Component Template
```tsx
interface <ComponentName>Props {
  value: string
  className?: string
}

const styleMap: Record<string, string> = {
  // Map values to Tailwind color classes
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  INACTIVE: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const labelMap: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const <ComponentName> = ({ value, className = '' }: <ComponentName>Props) => {
  const style = styleMap[value] ?? 'bg-slate-500/20 text-slate-400'
  const label = labelMap[value] ?? value

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  )
}
```

### Stat Card Template (for dashboards)
```tsx
import { Icons } from './icons'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend?: { value: number; label: string }
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan'
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500/20', icon: 'text-indigo-400', border: 'border-indigo-500/30' },
  emerald: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-500/20', icon: 'text-amber-400', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-500/20', icon: 'text-rose-400', border: 'border-rose-500/30' },
  cyan: { bg: 'bg-cyan-500/20', icon: 'text-cyan-400', border: 'border-cyan-500/30' },
}

export const StatCard = ({ label, value, icon: Icon, trend, color = 'indigo' }: StatCardProps) => {
  const colors = colorMap[color]
  return (
    <div className={`glass rounded-2xl p-5 border ${colors.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.value >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {trend && <p className="text-xs text-slate-500 mt-1">{trend.label}</p>}
    </div>
  )
}
```

### Rules
- File name: `<ComponentName>.tsx`, exported as `export const <ComponentName>`
- Always accept `className?: string` for style overrides on wrapper components
- Use `glass rounded-2xl` for card containers
- Use `border border-white/5` for subtle card borders
- Use `hover:bg-white/10 transition-colors` for interactive elements
- Modal backdrop: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Modal container: `glass rounded-2xl w-full max-w-md`
- Modal sections separated by `border-b border-white/5` / `border-t border-white/5`
- Use `Icons.*` from `./icons` for all icons
- Color palette for accents: indigo (primary), emerald (success), amber (warning), rose (error), cyan (info)
- Opacity suffixes for transparency: `/20` backgrounds, `/30` borders, `/50` for focus rings
- Text hierarchy: `text-white` (primary), `text-slate-300` (secondary), `text-slate-400` (muted), `text-slate-500` (disabled)
