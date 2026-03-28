'use client'
import type { Stage } from '@/lib/types'
import { initials } from '@/lib/utils'

export function Avatar({ name, color, size = 30 }: { name: string; color: string; size?: number }) {
  return (
    <div className="av" style={{ width: size, height: size, background: color + '22', color, fontSize: size < 28 ? 10 : 11, borderRadius: size < 28 ? 6 : 8 }}>
      {initials(name)}
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle" style={{ background: on ? 'var(--green)' : 'var(--s3)' }} onClick={() => onChange(!on)}>
      <div className="toggle-dot" style={{ transform: on ? 'translateX(15px)' : 'translateX(0)' }} />
    </div>
  )
}

export function StagePill({ stage }: { stage?: Stage }) {
  if (!stage) return null
  return <span className="tag" style={{ background: stage.color + '22', color: stage.color }}>{stage.name}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(62,207,142,.12)',  color: 'var(--green)'  },
    scheduled: { bg: 'rgba(91,142,245,.12)',  color: 'var(--blue)'   },
    draft:     { bg: 'rgba(80,89,106,.15)',   color: 'var(--t2)'     },
    paused:    { bg: 'rgba(232,160,69,.12)',  color: 'var(--acc)'    },
    completed: { bg: 'rgba(155,114,245,.12)', color: 'var(--purple)' },
  }
  const s = map[status] ?? map.draft
  return <span className="tag" style={s}>{status}</span>
}

export function Topbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="topbar">
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px', flex: 1 }}>{title}</span>
      {children}
      <span className="mono" style={{ fontSize: 10, color: 'var(--t3)', background: 'rgba(255,255,255,.04)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--br)' }}>Nexus</span>
    </div>
  )
}

export function Icon({ d, size = 14, stroke = 1.8 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
