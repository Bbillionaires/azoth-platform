'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import type { Affiliate, AffiliateMaterial } from '@/lib/types'

const FILE_TYPES = ['image', 'video', 'document', 'link'] as const
const STATUS_COLOR: Record<string, string> = {
  active: 'var(--green)',
  paused: 'var(--yellow)',
  suspended: 'var(--red)',
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn btn-ghost btn-xs"
      style={{ fontSize: 10.5, padding: '2px 8px' }}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function AffiliatesPage() {
  const { workspace, activeWsId } = useApp()
  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://azoth-platform.vercel.app'

  const [affiliates,  setAffiliates]  = useState<Affiliate[]>([])
  const [materials,   setMaterials]   = useState<AffiliateMaterial[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'affiliates' | 'materials'>('affiliates')

  // New affiliate form
  const [showForm,    setShowForm]    = useState(false)
  const [formName,    setFormName]    = useState('')
  const [formEmail,   setFormEmail]   = useState('')
  const [formDest,    setFormDest]    = useState('')
  const [formRate,    setFormRate]    = useState('10')
  const [saving,      setSaving]      = useState(false)

  // New material form
  const [showMatForm, setShowMatForm] = useState(false)
  const [matTitle,    setMatTitle]    = useState('')
  const [matDesc,     setMatDesc]     = useState('')
  const [matUrl,      setMatUrl]      = useState('')
  const [matType,     setMatType]     = useState<string>('image')
  const [matThumb,    setMatThumb]    = useState('')
  const [matSaving,   setMatSaving]   = useState(false)

  const load = useCallback(async () => {
    if (!activeWsId) return
    setLoading(true)
    const [affRes, matRes] = await Promise.all([
      fetch(`/api/affiliate?workspace_id=${activeWsId}`),
      fetch(`/api/affiliate/materials?workspace_id=${activeWsId}`),
    ])
    const affJson = await affRes.json()
    const matJson = await matRes.json()
    if (affJson.affiliates) setAffiliates(affJson.affiliates)
    if (matJson.materials)  setMaterials(matJson.materials)
    setLoading(false)
  }, [activeWsId])

  useEffect(() => { load() }, [load])

  const createAffiliate = async () => {
    if (!formName || !formEmail || !formDest) return
    setSaving(true)
    const res = await fetch('/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: activeWsId,
        name: formName,
        email: formEmail,
        destination_url: formDest,
        commission_rate: parseFloat(formRate) || 10,
      }),
    })
    const json = await res.json()
    if (json.affiliate) {
      setAffiliates(p => [json.affiliate, ...p])
      setShowForm(false)
      setFormName(''); setFormEmail(''); setFormDest(''); setFormRate('10')
    }
    setSaving(false)
  }

  const toggleStatus = async (aff: Affiliate) => {
    const next = aff.status === 'active' ? 'paused' : 'active'
    const res = await fetch('/api/affiliate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: aff.id, status: next }),
    })
    const json = await res.json()
    if (json.affiliate) setAffiliates(p => p.map(a => a.id === aff.id ? json.affiliate : a))
  }

  const deleteAffiliate = async (id: string) => {
    if (!confirm('Remove this affiliate? This cannot be undone.')) return
    await fetch(`/api/affiliate?id=${id}`, { method: 'DELETE' })
    setAffiliates(p => p.filter(a => a.id !== id))
  }

  const createMaterial = async () => {
    if (!matTitle || !matUrl || !matType) return
    setMatSaving(true)
    const res = await fetch('/api/affiliate/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: activeWsId,
        title: matTitle,
        description: matDesc || null,
        file_url: matUrl,
        file_type: matType,
        thumbnail_url: matThumb || null,
      }),
    })
    const json = await res.json()
    if (json.material) {
      setMaterials(p => [json.material, ...p])
      setShowMatForm(false)
      setMatTitle(''); setMatDesc(''); setMatUrl(''); setMatThumb('')
    }
    setMatSaving(false)
  }

  const deleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return
    await fetch(`/api/affiliate/materials?id=${id}`, { method: 'DELETE' })
    setMaterials(p => p.filter(m => m.id !== id))
  }

  const matIcon = (type: string) => {
    if (type === 'image')    return '🖼'
    if (type === 'video')    return '🎬'
    if (type === 'document') return '📄'
    return '🔗'
  }

  return (
    <main style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Affiliates</h1>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>
            Manage referral partners for <strong>{workspace?.name ?? 'your workspace'}</strong>
          </div>
        </div>
        <button
          className="btn btn-acc"
          onClick={() => tab === 'affiliates' ? setShowForm(true) : setShowMatForm(true)}
        >
          + {tab === 'affiliates' ? 'Add Affiliate' : 'Add Material'}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Affiliates', value: affiliates.length },
          { label: 'Active',           value: affiliates.filter(a => a.status === 'active').length },
          { label: 'Total Clicks',     value: affiliates.reduce((s, a) => s + (a.total_clicks ?? 0), 0) },
          { label: 'Total Leads',      value: affiliates.reduce((s, a) => s + (a.total_leads ?? 0), 0) },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--acc)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--br)', paddingBottom: 0 }}>
        {(['affiliates', 'materials'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: tab === t ? '2px solid var(--acc)' : '2px solid transparent',
              color: tab === t ? 'var(--acc)' : 'var(--t3)',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {t === 'affiliates' ? `👥 Affiliates (${affiliates.length})` : `📦 Marketing Materials (${materials.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--t3)', textAlign: 'center', padding: 48 }}>Loading…</div>
      ) : tab === 'affiliates' ? (

        /* ── Affiliates table ── */
        <>
          {showForm && (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--acc-br)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Affiliate</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field"><label className="fl">Full Name</label><input className="fi" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Jane Smith" /></div>
                <div className="field"><label className="fl">Email</label><input className="fi" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@example.com" /></div>
                <div className="field"><label className="fl">Destination URL (where link takes visitors)</label><input className="fi" value={formDest} onChange={e => setFormDest(e.target.value)} placeholder="https://oneunitedenterprise.vercel.app" /></div>
                <div className="field"><label className="fl">Commission % (for tracking only)</label><input className="fi" type="number" value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="10" /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-acc btn-sm" onClick={createAffiliate} disabled={saving}>{saving ? 'Creating…' : 'Create Affiliate'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {affiliates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--t3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No affiliates yet</div>
              <div style={{ fontSize: 13 }}>Click "+ Add Affiliate" to create your first referral partner</div>
            </div>
          ) : (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--br)', background: 'var(--s3)' }}>
                    {['Affiliate', 'Code & Link', 'Clicks', 'Leads', 'Conv%', 'Commission', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((aff, i) => {
                    const link = `${BASE}/r/${aff.code}`
                    const portalLink = `${BASE}/portal/${aff.code}`
                    const conv = aff.total_clicks > 0 ? ((aff.total_leads / aff.total_clicks) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={aff.id} style={{ borderBottom: i < affiliates.length - 1 ? '1px solid var(--br)' : 'none' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{aff.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{aff.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <code style={{ fontSize: 11, background: 'var(--s3)', padding: '2px 6px', borderRadius: 4, color: 'var(--acc)' }}>{aff.code}</code>
                            <CopyBtn text={link} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                            Portal: <a href={portalLink} target="_blank" rel="noreferrer" style={{ color: 'var(--acc)', textDecoration: 'none' }}>{portalLink.replace('https://', '').slice(0, 40)}</a>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{aff.total_clicks ?? 0}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--green)' }}>{aff.total_leads ?? 0}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>{conv}%</td>
                        <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>{aff.commission_rate}%</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, background: STATUS_COLOR[aff.status] + '22', color: STATUS_COLOR[aff.status], padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {aff.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => toggleStatus(aff)}>
                              {aff.status === 'active' ? 'Pause' : 'Activate'}
                            </button>
                            <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)' }} onClick={() => deleteAffiliate(aff.id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>

      ) : (

        /* ── Marketing Materials ── */
        <>
          {showMatForm && (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--acc-br)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add Marketing Material</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field"><label className="fl">Title</label><input className="fi" value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Brand Kit — Summer 2026" /></div>
                <div className="field">
                  <label className="fl">Type</label>
                  <select className="fs" value={matType} onChange={e => setMatType(e.target.value)}>
                    {FILE_TYPES.map(t => <option key={t} value={t}>{matIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label className="fl">File / Link URL</label><input className="fi" value={matUrl} onChange={e => setMatUrl(e.target.value)} placeholder="https://drive.google.com/file/..." /></div>
                <div className="field"><label className="fl">Thumbnail URL (optional)</label><input className="fi" value={matThumb} onChange={e => setMatThumb(e.target.value)} placeholder="https://..." /></div>
                <div className="field"><label className="fl">Description (optional)</label><input className="fi" value={matDesc} onChange={e => setMatDesc(e.target.value)} placeholder="Describe this material..." /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-acc btn-sm" onClick={createMaterial} disabled={matSaving}>{matSaving ? 'Saving…' : 'Add Material'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowMatForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {materials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--t3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No materials yet</div>
              <div style={{ fontSize: 13 }}>Upload images, videos, docs, or links affiliates can use to market for you</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {materials.map(mat => (
                <div key={mat.id} style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
                  {mat.thumbnail_url && (
                    <div style={{ height: 130, background: `url(${mat.thumbnail_url}) center/cover`, borderBottom: '1px solid var(--br)' }} />
                  )}
                  {!mat.thumbnail_url && (
                    <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s3)', fontSize: 36 }}>
                      {matIcon(mat.file_type)}
                    </div>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{mat.title}</div>
                      <span style={{ fontSize: 10, background: 'var(--acc-bg)', color: 'var(--acc)', padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        {mat.file_type}
                      </span>
                    </div>
                    {mat.description && <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>{mat.description}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={mat.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs" style={{ fontSize: 11 }}>Open ↗</a>
                      <CopyBtn text={mat.file_url} />
                      <button className="btn btn-ghost btn-xs" style={{ fontSize: 11, color: 'var(--red)', marginLeft: 'auto' }} onClick={() => deleteMaterial(mat.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
