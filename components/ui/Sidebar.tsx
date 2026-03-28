'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { initials } from '@/lib/utils'

const NAV = [
  { href:'/dashboard',     label:'Dashboard',   icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href:'/inbox',         label:'Inbox',       icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge:'inbox' },
  { href:'/contacts',      label:'Contacts',    icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', badge:'contacts' },
  { href:'/pipeline',      label:'Pipeline',    icon:'M9 17H5a2 2 0 0 0-2 2M9 17v-5M9 17l4 4 4-5m-4 5V7m4 9h4a2 2 0 0 1 2 2' },
  { href:'/campaigns',     label:'Campaigns',   icon:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.7a19.9 19.9 0 0 1-3.07-8.67A2 2 0 0 1 3.44 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z', badge:'campaigns' },
  { href:'/automations',   label:'Automations', icon:'M13 10V3L4 14h7v7l9-11h-7z', badge:'automations' },
  { href:'/integrations',  label:'Integrations',icon:'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
  { href:'/settings',      label:'Settings',    icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { contacts, automations, campaigns, threads, workspace, currentUser, members } = useApp()
  const activeAutos = automations.filter(a => a.active).length
  const activeCamps = campaigns.filter(c => c.status === 'active').length

  const getBadge = (key?: string) => {
    if (!key) return null
    if (key === 'contacts')    return contacts.length
    if (key === 'automations') return activeAutos || null
    if (key === 'campaigns')   return activeCamps || null
    if (key === 'inbox')       return threads.length
    return null
  }

  return (
    <aside className="aside">
      {/* Workspace */}
      <div className="ws-hd">
        <div className="ws-name">
          <div className="ws-dot" style={{ background: workspace.accent, color: '#000', fontWeight: 800, fontSize: 14 }}>N</div>
          <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{workspace.name}</span>
        </div>
        <div className="ws-meta">{workspace.plan.toUpperCase()} · {workspace.industry}</div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nsec">Platform</div>
        {NAV.slice(0, 6).map(n => {
          const active = n.href === '/dashboard' ? pathname === '/' || pathname === '/dashboard' : pathname.startsWith(n.href)
          const badge = getBadge(n.badge)
          return (
            <Link key={n.href} href={n.href} className={`nv ${active ? 'on' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
              {badge != null && <span className="nv-ct">{badge}</span>}
            </Link>
          )
        })}

        <div className="nsec">System</div>
        {NAV.slice(6).map(n => {
          const active = pathname.startsWith(n.href)
          return (
            <Link key={n.href} href={n.href} className={`nv ${active ? 'on' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
            </Link>
          )
        })}

        {/* Online team */}
        <div className="nsec">Team Online</div>
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', fontSize: 12.5 }}>
            <div className="av" style={{ width: 22, height: 22, background: m.avatar_color + '22', color: m.avatar_color, fontSize: 9, borderRadius: 6 }}>
              {initials(m.name)}
            </div>
            <span style={{ flex: 1, color: 'var(--t2)' }}>{m.name}</span>
            <div className="dot" style={{ background: m.online ? 'var(--green)' : 'var(--t3)' }} />
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="aside-ft">
        <div className="usr-row">
          <div className="av" style={{ width: 30, height: 30, background: currentUser.avatar_color + '22', color: currentUser.avatar_color, fontSize: 11 }}>
            {initials(currentUser.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{currentUser.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'capitalize' }}>{currentUser.role}</div>
          </div>
          <div className="dot" style={{ background: 'var(--green)' }} />
        </div>
      </div>
    </aside>
  )
}
