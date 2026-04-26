'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar, Avatar, StagePill } from '@/components/ui'
import { fmtFull, AVATAR_COLORS, timeAgo } from '@/lib/utils'
import type { Contact } from '@/lib/types'

const TODAY = new Date().toISOString().split('T')[0]

function ContactModal({ contact, onSave, onClose }: { contact?: Contact | null; onSave: (c: Omit<Contact,'id'>) => void; onClose: () => void }) {
  const { pipelines, fields, activeWsId } = useApp()

  const firstPipelineId = pipelines[0]?.id ?? ''
  const firstStageId = pipelines[0]?.stages?.[0]?.id ?? ''

  const blank: Omit<Contact,'id'> = {
    workspace_id: activeWsId,
    pipeline_id: firstPipelineId,
    stage_id: firstStageId,
    name:'', email:'', phone:'', company:'', role:'',
    value:0, source:'Website', tags:[], notes:'', status:'active',
    color: AVATAR_COLORS[0], created_at: TODAY, last_contact: TODAY,
  }

  const [f, setF] = useState<Omit<Contact,'id'>>(contact ? { ...contact } : blank)
  const [tagsStr, setTagsStr] = useState((contact?.tags ?? []).join(', '))
  const set = (k: string, v: unknown) => setF(p => ({ ...p, [k]: v }))
  const selPl = pipelines.find(p => p.id === f.pipeline_id) ?? pipelines[0]
  const customFields = fields.filter(x => !x.builtin)

  const save = () => {
    if (!f.name || !f.email) return
    if (!f.pipeline_id || !f.stage_id) { alert('Please select a pipeline and stage'); return }
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    // Strip id entirely — let Supabase generate it
    const { id: _ignored, ...rest } = f as any
    onSave({
      ...rest,
      workspace_id: activeWsId,
      pipeline_id: f.pipeline_id || firstPipelineId,
      stage_id: f.stage_id || firstStageId,
      value: Number(f.value) || 0,
      tags,
    })
    onClose()
  }

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{contact ? 'Edit Contact' : 'New Contact'}</div>
        <div className="modal-sub">{contact ? 'Update contact record' : 'Add a contact to your CRM'}</div>
        <div className="fg2">
          <div className="field"><label className="fl">Full Name *</label><input className="fi" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Jane Smith"/></div>
          <div className="field"><label className="fl">Email *</label><input className="fi" type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="jane@co.com"/></div>
          <div className="field"><label className="fl">Phone</label><input className="fi" value={f.phone??''} onChange={e=>set('phone',e.target.value)} placeholder="(555) 000-0000"/></div>
          <div className="field"><label className="fl">Company</label><input className="fi" value={f.company??''} onChange={e=>set('company',e.target.value)} placeholder="Acme Corp"/></div>
          <div className="field"><label className="fl">Role</label><input className="fi" value={f.role??''} onChange={e=>set('role',e.target.value)} placeholder="VP of Engineering"/></div>
          <div className="field"><label className="fl">Deal Value ($)</label><input className="fi" type="number" value={f.value} onChange={e=>set('value',e.target.value)} placeholder="50000"/></div>
          <div className="field">
            <label className="fl">Pipeline</label>
            {pipelines.length > 0 ? (
              <select className="fs" value={f.pipeline_id} onChange={e=>{
                set('pipeline_id', e.target.value)
                set('stage_id', pipelines.find(p=>p.id===e.target.value)?.stages?.[0]?.id ?? '')
              }}>
                <option value="">— Select Pipeline —</option>
                {pipelines.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <div style={{padding:'8px 11px',background:'var(--s3)',border:'1px solid var(--br)',borderRadius:'var(--r8)',fontSize:12,color:'var(--t3)'}}>
                No pipelines yet — go to Settings to create one
              </div>
            )}
          </div>
          <div className="field">
            <label className="fl">Stage</label>
            {(selPl?.stages ?? []).length > 0 ? (
              <select className="fs" value={f.stage_id} onChange={e=>set('stage_id',e.target.value)}>
                <option value="">— Select Stage —</option>
                {(selPl?.stages ?? []).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <div style={{padding:'8px 11px',background:'var(--s3)',border:'1px solid var(--br)',borderRadius:'var(--r8)',fontSize:12,color:'var(--t3)'}}>
                {pipelines.length > 0 ? 'Select a pipeline first' : 'No stages available'}
              </div>
            )}
          </div>
          <div className="field">
            <label className="fl">Source</label>
            <select className="fs" value={f.source??'Website'} onChange={e=>set('source',e.target.value)}>
              {['Website','Referral','Cold Outreach','Event','Social','Other'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="fl">Status</label>
            <select className="fs" value={f.status} onChange={e=>set('status',e.target.value as 'active'|'inactive')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {customFields.map(cf=>(
            <div key={cf.id} className="field">
              <label className="fl">{cf.name}</label>
              {cf.type==='select'
                ? <select className="fs" value={(f[cf.key] as string)??''} onChange={e=>set(cf.key,e.target.value)}>
                    <option value="">—</option>
                    {(cf.options??[]).map(o=><option key={o}>{o}</option>)}
                  </select>
                : <input className="fi" type={cf.type==='number'?'number':'text'} value={(f[cf.key] as string)??''} onChange={e=>set(cf.key,e.target.value)}/>
              }
            </div>
          ))}
          <div className="field fc">
            <label className="fl">Tags (comma separated)</label>
            <input className="fi" value={tagsStr} onChange={e=>setTagsStr(e.target.value)} placeholder="enterprise, priority, tech"/>
          </div>
          <div className="field fc">
            <label className="fl">Notes</label>
            <textarea className="fta" value={f.notes??''} onChange={e=>set('notes',e.target.value)} placeholder="Add context, next steps…"/>
          </div>
          <div className="field fc">
            <label className="fl">Avatar Color</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {AVATAR_COLORS.map(c=>(
                <div key={c} onClick={()=>set('color',c)} style={{width:22,height:22,borderRadius:6,background:c,cursor:'pointer',outline:f.color===c?'2px solid white':'2px solid transparent',outlineOffset:2}}/>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-acc" onClick={save}>{contact?'Save Changes':'Add Contact'}</button>
        </div>
      </div>
    </div>
  )
}

function ContactDetail({ contact, onClose, onEdit }: { contact: Contact; onClose: () => void; onEdit: () => void }) {
  const { pipelines, threads } = useApp()
  const stage = pipelines.find(p=>p.id===contact.pipeline_id)?.stages.find(s=>s.id===contact.stage_id)
  const pl = pipelines.find(p=>p.id===contact.pipeline_id)
  const contactThreads = threads.filter(t=>t.contact_id===contact.id)

  const activity = [
    { icon:'📝', text:`Created in ${pl?.name ?? 'CRM'}`, time: contact.created_at },
    { icon:'📞', text:`Last contact: ${contact.last_contact}`, time: contact.last_contact },
    ...contactThreads.map(t=>({ icon:'💬', text:`Deal room: ${t.title}`, time: t.created_at })),
  ].sort((a,b)=>b.time.localeCompare(a.time))

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:20}}>
          <Avatar name={contact.name} color={contact.color} size={48}/>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:'-.3px'}}>{contact.name}</div>
            <div style={{fontSize:13,color:'var(--t2)',marginTop:2}}>{contact.role} {contact.company && `@ ${contact.company}`}</div>
            <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
              {stage && <StagePill stage={stage}/>}
              {(contact.tags||[]).map(t=><span key={t} className="tag" style={{background:'rgba(255,255,255,.06)',color:'var(--t2)'}}>{t}</span>)}
            </div>
          </div>
          <button className="btn btn-acc btn-sm" onClick={onEdit}>Edit</button>
        </div>

        <div className="g2" style={{marginBottom:16}}>
          <div>
            <div className="fl" style={{marginBottom:10}}>Contact Info</div>
            {[
              {l:'Email', v:contact.email, href:`mailto:${contact.email}`},
              {l:'Phone', v:contact.phone||'—'},
              {l:'Source', v:contact.source||'—'},
              {l:'Deal Value', v:fmtFull(contact.value)},
            ].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                <span style={{fontSize:12,color:'var(--t3)'}}>{r.l}</span>
                {r.href
                  ? <a href={r.href} style={{fontSize:12,color:'var(--blue)'}}>{r.v}</a>
                  : <span style={{fontSize:12,fontWeight:500}}>{r.v}</span>
                }
              </div>
            ))}
          </div>
          <div>
            <div className="fl" style={{marginBottom:10}}>Pipeline</div>
            <div style={{background:'var(--s3)',border:'1px solid var(--br)',borderRadius:'var(--r10)',padding:'12px 14px'}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>{pl?.name}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {(pl?.stages??[]).map(s=>(
                  <span key={s.id} className="tag" style={{
                    background:s.id===contact.stage_id?s.color+'30':'rgba(255,255,255,.04)',
                    color:s.id===contact.stage_id?s.color:'var(--t3)',
                    border:s.id===contact.stage_id?`1px solid ${s.color}50`:'none',
                    fontSize:10
                  }}>{s.name}</span>
                ))}
              </div>
            </div>
            {contact.notes && (
              <div style={{marginTop:10,padding:'10px 12px',background:'var(--s3)',border:'1px solid var(--br)',borderRadius:'var(--r8)',fontSize:12.5,color:'var(--t2)',lineHeight:1.6}}>
                {contact.notes}
              </div>
            )}
          </div>
        </div>

        <div className="fl" style={{marginBottom:10}}>Activity Timeline</div>
        <div style={{display:'flex',flexDirection:'column',background:'var(--s3)',borderRadius:'var(--r10)',border:'1px solid var(--br)',overflow:'hidden'}}>
          {activity.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',borderBottom:i<activity.length-1?'1px solid rgba(255,255,255,.04)':'none'}}>
              <span style={{fontSize:14}}>{a.icon}</span>
              <span style={{flex:1,fontSize:12.5}}>{a.text}</span>
              <span style={{fontSize:11,color:'var(--t3)'}}>{a.time}</span>
            </div>
          ))}
        </div>

        {contactThreads.length > 0 && (
          <div style={{marginTop:16}}>
            <div className="fl" style={{marginBottom:10}}>Deal Rooms</div>
            {contactThreads.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--s3)',borderRadius:'var(--r8)',border:'1px solid var(--br)',marginBottom:6}}>
                <span style={{fontSize:16}}>🏢</span>
                <span style={{flex:1,fontSize:13,fontWeight:500}}>{t.title}</span>
                <span style={{fontSize:11,color:'var(--t3)'}}>{timeAgo(t.last_message_at)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-foot" style={{justifyContent:'flex-start'}}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const { contacts, pipelines, fields, addContact, updateContact, deleteContact, loading } = useApp()
  const [modal, setModal] = useState<Contact | true | null>(null)
  const [detail, setDetail] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')
  const [selPl, setSelPl] = useState('all')
  const [selStage, setSelStage] = useState('all')
  const [selSource, setSelSource] = useState('all')
  const [sortBy, setSortBy] = useState<'name'|'value'|'last_contact'>('name')

  const sources = [...new Set(contacts.map(c=>c.source).filter(Boolean))] as string[]
  const pl = pipelines.find(p=>p.id===selPl)
  const stageList = pl?.stages ?? pipelines.flatMap(p=>p.stages ?? [])

  const filtered = useMemo(()=>{
    let r = [...contacts]
    if (search) r=r.filter(c=>[c.name,c.company,c.email,c.role].some(v=>(v??'').toLowerCase().includes(search.toLowerCase())))
    if (selPl!=='all') r=r.filter(c=>c.pipeline_id===selPl)
    if (selStage!=='all') r=r.filter(c=>c.stage_id===selStage)
    if (selSource!=='all') r=r.filter(c=>c.source===selSource)
    if (sortBy==='value') r.sort((a,b)=>b.value-a.value)
    else r.sort((a,b)=>(a[sortBy as keyof Contact]??'').toString().localeCompare((b[sortBy as keyof Contact]??'').toString()))
    return r
  },[contacts,search,selPl,selStage,selSource,sortBy])

  const customFields = fields.filter(f=>!f.builtin)

  const handleSave = (c: Omit<Contact,'id'>) => {
    if (modal === true) {
      addContact(c)
    } else if (modal && modal !== true) {
      updateContact({ ...c, id: modal.id })
    }
  }

  if (loading) return (
    <>
      <Topbar title="Contacts"/>
      <div className="page" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'50vh'}}>
        <div style={{color:'var(--t3)',fontSize:13}}>Loading contacts...</div>
      </div>
    </>
  )

  return (
    <>
      <Topbar title="Contacts">
        <button className="btn btn-acc btn-sm" onClick={()=>setModal(true)}>
          <span style={{fontSize:15}}>+</span> New Contact
        </button>
      </Topbar>
      <div className="page">
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:16}}>
          <div className="search-box" style={{width:220}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search contacts…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="fs" style={{width:'auto',padding:'6px 10px',fontSize:12.5}} value={selPl} onChange={e=>{setSelPl(e.target.value);setSelStage('all')}}>
            <option value="all">All Pipelines</option>
            {pipelines.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="fs" style={{width:'auto',padding:'6px 10px',fontSize:12.5}} value={selStage} onChange={e=>setSelStage(e.target.value)}>
            <option value="all">All Stages</option>
            {stageList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="fs" style={{width:'auto',padding:'6px 10px',fontSize:12.5}} value={selSource} onChange={e=>setSelSource(e.target.value)}>
            <option value="all">All Sources</option>
            {sources.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="fs" style={{width:'auto',padding:'6px 10px',fontSize:12.5}} value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)}>
            <option value="name">Sort: Name</option>
            <option value="value">Sort: Value ↓</option>
            <option value="last_contact">Sort: Recent</option>
          </select>
        </div>

        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th style={{paddingLeft:18}}>Contact</th>
                  <th>Pipeline / Stage</th>
                  <th>Value</th>
                  <th>Source</th>
                  <th>Tags</th>
                  {customFields.map(f=><th key={f.id}>{f.name}</th>)}
                  <th>Last Contact</th>
                  <th style={{paddingRight:18}}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0&&(
                  <tr><td colSpan={20}>
                    <div style={{textAlign:'center',padding:'32px',color:'var(--t3)',fontSize:13}}>
                      No contacts yet. Add your first contact to get started.
                    </div>
                  </td></tr>
                )}
                {filtered.map(c=>{
                  const pl2=pipelines.find(p=>p.id===c.pipeline_id)
                  const stage=pl2?.stages?.find(s=>s.id===c.stage_id)
                  return (
                    <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setDetail(c)}>
                      <td style={{paddingLeft:18}}>
                        <div className="row">
                          <Avatar name={c.name} color={c.color}/>
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                            <div style={{fontSize:11,color:'var(--t3)'}}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{fontSize:10.5,color:'var(--t3)',marginBottom:3}}>{pl2?.name}</div>
                        <StagePill stage={stage}/>
                      </td>
                      <td><span className="mono" style={{fontSize:13,color:'var(--acc)',fontWeight:600}}>{fmtFull(c.value)}</span></td>
                      <td><span style={{fontSize:12,color:'var(--t2)'}}>{c.source}</span></td>
                      <td>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {(c.tags??[]).map(t=><span key={t} className="tag" style={{background:'rgba(255,255,255,.06)',color:'var(--t2)'}}>{t}</span>)}
                        </div>
                      </td>
                      {customFields.map(f=><td key={f.id} style={{fontSize:12,color:'var(--t2)'}}>{(c[f.key] as string)??'—'}</td>)}
                      <td style={{fontSize:11.5,color:'var(--t3)'}}>{c.last_contact}</td>
                      <td style={{paddingRight:18}}>
                        <div className="row" style={{gap:5}} onClick={e=>e.stopPropagation()}>
                          <button className="btn btn-ghost btn-xs" onClick={()=>setModal(c)}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={()=>deleteContact(c.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{marginTop:10,fontSize:11.5,color:'var(--t3)',paddingLeft:2}}>
          {filtered.length} of {contacts.length} contacts · {fmtFull(filtered.reduce((a,c)=>a+c.value,0))} total value
        </div>
      </div>

      {modal && (
        <ContactModal
          contact={modal===true?null:modal}
          onSave={handleSave}
          onClose={()=>setModal(null)}
        />
      )}
      {detail && (
        <ContactDetail
          contact={detail}
          onClose={()=>setDetail(null)}
          onEdit={()=>{setModal(detail);setDetail(null)}}
        />
      )}
    </>
  )
}