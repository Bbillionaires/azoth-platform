export const uid = (): string => Math.random().toString(36).slice(2, 9)
export const initials = (name: string): string =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
export const fmtK   = (v: number) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
export const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}
export const AVATAR_COLORS = ['#5b8ef5','#9b72f5','#3ecf8e','#e8a045','#f472b6','#3dd5f3','#fb923c','#6b7280']

// localStorage with SSR safety
export const ls = {
  get: <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback } catch { return fallback }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },
}
