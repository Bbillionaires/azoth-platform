'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'
import { uid } from '@/lib/utils'
import type { CRMField, FieldType } from '@/lib/types'

const TABS = ['Pipelines','Custom Fields','Workspace','Team','Billing'] as const
type Tab = typeof TABS[number]

const DEFAULT_STAGES = [
  { name: 'Lead',        color: '#555e6e' },
  { name: 'Qualified',   color: '#5b8ef5' },
  { name: 'Proposal',    color: '#e8a045' },
  { name: 'Negotiation', color: '#9b72f5' },
  { name: 'Won',         color: '#3ecf8e' },
  { name: 'Lost',        color: '#f06060' },
]

// ── Pipeline Editor ───────────────────────
function PipelineEditor() {
  const { pipelines, setPipelines, activeWsId } = useApp()
  const [editing, setEditing] = useState<string|null>(null)
  const [newStageName, setNewStageName] = useState('')
  const [newPlName, setNewPlName] = useState('')
  const [newPlColor, setNewPlColor] = useState('#5b8ef5')
  const [saving, setSaving] = useState(false)

  const addPl = async () => {
    if (!newPlName) return
    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      // Create pipeline in Supabase
      const { data: pl, error: plErr } = await supabase
        .from('pipelines')
        .insert({ workspace_id: activeWsId, name: newPlName, color: newPlColor, position: pipelines.length })
        .select()
        .single()

      if (plErr || !pl) { alert('Failed to create pipeline'); return }

      // Create default stages
      const stageInserts = DEFAULT_STAGES.map((s, i) => ({
        pipeline_id: pl.id,
        name: s.name,
        color: s.color,
        position: i,
      }))
      const { data: stages } = await supabase.from('stages').insert(stageInserts).select()

      // Update local state
      setPipelines(p => [...p, { ...pl, stages: stages ?? [] }])
      setNewPlName('')
    } finally {
      setSaving(false)
    }
  }

  const delPl = async (id: string) => {
    if (!confirm('Delete this pipeline?')) return
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    await supabase.from('pipelines').delete().eq('id', id)
    setPipelines(p => p.filter(x => x.id !== id))
  }

  const addStage = async (plId: string) => {
    if (!newStageName) return
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    const pl = pipelines.find(p => p.id === plId)
    const { data: stage } = await supabase
      .from('stages')
      .insert({ pipeline_id: plId, name: newStageName, color: '#555e6e', position: pl?.stages?.length ?? 0 })
      .select()
      .single()
    if (stage) {
      setPipelines(p => p.map(x => x.id === plId ? { ...x, stages: [...(x.stages ?? []), stage] } : x))
      setNewStageName('')
    }
  }

  const delStage = async (plId: string, sId: string) => {
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    await supabase.from('stages').delete().eq('id', sId)
    setPipelines(p => p.map(x => x.id === plId ? { ...x, stages: x.stages.filter(s => s.id !== sId) } : x))
  }

  const updateStage = async (plId: string, sId: string, k: 'name'|'color', v: string) => {
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    await supabase.from('stages').update({ [k]: v }).eq('id', sId)
    setPipelines(p => p.map(x => x.id === plId ? { ...x, stages: x.stages.map(s => s.id === sId ? { ...s, [k]: v } : s) } : x))
  }

  return (
    <div>
      <div className="sh mb">Pipelines</div>
      {pipelines.length === 0 && (
        <div className="card mb" style={{ textAlign: 'center', color: 'var(--t3)', padding: 24 }}>
          No pipelines yet. Create your first one below.
        </div>
      )}
      {pipelines.map(pl => (
        <div key={pl.id} className="card mb">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="dot" style={{ width: 10, height: 10, background: pl.color }} />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{pl.name}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setEditing(editing === pl.id ? null : pl.id)}>
              {editing === pl.id ? 'Done' : 'Edit Stages'}
            </button>
            <button className="btn btn-danger btn-xs" onClick={() => delPl(pl.id)}>Delete</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(pl.stages ?? []).map(s => (
              editing === pl.id ? (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--s3)', border: '1px solid var(--br)', borderRadius: 6, padding: '4px 8px' }}>
                  <input type="color" value={s.color} onChange={e => updateStage(pl.id, s.id, 'color', e.target.value)} style={{ width: 16, height: 16, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  <input className="fi" value={s.name} onChange={e => updateStage(pl.id, s.id, 'name', e.target.value)} style={{ width: 90, padding: '2px 5px', fontSize: 12 }} />
                  <button onClick={() => delStage(pl.id, s.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
                </div>
              ) : (
                <span key={s.id} className="tag" style={{ background: s.color + '20', color: s.color }}>{s.name}</span>
              )
            ))}
            {editing === pl.id && (
              <div style={{ display: 'flex', gap: 5 }}>
                <input className="fi" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Stage name" style={{ width: 110, padding: '4px 8px', fontSize: 12 }} />
                <button className="btn btn-acc btn-xs" onClick={() => addStage(pl.id)}>+ Add</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* New Pipeline */}
      <div className="card card-sm" style={{ background: 'var(--s1)', border: '1px dashed rgba(255,255,255,.1)' }}>
        <div className="sh" style={{ fontSize: 13, marginBottom: 6 }}>New Pipeline</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
          Creates with default stages: Lead → Qualified → Proposal → Negotiation → Won → Lost
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color" value={newPlColor} onChange={e => setNewPlColor(e.target.value)} style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
          <input className="fi" value={newPlName} onChange={e => setNewPlName(e.target.value)} placeholder="Pipeline name e.g. Real Estate, Support" style={{ flex: 1 }} />
          <button className="btn btn-acc" onClick={addPl} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Field Editor ──────────────────────────
function FieldEditor() {
  const { fields, setFields, activeWsId } = useApp()
  const [nf, setNf] = useState<{ name: string; type: FieldType; options: string }>({ name: '', type: 'text', options: '' })
  const custom = fields.filter(f => !f.builtin)

  const add = () => {
    if (!nf.name) return
    const key = nf.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setFields(f => [...f, {
      id: uid(),
      workspace_id: activeWsId,
      name: nf.name,
      key,
      type: nf.type,
      options: nf.options ? nf.options.split(',').map(s => s.trim()) : undefined,
    }])
    setNf({ name: '', type: 'text', options: '' })
  }

  return (
    <div>
      <div className="sh mb">Custom Fields</div>
      <div className="card mb">
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Built-in Fields</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {fields.filter(f => f.builtin).map(f => (
            <span key={f.id} className="tag" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--t3)', fontSize: 11 }}>
              {f.name} <span style={{ opacity: .6 }}>·{f.type}</span>
            </span>
          ))}
        </div>
      </div>
      {custom.length > 0 && (
        <div className="card mb">
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Custom Fields ({custom.length})</div>
          {custom.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <span className="tag" style={{ background: 'var(--acc-bg)', color: 'var(--acc)', fontSize: 10 }}>{f.type}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--t3)' }}>key: {f.key}</span>
              <button className="btn btn-danger btn-xs" onClick={() => setFields(prev => prev.filter(x => x.id !== f.id || x.builtin))}>Remove</button>
            </div>
          ))}
        </div>
      )}
      <div className="card card-sm" style={{ background: 'var(--s1)', border: '1px dashed rgba(255,255,255,.1)' }}>
        <div className="sh" style={{ fontSize: 13, marginBottom: 10 }}>Add Custom Field</div>
        <div className="fg2" style={{ gap: 10 }}>
          <div className="field">
            <label className="fl">Field Name</label>
            <input className="fi" value={nf.name} onChange={e => setNf(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Industry" />
          </div>
          <div className="field">
            <label className="fl">Type</label>
            <select className="fs" value={nf.type} onChange={e => setNf(f => ({ ...f, type: e.target.value as FieldType }))}>
              {(['text', 'number', 'email', 'date', 'select', 'textarea', 'checkbox', 'phone', 'url'] as FieldType[]).map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {nf.type === 'select' && (
            <div className="field fc">
              <label className="fl">Options (comma separated)</label>
              <input className="fi" value={nf.options} onChange={e => setNf(f => ({ ...f, options: e.target.value }))} placeholder="Option A, Option B, Option C" />
            </div>
          )}
        </div>
        <button className="btn btn-acc mt" onClick={add}>Add Field</button>
      </div>
    </div>
  )
}

// ── Workspace ─────────────────────────────
function WorkspaceSettings() {
  const { workspace, setWorkspace } = useApp()
  const set = (k: string, v: string) => setWorkspace((w: any) => ({ ...w, [k]: v }))
  if (!workspace) return <div className="dim" style={{ padding: 32 }}>Loading workspace...</div>
  return (
    <div className="g2">
      <div className="card">
        <div className="sh mb">Workspace</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field"><label className="fl">Name</label><input className="fi" value={workspace.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="field">
            <label className="fl">Industry</label>
            <select className="fs" value={workspace.industry ?? 'SaaS'} onChange={e => set('industry', e.target.value)}>
              {['SaaS', 'Agency', 'Real Estate', 'Healthcare', 'Finance', 'E-commerce', 'Consulting', 'Other'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="fl">Currency</label>
            <select className="fs" value={workspace.currency} onChange={e => set('currency', e.target.value)}>
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="fl">Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={workspace.accent} onChange={e => set('accent', e.target.value)} style={{ width: 36, height: 36, border: '1px solid var(--br)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'var(--s3)' }} />
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>{workspace.accent}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="sh mb">Your Plan</div>
        <div style={{ background: 'var(--acc-bg)', border: '1px solid var(--acc-br)', borderRadius: 'var(--r10)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--acc)', marginBottom: 4 }}>Pro Plan</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>Unlimited contacts · All integrations · Campaigns · Automations · Team inbox</div>
        </div>
        {[
          { l: 'Contacts',     v: 'Unlimited' },
          { l: 'Campaigns',    v: 'Unlimited' },
          { l: 'Team Members', v: 'Up to 25'  },
          { l: 'Automations',  v: 'Unlimited' },
          { l: 'API Calls',    v: '1,000/min' },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{r.l}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Team ──────────────────────────────────
function TeamSettings() {
  const { members } = useApp()
  return (
    <div>
      <div className="row mb" style={{ marginBottom: 13 }}>
        <span className="sh">Team Members</span>
        <button className="btn btn-acc btn-sm" style={{ marginLeft: 'auto' }}>+ Invite Member</button>
      </div>
      <div className="card mb">
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <div className="av" style={{ width: 34, height: 34, background: m.avatar_color + '22', color: m.avatar_color, fontSize: 12 }}>
              {m.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.email}</div>
            </div>
            <span className="tag" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--t2)', fontSize: 11, textTransform: 'capitalize' }}>{m.role}</span>
            <div className="dot" style={{ background: m.online ? 'var(--green)' : 'var(--t3)' }} />
            {m.role !== 'owner' && <button className="btn btn-ghost btn-xs">Remove</button>}
          </div>
        ))}
      </div>
      <div className="card card-sm" style={{ background: 'var(--s1)', border: '1px dashed rgba(255,255,255,.1)' }}>
        <div className="sh" style={{ fontSize: 13, marginBottom: 10 }}>Invite New Member</div>
        <div className="fg2" style={{ gap: 10 }}>
          <div className="field"><label className="fl">Email Address</label><input className="fi" placeholder="teammate@company.com" /></div>
          <div className="field">
            <label className="fl">Role</label>
            <select className="fs">
              <option>member</option><option>admin</option><option>viewer</option>
            </select>
          </div>
        </div>
        <button className="btn btn-acc mt">Send Invite</button>
      </div>
    </div>
  )
}

// ── Billing ───────────────────────────────
function BillingSettings() {
  const PLANS = [
    { id: 'free',    name: 'Free',    price: '$0',   desc: '1 user · 50 contacts · Basic CRM',     color: 'var(--t2)'    },
    { id: 'starter', name: 'Starter', price: '$29',  desc: '3 users · 1,000 contacts · Campaigns', color: 'var(--blue)'  },
    { id: 'pro',     name: 'Pro',     price: '$79',  desc: '25 users · Unlimited · All features',   color: 'var(--acc)',  current: true },
    { id: 'agency',  name: 'Agency',  price: '$199', desc: 'Unlimited · White-label · API',         color: 'var(--purple)'},
  ]
  return (
    <div>
      <div className="sh mb">Plans</div>
      <div className="g4 mb">
        {PLANS.map(p => (
          <div key={p.id} className="card card-sm" style={{ border: `1px solid ${p.current ? p.color + '50' : 'var(--br)'}`, background: p.current ? p.color + '08' : 'var(--s2)' }}>
            {p.current && <div className="tag" style={{ background: p.color + '20', color: p.color, fontSize: 9.5, marginBottom: 8 }}>Current Plan</div>}
            <div style={{ fontSize: 18, fontWeight: 700, color: p.color, marginBottom: 2 }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--t3)' }}>/mo</span></div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 12 }}>{p.desc}</div>
            <button className={`btn btn-sm ${p.current ? 'btn-ghost' : ''}`} style={{ width: '100%', justifyContent: 'center', color: p.current ? 'var(--t3)' : p.color, borderColor: p.current ? 'var(--br)' : p.color + '50' }}>
              {p.current ? 'Current' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="sh mb" style={{ marginBottom: 13 }}>Billing Info</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { l: 'Next Invoice',   v: 'April 1, 2026'    },
            { l: 'Amount',         v: '$79.00'            },
            { l: 'Payment Method', v: 'Visa ending 4242'  },
            { l: 'Billing Email',  v: 'dearis@company.com'},
          ].map(r => (
            <div key={r.l} style={{ flex: 1, minWidth: 140, padding: '12px 14px', background: 'var(--s3)', borderRadius: 'var(--r8)', border: '1px solid var(--br)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 5 }}>{r.l}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm">Update Payment Method</button>
          <button className="btn btn-ghost btn-sm">Download Invoices</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Pipelines')
  return (
    <>
      <Topbar title="Settings" />
      <div className="page">
        <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: '1px solid var(--br)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 15px', background: 'none', border: 'none',
              color: tab === t ? 'var(--acc)' : 'var(--t2)',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)',
              borderBottom: tab === t ? '2px solid var(--acc)' : '2px solid transparent',
              transition: 'all .12s',
            }}>{t}</button>
          ))}
        </div>
        {tab === 'Pipelines'     && <PipelineEditor />}
        {tab === 'Custom Fields' && <FieldEditor />}
        {tab === 'Workspace'     && <WorkspaceSettings />}
        {tab === 'Team'          && <TeamSettings />}
        {tab === 'Billing'       && <BillingSettings />}
      </div>
    </>
  )
}