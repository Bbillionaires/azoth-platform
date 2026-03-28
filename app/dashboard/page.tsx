'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { Topbar, Avatar, StagePill } from '@/components/ui'
import { fmtK, fmtFull, timeAgo } from '@/lib/utils'

export default function Dashboard() {
  const router = useRouter()
  const { contacts, pipelines, automations, campaigns, threads, messages, members, getStage, getPipeline } = useApp() as ReturnType<typeof useApp> & { getStage?: (c: any) => any; getPipeline?: (c: any) => any }
  const p1 = pipelines[0]
  const stages = p1?.stages ?? []
  const open = contacts.filter(c => !['s5','s6'].includes(c.stage_id))
  const won  = contacts.filter(c => c.stage_id === 's5')
  const pipeline = open.reduce((a,c) => a + c.value, 0)
  const wonVal   = won.reduce((a,c)  => a + c.value, 0)
  const maxV = Math.max(...stages.map(s => contacts.filter(c => c.stage_id === s.id && c.pipeline_id === p1?.id).reduce((a,c) => a+c.value, 0)), 1)
  const recent = [...contacts].sort((a,b) => b.last_contact.localeCompare(a.last_contact)).slice(0, 5)
  const recentMsgs = [...messages].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)

  const getStageFor = (c: typeof contacts[0]) => {
    const pl = pipelines.find(p => p.id === c.pipeline_id)
    return pl?.stages.find(s => s.id === c.stage_id)
  }
  const getThread = (id: string) => threads.find(t => t.id === id)

  return (
    <>
      <Topbar title="Dashboard">
        <button className="btn btn-acc btn-sm" onClick={() => router.push('/contacts')}>+ Add Contact</button>
      </Topbar>
      <div className="page">
        {/* Stats */}
        <div className="stat-g">
          {[
            { l:'Contacts',    v: contacts.length,                        c:'var(--blue)',   ch:'+3 this week' },
            { l:'Pipeline',    v: fmtK(pipeline),                         c:'var(--acc)',    ch:'↑ 14.2%' },
            { l:'Won Revenue', v: fmtK(wonVal),                           c:'var(--green)',  ch:'↑ 8.1%' },
            { l:'Active Camps',v: campaigns.filter(c=>c.status==='active').length, c:'var(--purple)', ch:`of ${campaigns.length} total` },
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{ color: s.c }}>{String(s.v)}</div>
              <div className="stat-c" style={{ color: 'var(--green)' }}>{s.ch}</div>
            </div>
          ))}
        </div>

        <div className="g2 mb">
          {/* Pipeline */}
          <div className="card">
            <div className="row mb" style={{ marginBottom: 13 }}>
              <span className="sh">Pipeline Breakdown</span>
              <span className="dim" style={{ fontSize: 11, marginLeft: 'auto' }}>{p1?.name}</span>
            </div>
            {stages.slice(0, 5).map(s => {
              const v = contacts.filter(c => c.stage_id === s.id && c.pipeline_id === p1?.id).reduce((a,c) => a+c.value, 0)
              const n = contacts.filter(c => c.stage_id === s.id && c.pipeline_id === p1?.id).length
              return (
                <div key={s.id} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--t2)' }}>{s.name} <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{n}</span></span>
                    <span className="mono" style={{ fontSize: 11.5, color: s.color }}>{fmtFull(v)}</span>
                  </div>
                  <div className="prog"><div className="prog-fill" style={{ width: `${(v/maxV)*100}%`, background: s.color }} /></div>
                </div>
              )
            })}
          </div>

          {/* Team Activity (Basecamp feel) */}
          <div className="card">
            <div className="row" style={{ marginBottom: 13 }}>
              <span className="sh">Team Activity</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => router.push('/inbox')}>Open Inbox</button>
            </div>
            {recentMsgs.map(m => {
              const thread = getThread(m.thread_id)
              return (
                <div key={m.id} style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }}
                  onClick={() => router.push('/inbox')}>
                  <div className="av" style={{ width: 26, height: 26, background: m.author_color + '22', color: m.author_color, fontSize: 9, borderRadius: 6, flexShrink: 0, marginTop: 1 }}>
                    {m.author_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>{thread?.title}</div>
                    <div style={{ fontSize: 12.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--t1)' }}>
                      <strong style={{ fontWeight: 600 }}>{m.author_name}:</strong> {m.body}
                    </div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--t3)', flexShrink: 0 }}>{timeAgo(m.created_at)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="g2">
          {/* Recent Contacts */}
          <div className="card">
            <div className="row" style={{ marginBottom: 13 }}>
              <span className="sh">Recent Contacts</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => router.push('/contacts')}>View all</button>
            </div>
            {recent.map(c => {
              const stage = getStageFor(c)
              const pl = pipelines.find(p => p.id === c.pipeline_id)
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <Avatar name={c.name} color={c.color} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.company}</div>
                  </div>
                  <StagePill stage={stage} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--acc)', flexShrink: 0 }}>{fmtK(c.value)}</span>
                </div>
              )
            })}
          </div>

          {/* Campaign & Automation summary */}
          <div className="card">
            <div className="row" style={{ marginBottom: 13 }}>
              <span className="sh">Campaigns Running</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => router.push('/campaigns')}>View all</button>
            </div>
            {campaigns.slice(0, 4).map(c => {
              const rate = c.sent_count ? Math.round(c.open_count / c.sent_count * 100) : 0
              const typeColor: Record<string, string> = { email: 'var(--blue)', sms: 'var(--green)', sequence: 'var(--purple)' }
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize: 16 }}>{c.type === 'email' ? '✉️' : c.type === 'sms' ? '💬' : '🔁'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.sent_count} sent · {rate}% open rate</div>
                  </div>
                  <span className="tag" style={{ background: (typeColor[c.type] || 'var(--blue)') + '18', color: typeColor[c.type] || 'var(--blue)', fontSize: 10 }}>{c.status}</span>
                </div>
              )
            })}
            <hr className="div" />
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="sh" style={{ fontSize: 12.5 }}>Automations</span>
              <span className="dim" style={{ fontSize: 11, marginLeft: 'auto' }}>{automations.filter(a=>a.active).length} active</span>
            </div>
            {automations.slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <div className="dot" style={{ background: a.active ? 'var(--green)' : 'var(--t3)' }} />
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--t2)' }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
