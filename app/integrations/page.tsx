'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'

/* ── Types ── */
interface SavedIntegration {
  id: string
  workspace_id: string
  type: string
  config: Record<string, string>
  enabled: boolean
  created_at: string
}

/* ── Integration definitions ── */
const INTEGRATIONS = [
  { id: 'zapier',     name: 'Zapier',     icon: '⚡', desc: 'No-code automation · 5,000+ apps',  cat: 'automation', configurable: true  },
  { id: 'make',       name: 'Make',       icon: '🔀', desc: 'Visual workflow automation',          cat: 'automation', configurable: false },
  { id: 'n8n',        name: 'n8n',        icon: '🔧', desc: 'Self-hosted automation engine',       cat: 'automation', configurable: false },
  { id: 'slack',      name: 'Slack',      icon: '💬', desc: 'Team notifications + deal alerts',    cat: 'comms',      configurable: true  },
  { id: 'twilio',     name: 'Twilio',     icon: '📱', desc: 'SMS sending for campaigns',           cat: 'comms',      configurable: true  },
  { id: 'sendgrid',   name: 'SendGrid',   icon: '✉️', desc: 'Transactional + bulk email',          cat: 'comms',      configurable: true  },
  { id: 'calendly',   name: 'Calendly',   icon: '📅', desc: 'Book meetings → create contacts',     cat: 'tools',      configurable: true  },
  { id: 'hubspot',    name: 'HubSpot',    icon: '🔶', desc: 'Bi-directional CRM sync',             cat: 'crm',        configurable: false },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', desc: 'Enterprise CRM + opportunity sync',  cat: 'crm',        configurable: false },
  { id: 'notion',     name: 'Notion',     icon: '📝', desc: 'Database + wiki sync',                cat: 'tools',      configurable: false },
  { id: 'airtable',   name: 'Airtable',   icon: '📊', desc: 'Spreadsheet-style data sync',         cat: 'tools',      configurable: false },
]

const cats = ['all', 'automation', 'comms', 'crm', 'tools']

/* ── CopyBtn helper ── */
function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

/* ── Config form for each integration type ── */
function ConfigForm({
  type,
  activeWsId,
  existing,
  onSaved,
  onCancel,
}: {
  type: string
  activeWsId: string
  existing: Record<string, string>
  onSaved: (integration: SavedIntegration) => void
  onCancel: () => void
}) {
  const [fields, setFields] = useState<Record<string, string>>(existing)
  const [saving, setSaving] = useState(false)

  const set = (key: string, val: string) => setFields(p => ({ ...p, [key]: val }))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: activeWsId, type, config: fields }),
    })
    const json = await res.json()
    if (json.integration) onSaved(json.integration)
    setSaving(false)
  }

  const webhookUrl = `https://azoth-platform.vercel.app/api/webhooks?workspace_id=${activeWsId}&token=azoth_live_${activeWsId.slice(0, 8)}`

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--acc-br)', borderRadius: 10, padding: 16, marginTop: 8 }}>
      {type === 'slack' && (
        <div className="field">
          <label className="fl">Slack Incoming Webhook URL</label>
          <input className="fi" value={fields.webhook_url ?? ''} onChange={e => set('webhook_url', e.target.value)} placeholder="https://hooks.slack.com/services/..." />
        </div>
      )}

      {type === 'calendly' && (
        <div className="field">
          <label className="fl">Your Calendly Link</label>
          <input className="fi" value={fields.calendly_url ?? ''} onChange={e => set('calendly_url', e.target.value)} placeholder="https://calendly.com/your-name" />
        </div>
      )}

      {type === 'sendgrid' && (
        <div className="field">
          <label className="fl">SendGrid API Key</label>
          <input className="fi" type="password" value={fields.api_key ?? ''} onChange={e => set('api_key', e.target.value)} placeholder="SG.xxxxxxxx..." />
        </div>
      )}

      {type === 'twilio' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="fl">Account SID</label>
              <input className="fi" value={fields.account_sid ?? ''} onChange={e => set('account_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </div>
            <div className="field">
              <label className="fl">Auth Token</label>
              <input className="fi" type="password" value={fields.auth_token ?? ''} onChange={e => set('auth_token', e.target.value)} placeholder="••••••••••••••••" />
            </div>
            <div className="field">
              <label className="fl">Twilio Phone Number</label>
              <input className="fi" value={fields.phone_number ?? ''} onChange={e => set('phone_number', e.target.value)} placeholder="+15551234567" />
            </div>
          </div>
        </>
      )}

      {type === 'zapier' && (
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 10 }}>
            Paste this URL into Zapier as a <strong style={{ color: 'var(--t1)' }}>Catch Hook</strong> trigger in your Zap:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s3)', border: '1px solid var(--br)', borderRadius: 8, padding: '10px 14px' }}>
            <code style={{ flex: 1, fontSize: 11.5, color: 'var(--acc)', wordBreak: 'break-all' }}>{webhookUrl}</code>
            <CopyBtn text={webhookUrl} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {type !== 'zapier' && (
          <button className="btn btn-acc btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        {type === 'zapier' && (
          <button className="btn btn-acc btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Mark as configured'}
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function IntegrationsPage() {
  const { contacts, pipelines, activeWsId } = useApp()

  const [saved, setSaved] = useState<SavedIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [openConfig, setOpenConfig] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const apiKey = `azoth_live_${activeWsId?.slice(0, 8) ?? 'xxxxxxxx'}`

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(null), 1800)
  }

  const load = useCallback(async () => {
    if (!activeWsId) return
    setLoading(true)
    const res = await fetch(`/api/integrations?workspace_id=${activeWsId}`)
    const json = await res.json()
    if (json.integrations) setSaved(json.integrations)
    setLoading(false)
  }, [activeWsId])

  useEffect(() => { load() }, [load])

  const getSaved = (type: string) => saved.find(s => s.type === type)

  const hasConfig = (type: string) => {
    const s = getSaved(type)
    if (!s) return false
    return Object.values(s.config).some(v => v && v.length > 0)
  }

  const isEnabled = (type: string) => {
    const s = getSaved(type)
    return s ? s.enabled : false
  }

  const dotColor = (type: string) => {
    const s = getSaved(type)
    if (!s || !s.enabled) return 'rgba(255,255,255,.12)'
    if (hasConfig(type)) return 'var(--green)'
    return 'var(--yellow)'
  }

  const toggleEnabled = async (type: string) => {
    if (!activeWsId) return
    const current = isEnabled(type)
    const s = getSaved(type)

    // If no saved row yet, create one then toggle
    if (!s) {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: activeWsId, type, config: {} }),
      })
      const json = await res.json()
      if (json.integration) setSaved(p => [...p.filter(x => x.type !== type), json.integration])
      return
    }

    const res = await fetch('/api/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: activeWsId, type, enabled: !current }),
    })
    const json = await res.json()
    if (json.integration) setSaved(p => p.map(x => x.type === type ? json.integration : x))
  }

  const onSaved = (integration: SavedIntegration) => {
    setSaved(p => [...p.filter(x => x.type !== integration.type), integration])
    setOpenConfig(null)
  }

  const exportJSON = () => {
    const exp = { version: '2.0', exported: new Date().toISOString(), pipelines, contacts, meta: { total: contacts.length } }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' }))
    a.download = 'AZOTH-export.json'; a.click()
  }

  const filtered = INTEGRATIONS.filter(i => catFilter === 'all' || i.cat === catFilter)
  const connectedCount = saved.filter(s => s.enabled).length

  return (
    <>
      <Topbar title="Integrations" />
      <div className="page">

        {/* Stats */}
        <div className="g3 mb">
          {[
            { l: 'Connected Apps', v: connectedCount,                           c: 'var(--acc)'    },
            { l: 'Configured',     v: saved.filter(s => hasConfig(s.type)).length, c: 'var(--green)'  },
            { l: 'Pending Setup',  v: saved.filter(s => s.enabled && !hasConfig(s.type)).length, c: 'var(--yellow)' },
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{ fontSize: 22, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Integration grid */}
        <div className="card mb">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="sh">App Connections</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {cats.map(c => (
                <button
                  key={c}
                  className="btn btn-ghost btn-xs"
                  style={{
                    fontSize: 10.5, textTransform: 'capitalize',
                    background: catFilter === c ? 'rgba(91,142,245,.1)' : '',
                    color: catFilter === c ? 'var(--blue)' : '',
                    borderColor: catFilter === c ? 'rgba(91,142,245,.25)' : '',
                  }}
                  onClick={() => setCatFilter(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--t3)', textAlign: 'center', padding: 32 }}>Loading…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {filtered.map(i => {
                const enabled = isEnabled(i.id)
                const configured = hasConfig(i.id)
                const isOpen = openConfig === i.id

                return (
                  <div key={i.id}>
                    <div
                      style={{
                        background: 'var(--s1)',
                        border: `1px solid ${enabled && configured ? 'rgba(62,207,142,.2)' : enabled ? 'rgba(255,200,60,.15)' : 'var(--br)'}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{i.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {i.name}
                          {!i.configurable && (
                            <span style={{ fontSize: 9.5, background: 'var(--s3)', color: 'var(--t3)', padding: '1px 5px', borderRadius: 10, fontWeight: 500 }}>
                              Soon
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 8 }}>{i.desc}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* Toggle button */}
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{
                              fontSize: 10.5,
                              background: enabled ? 'rgba(62,207,142,.1)' : '',
                              color: enabled ? 'var(--green)' : 'var(--t3)',
                              borderColor: enabled ? 'rgba(62,207,142,.25)' : '',
                            }}
                            onClick={() => toggleEnabled(i.id)}
                          >
                            {enabled ? 'Enabled' : 'Disabled'}
                          </button>

                          {/* Configure button — only for configurable integrations */}
                          {i.configurable && (
                            <button
                              className="btn btn-ghost btn-xs"
                              style={{ fontSize: 10.5 }}
                              onClick={() => setOpenConfig(isOpen ? null : i.id)}
                            >
                              {isOpen ? 'Close' : 'Configure'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div
                        className="dot"
                        style={{ background: dotColor(i.id), marginTop: 3, flexShrink: 0 }}
                        title={enabled && configured ? 'Active' : enabled ? 'Enabled — needs config' : 'Disabled'}
                      />
                    </div>

                    {/* Inline config form */}
                    {isOpen && i.configurable && activeWsId && (
                      <ConfigForm
                        type={i.id}
                        activeWsId={activeWsId}
                        existing={getSaved(i.id)?.config ?? {}}
                        onSaved={onSaved}
                        onCancel={() => setOpenConfig(null)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--br)' }}>
            {[
              { color: 'var(--green)',               label: 'Enabled + configured' },
              { color: 'var(--yellow)',              label: 'Enabled, needs config' },
              { color: 'rgba(255,255,255,.12)',       label: 'Disabled' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t3)' }}>
                <div className="dot" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* API Key + export */}
        <div className="g2 mb">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sh">API Key</span>
              <button className="btn btn-ghost btn-xs" onClick={() => copy(apiKey, 'key')}>
                {copied === 'key' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="code" style={{ fontSize: 10.5, color: 'var(--acc)', marginBottom: 14 }}>{apiKey}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, marginBottom: 16 }}>
              Keep secret. Rotate anytime. Rate limited per plan.
            </div>
            <hr className="div" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-acc btn-sm" onClick={exportJSON}>Export JSON</button>
              <a href="/connect" className="btn btn-ghost btn-sm">Connect Your Site →</a>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sh">Workspace ID</span>
              <button className="btn btn-ghost btn-xs" onClick={() => copy(activeWsId ?? '', 'wsid')}>
                {copied === 'wsid' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="code" style={{ fontSize: 10.5, color: 'var(--t2)', marginBottom: 14 }}>
              {activeWsId ?? 'Loading…'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
              Use this alongside your API key to route contacts and events to this workspace from external systems.
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
