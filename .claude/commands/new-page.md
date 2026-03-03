# New React Page

Scaffold a new frontend page following the HCM-Office glass-morphism conventions.

**Usage:** `/new-page <PageName>`

## Instructions

Create a new page at `minister-portal/frontend/src/pages/<PageName>Page.tsx` following these exact patterns:

### File Template
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Icons } from '../components/icons'

// Types
interface <Model> {
  id: string
  // ... fields
  createdAt: string
}

export const <PageName>Page = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['<feature-plural>', page, search],
    queryFn: async () => {
      const res = await api.get('/<feature-plural>', { params: { page, limit: 10, search } })
      return res.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-rose-400">Failed to load data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
            <Icons.ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white"><PageName></h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage <feature-plural></p>
          </div>
        </div>
        <button
          onClick={() => navigate('/<feature-plural>/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors text-sm font-medium"
        >
          <Icons.Add className="w-4 h-4" />
          New <Feature>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search <feature-plural>..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass rounded-2xl overflow-hidden">
        {data?.data?.length === 0 ? (
          <div className="p-12 text-center">
            <Icons.Document className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No <feature-plural> found</p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? 'Try adjusting your search.' : 'Create one to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data?.data?.map((item: <Model>) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/<feature-plural>/${item.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <Icons.Document className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between glass rounded-2xl p-4">
          <p className="text-sm text-slate-400">
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, data.meta.total)} of {data.meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl glass hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icons.ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-sm text-slate-300 px-2">
              {page} / {data.meta.totalPages}
            </span>
            <button
              disabled={page === data.meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl glass hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icons.ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### After creating the file, add the route in `minister-portal/frontend/src/App.tsx`:
```tsx
import { <PageName>Page } from './pages/<PageName>Page'
// Add inside ProtectedRoute:
<Route path="/<feature-plural>" element={<PageName>Page />} />
```

### Also add a nav link in `minister-portal/frontend/src/components/Layout.tsx` if needed.

### Rules
- File name: `<PageName>Page.tsx`, exported as `export const <PageName>Page`
- Always use `useQuery` from TanStack Query for data fetching
- Always show loading spinner and error state
- Use `glass rounded-2xl` for card containers
- Use `glass-input` class for form inputs
- Use `Icons.*` from `../components/icons` — never import icons directly
- Navigation via `useNavigate()` from react-router-dom
- Search resets page to 1: `{ setSearch(e.target.value); setPage(1) }`
- Pagination always shows total count and page indicator
- Empty state shows an icon + descriptive message
- Hover states on interactive rows: `hover:bg-white/5 transition-colors`
- Primary action button: `bg-primary-600 hover:bg-primary-500`
