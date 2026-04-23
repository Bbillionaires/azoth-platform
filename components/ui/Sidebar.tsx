'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { initials, uid } from '@/lib/utils'

const NAV = [
  { href:'/dashboard',    label:'Dashboard',   icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href:'/inbox',        label:'Inbox',       icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge:'inbox' },
  { href:'/contacts',     label:'Contacts',    icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', badge:'contacts' },
  { href:'/pipeline',     label:'Pipeline',    icon:'M9 17H5a2 2 0 0 0-2 2M9 17v-5M9 17l4 4 4-5m-4 5V7m4 9h4a2 2 0 0 1 2 2' },
  { href:'/campaigns',    label:'Campaigns',   icon:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.7a19.9 19.9 0 0 1-3.07-8.67A2 2 0 0 1 3.44 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z', badge:'campaigns' },
  { href:'/automations',  label:'Automations', icon:'M13 10V3L4 14h7v7l9-11h-7z', badge:'automations' },
  { href:'/integrations', label:'Integrations',icon:'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
  { href:'/settings',     label:'Settings',    icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
]

const DEMO_WORKSPACES = [
  { id: 'ws_demo_001', name: 'My Workspace',         industry: 'SaaS',        accent: '#e8a045' },
  { id: 'ws_re_001',   name: 'Real Estate',           industry: 'Real Estate', accent: '#3ecf8e' },
  { id: 'ws_biz_001',  name: 'Business Acquisitions', industry: 'Finance',     accent: '#9b72f5' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { contacts, automations, campaigns, threads, currentUser, members } = useApp()

  const [showWsSwitcher, setShowWsSwitcher] = useState(false)
  const [workspaces, setWorkspaces] = useState(() => {
    try { const s = localStorage.getItem('azoth_workspaces'); return s ? JSON.parse(s) : DEMO_WORKSPACES } catch { return DEMO_WORKSPACES }
  })
  const [activeWsId, setActiveWsId] = useState(() => {
    try { return localStorage.getItem('azoth_active_ws') || 'ws_demo_001' } catch { return 'ws_demo_001' }
  })
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('azoth_theme') || 'dark' } catch { return 'dark' }
  })
  const [newWsName, setNewWsName] = useState('')
  const [newWsIndustry, setNewWsIndustry] = useState('SaaS')
  const [newWsAccent, setNewWsAccent] = useState('#e8a045')

  const activeWs = workspaces.find((w: any) => w.id === activeWsId) || workspaces[0]
  const activeAutos = automations.filter((a: any) => a.active).length
  const activeCamps = campaigns.filter((c: any) => c.status === 'active').length

  const switchTheme = (t: string) => {
    setThemeState(t)
    localStorage.setItem('azoth_theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const switchWorkspace = (id: string) => {
    setActiveWsId(id)
    localStorage.setItem('azoth_active_ws', id)
    setShowWsSwitcher(false)
  }

  const createWorkspace = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!newWsName.trim()) return
    const nw = { id: 'ws_' + Math.random().toString(36).slice(2,9), name: newWsName, industry: newWsIndustry, accent: newWsAccent }
    const updated = [...workspaces, nw]
    setWorkspaces(updated)
    localStorage.setItem('azoth_workspaces', JSON.stringify(updated))
    setActiveWsId(nw.id)
    localStorage.setItem('azoth_active_ws', nw.id)
    setNewWsName('')
    setShowWsSwitcher(false)
  }

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
      {/* Workspace switcher */}
      <div className="ws-hd" style={{ cursor: 'pointer' }} onClick={() => setShowWsSwitcher(!showWsSwitcher)}>
        <div className="ws-name">
          <div className="ws-dot" style={{ background: activeWs.accent, color: '#000', fontWeight: 800, fontSize: 14 }}>A</div>
          <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{activeWs.name}</span>
          <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 4 }}>{showWsSwitcher ? '▲' : '▼'}</span>
        </div>
        <div className="ws-meta">{activeWs.industry} · {contacts.length} contacts</div>
      </div>

      {/* Workspace dropdown */}
      {showWsSwitcher && (
        <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--br)', padding: 8 }}>
          {workspaces.map((w: any) => (
            <div key={w.id} onClick={() => switchWorkspace(w.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', background: w.id === activeWsId ? 'var(--acc-bg)' : 'transparent', marginBottom: 2 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: w.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: w.id === activeWsId ? 'var(--acc)' : 'var(--t1)' }}>{w.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{w.industry}</div>
              </div>
              {w.id === activeWsId && <span style={{ fontSize: 10, color: 'var(--acc)' }}>✓</span>}
            </div>
          ))}

          {/* Create new workspace */}
          <div style={{ borderTop: '1px solid var(--br)', marginTop: 6, paddingTop: 8 }} onClick={e => e.stopPropagation()}>
            <input className="fi" value={newWsName} onChange={e => setNewWsName(e.target.value)}
              placeholder="New workspace name" style={{ fontSize: 11.5, padding: '5px 8px', marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select className="fs" value={newWsIndustry} onChange={e => setNewWsIndustry(e.target.value)}
                style={{ fontSize: 11.5, padding: '5px 8px', flex: 1 }}>
                {['SaaS','Real Estate','Finance','Healthcare','Agency','E-commerce','Consulting','Other'].map(i => <option key={i}>{i}</option>)}
              </select>
              <input type="color" value={newWsAccent} onChange={e => setNewWsAccent(e.target.value)}
                style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'var(--s3)' }} />
            </div>
            <button className="btn btn-acc" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: 6 }}
              onClick={createWorkspace}>
              + Create Workspace
            </button>
          </div>
        </div>
      )}

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

        {/* Team online */}
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

      {/* Theme toggle */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>Theme</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['dark', 'light'] as const).map(t => (
            <button key={t} onClick={() => switchTheme(t)}
              className="btn btn-ghost btn-xs"
              style={{ fontSize: 11, padding: '3px 8px', background: theme === t ? 'var(--acc-bg)' : '', color: theme === t ? 'var(--acc)' : 'var(--t3)', borderColor: theme === t ? 'var(--acc-br)' : 'var(--br)' }}>
              {t === 'dark' ? '🌙' : '☀️'}
            </button>
          ))}
        </div>
      </div>

      {/* User row + logout */}
      <div className="aside-ft">
        <div className="usr-row">
          <div className="av" style={{ width: 30, height: 30, background: currentUser.avatar_color + '22', color: currentUser.avatar_color, fontSize: 11 }}>
            {initials(currentUser.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{currentUser.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'capitalize' }}>{currentUser.role}</div>
          </div>
          <button
            onClick={() => { window.location.href = '/auth/login' }}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--t3)', padding: '4px 6px', borderRadius: 6, lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}>
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}