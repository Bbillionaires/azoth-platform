'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { initials } from '@/lib/utils'
import type { Workspace } from '@/lib/types'

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

export function Sidebar() {
  const pathname = usePathname()
  const { contacts, automations, campaigns, threads, currentUser, members, workspace, setActiveWsId } = useApp()

  const [showWsSwitcher, setShowWsSwitcher] = useState(false)
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([])
  const [theme, setThemeState] = useState('dark')
  const [newWsName, setNewWsName] = useState('')
  const [newWsIndustry, setNewWsIndustry] = useState('SaaS')
  const [newWsAccent, setNewWsAccent] = useState('#e8a045')
  const [creating, setCreating] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const t = localStorage.getItem('azoth_theme') || 'dark'
      setThemeState(t)
      document.documentElement.setAttribute('data-theme', t)
    } catch {}
  }, [])

  // Load all workspaces from Supabase on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: memberRows } = await supabase
          .from('workspace_members')
          .select('*, workspaces(*)')
          .eq('user_id', user.id)
        if (memberRows) {
          const wsList = memberRows.map(m => m.workspaces).filter(Boolean) as unknown as Workspace[]
          setAllWorkspaces(wsList)
        }
      } catch (err) {
        console.error('[AZOTH] Failed to load workspaces:', err)
      }
    }
    loadWorkspaces()
  }, [])

  const activeWs = workspace ?? allWorkspaces[0]
  const activeAutos = automations.filter((a: any) => a.active).length
  const activeCamps = campaigns.filter((c: any) => c.status === 'active').length

  const switchTheme = (t: string) => {
    setThemeState(t)
    localStorage.setItem('azoth_theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const switchWorkspace = async (id: string) => {
    await setActiveWsId(id)
    setShowWsSwitcher(false)
  }

  const createWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!newWsName.trim()) { alert('Please enter a workspace name'); return }
    setCreating(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('Not logged in'); return }

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWsName,
          slug: newWsName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
          industry: newWsIndustry,
          accent: newWsAccent,
          owner_id: user.id,
          email: user.email,
          userName: user.user_metadata?.name ?? user.email,
        })
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error || 'Failed to create workspace'); return }
      setNewWsName('')
      setShowWsSwitcher(false)
      window.location.reload()
    } catch (err) {
      alert('Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  const getBadge = (key?: string) => {
    if (!key) return null
    if (key === 'contacts')    return contacts.length || null
    if (key === 'automations') return activeAutos || null
    if (key === 'campaigns')   return activeCamps || null
    if (key === 'inbox')       return threads.length || null
    return null
  }

  const logout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    window.location.href = '/auth/login'
  }

  return (
    <aside className="aside">
      {/* Workspace switcher header */}
      <div className="ws-hd" style={{ cursor: 'pointer' }} onClick={() => setShowWsSwitcher(!showWsSwitcher)}>
        <div className="ws-name">
          <div className="ws-dot" style={{ background: activeWs?.accent ?? '#e8a045', color: '#000', fontWeight: 800, fontSize: 14 }}>A</div>
          <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
            {activeWs?.name ?? 'My Workspace'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 4 }}>{showWsSwitcher ? '▲' : '▼'}</span>
        </div>
        <div className="ws-meta">{activeWs?.industry ?? 'SaaS'} · {contacts.length} contacts</div>
      </div>

      {/* Workspace dropdown */}
      {showWsSwitcher && (
        <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--br)', padding: 8 }} onClick={e => e.stopPropagation()}>
          {allWorkspaces.map(w => (
            <div key={w.id} onClick={() => switchWorkspace(w.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', background: w.id === activeWs?.id ? 'var(--acc-bg)' : 'transparent', marginBottom: 2 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: w.accent ?? '#e8a045', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: w.id === activeWs?.id ? 'var(--acc)' : 'var(--t1)' }}>
                  {w.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{w.industry}</div>
              </div>
              {w.id === activeWs?.id && <span style={{ fontSize: 10, color: 'var(--acc)' }}>✓</span>}
            </div>
          ))}

          {/* Create new workspace */}
          <div style={{ borderTop: '1px solid var(--br)', marginTop: 6, paddingTop: 8 }}>
            <input
              className="fi"
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              placeholder="New workspace name"
              style={{ fontSize: 11.5, padding: '5px 8px', marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select className="fs" value={newWsIndustry} onChange={e => setNewWsIndustry(e.target.value)}
                style={{ fontSize: 11.5, padding: '5px 8px', flex: 1 }}>
                {['SaaS','Real Estate','Finance','Healthcare','Agency','E-commerce','Consulting','Other'].map(i => (
                  <option key={i}>{i}</option>
                ))}
              </select>
              <input type="color" value={newWsAccent} onChange={e => setNewWsAccent(e.target.value)}
                style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'var(--s3)' }} />
            </div>
            <button
              className="btn btn-acc"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: 6 }}
              onClick={createWorkspace}
              disabled={creating}
            >
              {creating ? 'Creating...' : '+ Create Workspace'}
            </button>
          </div>
        </div>
      )}

      {/* Nav links */}
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
          <div className="av" style={{ width: 30, height: 30, background: (currentUser?.avatar_color ?? '#e8a045') + '22', color: currentUser?.avatar_color ?? '#e8a045', fontSize: 11 }}>
            {initials(currentUser?.name ?? 'User')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{currentUser?.name ?? 'User'}</div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'capitalize' }}>{currentUser?.role ?? 'member'}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer',