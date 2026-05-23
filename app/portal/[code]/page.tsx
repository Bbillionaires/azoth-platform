'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Affiliate, AffiliateLead, AffiliateMaterial } from '@/lib/types'

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{
        background: copied ? 'var(--green)' : 'var(--acc)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '7px 16px',
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .2s',
      }}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

const matIcon = (type: string) => {
  if (type === 'image')    return '🖼'
  if (type === 'video')    return '🎬'
  if (type === 'document') return '📄'
  return '🔗'
}

export default function AffiliatePortal() {
  const { code } = useParams<{ code: string }>()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [leads,     setLeads]     = useState<AffiliateLead[]>([])
  const [materials, setMaterials] = useState<AffiliateMaterial[]>([])
  const [tab,       setTab]       = useState<'overview' | 'leads' | 'materials'>('overview')
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://azoth-platform.vercel.app'
  const myLink = `${BASE}/r/${code}`

  useEffect(() => {
    if (!code) return
    fetch(`/api/affiliate/portal?code=${code}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setNotFound(true); setLoading(false); return }
        setAffiliate(json.affiliate)
        setLeads(json.leads)
        setMaterials(json.materials)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [code])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--t3)', fontSize: 14 }}>Loading your portal…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Invalid affiliate link</div>
        <div style={{ fontSize: 13, color: 'var(--t3)' }}>This portal link is not valid. Please check your email for the correct link.</div>
      </div>
    </div>
  )

  const conv = affiliate!.total_clicks > 0
    ? ((affiliate!.total_leads / affiliate!.total_clicks) * 100).toFixed(1)
    : '0.0'

  // Group leads by source project
  const bySource = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source_project] = (acc[l.source_project] ?? 0) + 1
    return acc
  }, {})

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    background: active ? 'var(--acc-bg)' : 'transparent',
    color: active ? 'var(--acc)' : 'var(--t3)',
    transition: 'all .15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* Header */}
      <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--br)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#000' }}>A</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Affiliate Portal</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Welcome back, {affiliate!.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, background: 'var(--green)' + '22', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            {affiliate!.status}
          </span>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>{affiliate!.commission_rate}% commission</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

        {/* Your link hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--acc-bg) 0%, var(--s2) 100%)', border: '1px solid var(--acc-br)', borderRadius: 16, padding: '22px 24px', marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--acc)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Your Referral Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <code style={{ flex: 1, minWidth: 200, background: 'var(--s3)', border: '1px solid var(--br)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--t1)', wordBreak: 'break-all' }}>
              {myLink}
            </code>
            <CopyBtn text={myLink} label="Copy My Link" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>
            Share this link anywhere. Every visitor is tracked automatically — even if they don't convert immediately (30-day cookie).
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '👆', label: 'Total Clicks',  value: affiliate!.total_clicks ?? 0,  color: 'var(--acc)' },
            { icon: '🎯', label: 'Total Leads',   value: affiliate!.total_leads  ?? 0,  color: 'var(--green)' },
            { icon: '📊', label: 'Conversion',    value: `${conv}%`,                     color: 'var(--yellow)' },
            { icon: '💰', label: 'Commission',    value: `${affiliate!.commission_rate}%`, color: 'var(--t2)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          <button style={TAB_STYLE(tab === 'overview')}  onClick={() => setTab('overview')}>📈 Overview</button>
          <button style={TAB_STYLE(tab === 'leads')}     onClick={() => setTab('leads')}>🎯 Leads ({leads.length})</button>
          <button style={TAB_STYLE(tab === 'materials')} onClick={() => setTab('materials')}>📦 Marketing Kit ({materials.length})</button>
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Recent leads */}
            <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Recent Leads</div>
              {leads.length === 0 ? (
                <div style={{ color: 'var(--t3)', fontSize: 12.5, textAlign: 'center', padding: 20 }}>No leads yet — share your link to get started!</div>
              ) : (
                leads.slice(0, 5).map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--br)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--acc)' + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--acc)' }}>
                      {l.contact_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.contact_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{l.source_project} · {new Date(l.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
              {leads.length > 5 && (
                <button className="btn btn-ghost btn-xs" style={{ marginTop: 10, width: '100%' }} onClick={() => setTab('leads')}>
                  View all {leads.length} leads →
                </button>
              )}
            </div>

            {/* Lead sources */}
            <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Leads by Source</div>
              {Object.keys(bySource).length === 0 ? (
                <div style={{ color: 'var(--t3)', fontSize: 12.5, textAlign: 'center', padding: 20 }}>No data yet</div>
              ) : (
                Object.entries(bySource).map(([src, count]) => {
                  const pct = leads.length > 0 ? (count / leads.length) * 100 : 0
                  return (
                    <div key={src} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>{src}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3 }}>
                        <div style={{ height: 6, width: `${pct}%`, background: 'var(--acc)', borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick marketing tip */}
            <div style={{ background: 'var(--acc-bg)', border: '1px solid var(--acc-br)', borderRadius: 12, padding: 18, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--acc)', marginBottom: 8 }}>💡 Quick Marketing Tips</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { tip: 'Add your link to your Instagram bio for passive traffic', icon: '📱' },
                  { tip: 'Record a 60-second testimonial video and share on social', icon: '🎬' },
                  { tip: 'Mention your link in email signatures and newsletters', icon: '✉️' },
                ].map(t => (
                  <div key={t.tip} style={{ fontSize: 12, color: 'var(--t2)', display: 'flex', gap: 8 }}>
                    <span>{t.icon}</span>
                    <span>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leads table */}
        {tab === 'leads' && (
          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
            {leads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--t3)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No leads yet</div>
                <div style={{ fontSize: 12 }}>Share your referral link to start generating leads</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--s3)', borderBottom: '1px solid var(--br)' }}>
                    {['Name', 'Email', 'Source', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l.id} style={{ borderBottom: i < leads.length - 1 ? '1px solid var(--br)' : 'none' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 500 }}>{l.contact_name}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--t2)' }}>{l.contact_email}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, background: 'var(--acc-bg)', color: 'var(--acc)', padding: '2px 8px', borderRadius: 20 }}>{l.source_project}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--t3)', fontSize: 12 }}>
                        {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Marketing materials */}
        {tab === 'materials' && (
          <>
            {materials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--t3)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No materials uploaded yet</div>
                <div style={{ fontSize: 12 }}>Your admin team will add marketing resources here</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {materials.map(mat => (
                  <div key={mat.id} style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
                    {mat.thumbnail_url ? (
                      <div style={{ height: 120, background: `url(${mat.thumbnail_url}) center/cover`, borderBottom: '1px solid var(--br)' }} />
                    ) : (
                      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s3)', fontSize: 32 }}>
                        {matIcon(mat.file_type)}
                      </div>
                    )}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{mat.title}</div>
                        <span style={{ fontSize: 10, background: 'var(--acc-bg)', color: 'var(--acc)', padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>{mat.file_type}</span>
                      </div>
                      {mat.description && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 10 }}>{mat.description}</div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={mat.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ flex: 1, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 0', fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}
                        >
                          {mat.file_type === 'link' ? 'Visit Link ↗' : 'Download ↓'}
                        </a>
                        <CopyBtn text={mat.file_url} label="Copy" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
