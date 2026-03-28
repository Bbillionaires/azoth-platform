'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar, StatusBadge, Toggle } from '@/components/ui'
import { uid } from '@/lib/utils'
import type { Campaign, CampaignType, CampaignStatus } from '@/lib/types'

const TYPE_META: Record<CampaignType, { icon: string; color: string; label: string }> = {
  email:    { icon: '✉️', color: 'var(--blue)',   label: 'Email' },
  sms:      { icon: '💬', color: 'var(--green)',  label: 'SMS' },
  sequence: { icon: '🔁', color: 'var(--purple)', label: 'Sequence' },
}

function CampaignModal({ campaign, onSave, onClose }: { campaign?: Campaign | null; onSave: (c: Campaign) => void; onClose: () => void }) {
  const { workspace } = useApp()
  const blank: Omit<Campaign,'id'|'workspace_id'> = {
    name:'', type:'email', status:'draft', subject:'', body:'',
    from_name: 'Your Name', from_email: 'you@company.com',
    sent_count:0, open_count:0, click_count:0, reply_count:0,
    created_at: new Date().toISOString(),
  }
  const [f, setF] = useState<Campaign>(campaign ?? { ...blank, id: '', workspace_id: workspace.id })
  const set = (k: string, v: unknown) => setF(p => ({ ...p, [k]: v }))

  const VARS = ['{{first_name}}','{{last_name}}','{{company}}','{{email}}']

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-title">{campaign ? 'Edit Campaign' : 'New Campaign'}</div>
        <div className="modal-sub">Build an email, SMS, or multi-step sequence</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="fg2">
            <div className="field"><label className="fl">Campaign Name</label>
              <input className="fi" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Q2 Cold Outreach" />
            </div>
            <div className="field"><label className="fl">Type</label>
              <select className="fs" value={f.type} onChange={e => set('type', e.target.value)}>
                <option value="email">✉️ Email</option>
                <option value="sms">💬 SMS</option>
                <option value="sequence">🔁 Sequence</option>
              </select>
            </div>
          </div>
          {f.type !== 'sms' && (
            <div className="fg2">
              <div className="field"><label className="fl">From Name</label>
                <input className="fi" value={f.from_name ?? ''} onChange={e => set('from_name', e.target.value)} />
              </div>
              <div className="field"><label className="fl">From Email</label>
                <input className="fi" type="email" value={f.from_email ?? ''} onChange={e => set('from_email', e.target.value)} />
              </div>
            </div>
          )}
          {f.type === 'email' && (
            <div className="field"><label className="fl">Subject Line</label>
              <input className="fi" value={f.subject ?? ''} onChange={e => set('subject', e.target.value)} placeholder="e.g. Quick question about {{company}}" />
            </div>
          )}
          <div className="field">
            <label className="fl">
              {f.type === 'sequence' ? 'Step 1 Body' : 'Message Body'}
            </label>
            <textarea className="fta" value={f.body} onChange={e => set('body', e.target.value)} style={{ minHeight: 120 }}
              placeholder="Hi {{first_name}},&#10;&#10;I wanted to reach out about..." />
          </div>
          {/* Variable chips */}
          <div>
            <div className="fl" style={{ marginBottom: 7 }}>Personalization Variables</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VARS.map(v => (
                <button key={v} className="btn btn-ghost btn-xs" onClick={() => set('body', f.body + v)}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</button>
              ))}
            </div>
          </div>
          <div className="fg2">
            <div className="field"><label className="fl">Status</label>
              <select className="fs" value={f.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            {f.status === 'scheduled' && (
              <div className="field"><label className="fl">Send At</label>
                <input className="fi" type="datetime-local" value={f.scheduled_at?.slice(0,16) ?? ''} onChange={e => set('scheduled_at', e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-acc" onClick={() => {
            if (!f.name) return
            onSave({ ...f, id: campaign?.id ?? uid(), workspace_id: f.workspace_id })
            onClose()
          }}>
            {campaign ? 'Save Changes' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const { campaigns, setCampaigns, contacts } = useApp()
  const [modal, setModal] = useState<Campaign | true | null>(null)
  const [filter, setFilter] = useState<'all' | CampaignType>('all')
  const [view, setView] = useState<'list' | 'stats'>('list')

  const filtered = campaigns.filter(c => filter === 'all' || c.type === filter)

  const save = (c: Campaign) => {
    setCampaigns(prev => modal && modal !== true ? prev.map(x => x.id === c.id ? c : x) : [...prev, c])
  }
  const del = (id: string) => setCampaigns(prev => prev.filter(c => c.id !== id))
  const toggleStatus = (id: string) => setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' as CampaignStatus } : c))

  const totals = {
    sent: campaigns.reduce((a, c) => a + c.sent_count, 0),
    opens: campaigns.reduce((a, c) => a + c.open_count, 0),
    clicks: campaigns.reduce((a, c) => a + c.click_count, 0),
    replies: campaigns.reduce((a, c) => a + c.reply_count, 0),
  }
  const openRate = totals.sent ? Math.round(totals.opens / totals.sent * 100) : 0

  return (
    <>
      <Topbar title="Campaigns">
        <button className="btn btn-acc btn-sm" onClick={() => setModal(true)}>+ New Campaign</button>
      </Topbar>
      <div className="page">
        {/* Stats */}
        <div className="stat-g" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { l: 'Total Sent',   v: totals.sent.toLocaleString(),  c: 'var(--blue)'   },
            { l: 'Open Rate',    v: openRate + '%',                 c: 'var(--green)'  },
            { l: 'Total Clicks', v: totals.clicks.toLocaleString(), c: 'var(--purple)' },
            { l: 'Replies',      v: totals.replies.toLocaleString(),c: 'var(--acc)'    },
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Filters + tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'email', 'sms', 'sequence'] as const).map(f => (
            <button key={f} className={`pill ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}
              style={filter === f && f !== 'all' ? { background: (TYPE_META[f as CampaignType]?.color ?? '') + '18', color: TYPE_META[f as CampaignType]?.color, borderColor: (TYPE_META[f as CampaignType]?.color ?? '') + '40' } : {}}>
              {f === 'all' ? 'All' : TYPE_META[f as CampaignType].icon + ' ' + TYPE_META[f as CampaignType].label}
            </button>
          ))}
        </div>

        {/* Campaign rows */}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--t3)' }}>
            No campaigns yet. Create your first to start reaching contacts.
          </div>
        )}
        {filtered.map(c => {
          const meta = TYPE_META[c.type]
          const openR = c.sent_count ? Math.round(c.open_count / c.sent_count * 100) : 0
          const clickR = c.sent_count ? Math.round(c.click_count / c.sent_count * 100) : 0
          return (
            <div key={c.id} className="camp-row">
              <div className="camp-icon" style={{ background: meta.color + '18' }}>
                <span>{meta.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={c.status} />
                  <span className="tag" style={{ background: meta.color + '18', color: meta.color, fontSize: 10 }}>{meta.label}</span>
                  {c.from_email && <span style={{ fontSize: 11, color: 'var(--t3)' }}>from {c.from_email}</span>}
                </div>
              </div>
              {/* Stats bars */}
              {c.sent_count > 0 && (
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  {[
                    { l: 'Sent',   v: c.sent_count,   r: '' },
                    { l: 'Opens',  v: c.open_count,   r: openR + '%' },
                    { l: 'Clicks', v: c.click_count,  r: clickR + '%' },
                    { l: 'Replies',v: c.reply_count,  r: '' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center', minWidth: 48 }}>
                      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{s.v.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.l}{s.r ? ` (${s.r})` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              {c.sent_count === 0 && (
                <div style={{ fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                  {c.status === 'scheduled' && c.scheduled_at ? `Sends ${new Date(c.scheduled_at).toLocaleDateString()}` : 'Not sent yet'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                {(c.status === 'active' || c.status === 'paused') && (
                  <Toggle on={c.status === 'active'} onChange={() => toggleStatus(c.id)} />
                )}
                <button className="btn btn-ghost btn-xs" onClick={() => setModal(c)}>Edit</button>
                <button className="btn btn-danger btn-xs" onClick={() => del(c.id)}>✕</button>
              </div>
            </div>
          )
        })}

        {/* Quick-start templates */}
        <div style={{ marginTop: 24 }}>
          <div className="sh mb" style={{ marginBottom: 13 }}>Quick-Start Templates</div>
          <div className="g3">
            {[
              { name: 'Cold Outreach Sequence', type: 'sequence' as CampaignType, desc: '5-step email sequence for new prospects', icon: '🚀' },
              { name: 'Win-Back Campaign',       type: 'email'    as CampaignType, desc: 'Re-engage lost or cold contacts',        icon: '🔄' },
              { name: 'SMS Quick Blast',         type: 'sms'      as CampaignType, desc: 'Text all qualified leads an update',     icon: '📱' },
            ].map(t => (
              <div key={t.name} className="card card-sm" style={{ cursor: 'pointer', transition: 'border-color .12s' }}
                onClick={() => setModal({
                  id: '', workspace_id: '', name: t.name, type: t.type, status: 'draft',
                  subject: '', body: '', from_name: 'Your Name', from_email: 'you@co.com',
                  sent_count: 0, open_count: 0, click_count: 0, reply_count: 0, created_at: new Date().toISOString()
                })}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{t.desc}</div>
                <div className="tag mt" style={{ background: TYPE_META[t.type].color + '18', color: TYPE_META[t.type].color, fontSize: 10 }}>{TYPE_META[t.type].label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <CampaignModal
          campaign={modal === true ? null : modal}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
