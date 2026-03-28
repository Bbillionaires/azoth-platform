'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar, Avatar } from '@/components/ui'
import { fmtFull } from '@/lib/utils'

export default function PipelinePage() {
  const { contacts, pipelines, moveStage } = useApp()
  const [activePlId, setActivePlId] = useState(pipelines[0]?.id ?? '')
  const pl = pipelines.find(p=>p.id===activePlId) ?? pipelines[0]
  if (!pl) return <><Topbar title="Pipeline"/><div className="page"><p className="dim" style={{padding:32}}>No pipelines. Go to Settings to create one.</p></div></>

  const plContacts = contacts.filter(c=>c.pipeline_id===pl.id)

  return (
    <>
      <Topbar title="Pipeline"/>
      <div className="page">
        <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
          {pipelines.map(p=>(
            <button key={p.id} className={`pill ${activePlId===p.id?'on':''}`}
              style={activePlId===p.id?{background:p.color+'18',color:p.color,borderColor:p.color+'44'}:{}}
              onClick={()=>setActivePlId(p.id)}>
              <div className="dot" style={{background:activePlId===p.id?p.color:'var(--t3)'}}/>
              {p.name}
              <span style={{marginLeft:2,fontSize:10,opacity:.7}}>{contacts.filter(c=>c.pipeline_id===p.id).length}</span>
            </button>
          ))}
        </div>

        <div className="kb" style={{height:'calc(100vh - 190px)'}}>
          {pl.stages.map(stage=>{
            const cols = plContacts.filter(c=>c.stage_id===stage.id)
            const total = cols.reduce((a,c)=>a+c.value,0)
            return (
              <div key={stage.id} className="kb-col">
                <div style={{marginBottom:10,paddingBottom:8,borderBottom:`2px solid ${stage.color}44`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:stage.color}}>{stage.name}</span>
                    <span className="tag" style={{background:'rgba(255,255,255,.06)',color:'var(--t3)',fontSize:10}}>{cols.length}</span>
                  </div>
                  <span className="mono" style={{fontSize:11,color:'var(--t3)'}}>{fmtFull(total)}</span>
                </div>
                <div style={{overflowY:'auto',maxHeight:'calc(100vh - 255px)',paddingRight:2}}>
                  {cols.map(c=>(
                    <div key={c.id} className="kb-card">
                      <div className="row" style={{marginBottom:8}}>
                        <Avatar name={c.name} color={c.color} size={26}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{c.name}</div>
                          <div style={{fontSize:10.5,color:'var(--t3)'}}>{c.company}</div>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span className="mono" style={{fontSize:12,color:stage.color,fontWeight:600}}>{fmtFull(c.value)}</span>
                        <span style={{fontSize:10,color:'var(--t3)',background:'rgba(255,255,255,.04)',padding:'2px 6px',borderRadius:4}}>{c.source}</span>
                      </div>
                      {(c.tags??[]).length>0&&(
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
                          {c.tags.map(t=><span key={t} className="tag" style={{fontSize:9.5,background:'rgba(255,255,255,.05)',color:'var(--t3)'}}>{t}</span>)}
                        </div>
                      )}
                      <select className="fs" style={{fontSize:11,padding:'4px 7px',marginTop:2}} value={stage.id} onChange={e=>moveStage(c.id,e.target.value)}>
                        {pl.stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  ))}
                  {cols.length===0&&<div className="kb-empty">No contacts</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
