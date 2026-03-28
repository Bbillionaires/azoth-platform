'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar, Toggle } from '@/components/ui'
import { uid } from '@/lib/utils'
import type { Automation, TriggerType, ActionType } from '@/lib/types'

const TRIGGERS: {v:TriggerType;l:string;icon:string}[] = [
  {v:'stage_is',        l:'Stage becomes',       icon:'📌'},
  {v:'value_over',      l:'Deal value over',      icon:'💰'},
  {v:'tag_added',       l:'Tag added',            icon:'🏷️'},
  {v:'contact_created', l:'Contact created',      icon:'👤'},
  {v:'source_is',       l:'Source is',            icon:'📡'},
  {v:'campaign_opened', l:'Campaign email opened',icon:'✉️'},
  {v:'form_submitted',  l:'Form submitted',       icon:'📋'},
]
const ACTIONS: {v:ActionType;l:string;icon:string}[] = [
  {v:'webhook',         l:'Send webhook (POST)',   icon:'🔗'},
  {v:'add_tag',         l:'Add tag',               icon:'🏷️'},
  {v:'remove_tag',      l:'Remove tag',            icon:'✂️'},
  {v:'notify_slack',    l:'Slack notification',    icon:'💬'},
  {v:'send_email',      l:'Send email',            icon:'✉️'},
  {v:'send_sms',        l:'Send SMS',              icon:'📱'},
  {v:'assign_owner',    l:'Assign owner',          icon:'👤'},
  {v:'move_stage',      l:'Move to stage',         icon:'📌'},
  {v:'add_to_campaign', l:'Add to campaign',       icon:'📣'},
  {v:'create_task',     l:'Create task',           icon:'✅'},
]

function AutoModal({auto, onSave, onClose}: {auto?: Automation|null; onSave:(a:Automation)=>void; onClose:()=>void}) {
  const {campaigns, pipelines} = useApp()
  const blank: Automation = {id:'', workspace_id:'ws_demo_001', name:'', active:true, trigger:'stage_is', trigger_val:'', action:'webhook', action_val:'', run_count:0}
  const [f, setF] = useState<Automation>(auto ?? blank)
  const set=(k:keyof Automation,v:unknown)=>setF(p=>({...p,[k]:v}))

  const getValPlaceholder = () => {
    if (f.action==='webhook') return 'https://yourapp.com/webhook'
    if (f.action==='add_tag'||f.action==='remove_tag') return 'tag-name'
    if (f.action==='notify_slack') return 'https://hooks.slack.com/services/...'
    if (f.action==='send_email') return 'Subject: Deal update for {{name}}'
    if (f.action==='send_sms') return 'Hi {{first_name}}, quick update...'
    if (f.action==='assign_owner') return 'owner@company.com'
    if (f.action==='move_stage') return 'Stage name or ID'
    if (f.action==='add_to_campaign') return 'Campaign name or ID'
    if (f.action==='create_task') return 'Task title here'
    return 'value'
  }

  const getTriggerPlaceholder = () => {
    if (f.trigger==='stage_is') return 's5 (Won) or stage name'
    if (f.trigger==='value_over') return '50000'
    if (f.trigger==='tag_added') return 'enterprise'
    if (f.trigger==='source_is') return 'Referral'
    if (f.trigger==='campaign_opened') return 'Campaign name or ID'
    return 'value'
  }

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{auto?'Edit Automation':'New Automation'}</div>
        <div className="modal-sub">Trigger → Action rule that runs automatically</div>
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div className="field">
            <label className="fl">Automation Name</label>
            <input className="fi" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Won → Start onboarding"/>
          </div>

          {/* Trigger block */}
          <div style={{background:'var(--s3)',border:'1px solid rgba(232,160,69,.2)',borderRadius:'var(--r10)',padding:'14px 16px'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--acc)',marginBottom:10}}>⚡ Trigger — When this happens</div>
            <div className="fg2" style={{gap:10}}>
              <div className="field">
                <label className="fl">Event</label>
                <select className="fs" value={f.trigger} onChange={e=>set('trigger',e.target.value as TriggerType)}>
                  {TRIGGERS.map(t=><option key={t.v} value={t.v}>{t.icon} {t.l}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Match Value</label>
                <input className="fi" value={f.trigger_val} onChange={e=>set('trigger_val',e.target.value)} placeholder={getTriggerPlaceholder()}/>
              </div>
            </div>
          </div>

          <div style={{textAlign:'center',color:'var(--t3)',fontSize:20,letterSpacing:2}}>↓</div>

          {/* Action block */}
          <div style={{background:'var(--s3)',border:'1px solid rgba(62,207,142,.2)',borderRadius:'var(--r10)',padding:'14px 16px'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--green)',marginBottom:10}}>✦ Action — Do this</div>
            <div className="fg2" style={{gap:10}}>
              <div className="field">
                <label className="fl">Action Type</label>
                <select className="fs" value={f.action} onChange={e=>set('action',e.target.value as ActionType)}>
                  {ACTIONS.map(a=><option key={a.v} value={a.v}>{a.icon} {a.l}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">{f.action==='webhook'?'Webhook URL':f.action==='add_to_campaign'?'Campaign':f.action==='create_task'?'Task Title':'Value'}</label>
                {f.action==='add_to_campaign'
                  ? <select className="fs" value={f.action_val} onChange={e=>set('action_val',e.target.value)}>
                      <option value="">— Select Campaign —</option>
                      {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  : <input className="fi" value={f.action_val} onChange={e=>set('action_val',e.target.value)} placeholder={getValPlaceholder()}/>
                }
              </div>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0'}}>
            <Toggle on={f.active} onChange={v=>set('active',v)}/>
            <span style={{fontSize:13,color:'var(--t2)'}}>{f.active?'Automation is active':'Automation is paused'}</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-acc" onClick={()=>{if(f.name){onSave({...f,id:auto?.id??uid()});onClose()}}}>Save Automation</button>
        </div>
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const {automations, setAutomations} = useApp()
  const [modal, setModal] = useState<Automation|true|null>(null)

  const toggle = (id:string) => setAutomations(a=>a.map(x=>x.id===id?{...x,active:!x.active}:x))
  const del    = (id:string) => setAutomations(a=>a.filter(x=>x.id!==id))
  const save   = (a:Automation) => setAutomations(prev=>modal&&modal!==true?prev.map(x=>x.id===a.id?a:x):[...prev,a])

  const trig = (v:string) => TRIGGERS.find(t=>t.v===v)
  const act  = (v:string) => ACTIONS.find(a=>a.v===v)

  const active = automations.filter(a=>a.active)
  const paused = automations.filter(a=>!a.active)

  return (
    <>
      <Topbar title="Automations">
        <button className="btn btn-acc btn-sm" onClick={()=>setModal(true)}><span style={{fontSize:15}}>+</span> New Automation</button>
      </Topbar>
      <div className="page">
        {/* Summary */}
        <div className="g3 mb">
          {[
            {l:'Active Rules',    v:active.length,                                         c:'var(--green)'},
            {l:'Total Runs',      v:automations.reduce((a,x)=>a+(x.run_count??0),0),       c:'var(--blue)'},
            {l:'Paused',          v:paused.length,                                          c:'var(--t3)'},
          ].map(s=>(
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{fontSize:22,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        {automations.length===0&&<div className="card" style={{textAlign:'center',padding:'48px',color:'var(--t3)'}}>No automations yet. Create your first rule.</div>}

        {/* Active */}
        {active.length>0&&<div className="fl mb" style={{marginBottom:8,marginTop:4}}>Active ({active.length})</div>}
        {active.map(a=>(
          <div key={a.id} style={{background:'var(--s2)',border:'1px solid rgba(62,207,142,.15)',borderRadius:'var(--r12)',padding:'14px 18px',marginBottom:9,display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:36,height:36,borderRadius:9,background:'rgba(62,207,142,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⚡</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13.5,marginBottom:5}}>{a.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <span className="tag" style={{background:'rgba(232,160,69,.12)',color:'var(--acc)',fontSize:11}}>{trig(a.trigger)?.icon} {trig(a.trigger)?.l} "{a.trigger_val}"</span>
                <span style={{color:'var(--t3)',fontSize:13}}>→</span>
                <span className="tag" style={{background:'rgba(62,207,142,.1)',color:'var(--green)',fontSize:11}}>{act(a.action)?.icon} {act(a.action)?.l}</span>
                {a.action_val&&<span className="mono" style={{fontSize:10.5,color:'var(--t3)',overflow:'hidden',maxWidth:180,whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{a.action_val}</span>}
                {(a.run_count??0)>0&&<span style={{fontSize:10.5,color:'var(--t3)',marginLeft:4}}>{a.run_count} runs</span>}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <Toggle on={a.active} onChange={()=>toggle(a.id)}/>
              <button className="btn btn-ghost btn-xs" onClick={()=>setModal(a)}>Edit</button>
              <button className="btn btn-danger btn-xs" onClick={()=>del(a.id)}>✕</button>
            </div>
          </div>
        ))}

        {/* Paused */}
        {paused.length>0&&<div className="fl mb" style={{marginBottom:8,marginTop:12}}>Paused ({paused.length})</div>}
        {paused.map(a=>(
          <div key={a.id} style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--r12)',padding:'14px 18px',marginBottom:9,display:'flex',alignItems:'center',gap:14,opacity:.7}}>
            <div style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⏸</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13.5,marginBottom:5}}>{a.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <span className="tag" style={{background:'rgba(80,89,106,.2)',color:'var(--t2)',fontSize:11}}>{trig(a.trigger)?.l} "{a.trigger_val}"</span>
                <span style={{color:'var(--t3)',fontSize:13}}>→</span>
                <span className="tag" style={{background:'rgba(80,89,106,.2)',color:'var(--t2)',fontSize:11}}>{act(a.action)?.l}</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <Toggle on={false} onChange={()=>toggle(a.id)}/>
              <button className="btn btn-ghost btn-xs" onClick={()=>setModal(a)}>Edit</button>
              <button className="btn btn-danger btn-xs" onClick={()=>del(a.id)}>✕</button>
            </div>
          </div>
        ))}

        {/* Recipe templates */}
        <div style={{marginTop:28}}>
          <div className="sh mb" style={{marginBottom:13}}>Automation Recipes</div>
          <div className="g3">
            {[
              {name:'Won → Onboarding',  trigger:'stage_is',        tv:'s5',   action:'add_to_campaign', av:'c3', desc:'Add won contacts to onboarding email sequence'},
              {name:'Qualified → Outreach', trigger:'stage_is',     tv:'s2',   action:'add_to_campaign', av:'c1', desc:'Enroll qualified leads in cold outreach sequence'},
              {name:'New Lead → Slack',  trigger:'contact_created', tv:'',     action:'notify_slack',    av:'https://hooks.slack.com/...', desc:'Ping Slack when any new contact is added'},
              {name:'High Value → Tag',  trigger:'value_over',      tv:'75000',action:'add_tag',          av:'high-value', desc:'Tag contacts with deals over $75k'},
              {name:'Lost → Win-Back',   trigger:'stage_is',        tv:'s6',   action:'add_to_campaign', av:'c2', desc:'Add lost deals to win-back email campaign'},
              {name:'Referral → Priority',trigger:'source_is',      tv:'Referral',action:'add_tag',       av:'priority', desc:'Tag all referral contacts as priority'},
            ].map(r=>(
              <div key={r.name} className="card card-sm" style={{cursor:'pointer',transition:'border-color .12s'}}
                onClick={()=>setModal({id:'',workspace_id:'ws_demo_001',name:r.name,active:true,trigger:r.trigger as TriggerType,trigger_val:r.tv,action:r.action as ActionType,action_val:r.av,run_count:0})}>
                <div style={{fontWeight:600,fontSize:12.5,marginBottom:6}}>{r.name}</div>
                <div style={{fontSize:11.5,color:'var(--t3)',lineHeight:1.5,marginBottom:10}}>{r.desc}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <span className="tag" style={{background:'rgba(232,160,69,.1)',color:'var(--acc)',fontSize:10}}>{TRIGGERS.find(t=>t.v===r.trigger)?.l}</span>
                  <span style={{fontSize:11,color:'var(--t3)'}}>→</span>
                  <span className="tag" style={{background:'rgba(62,207,142,.08)',color:'var(--green)',fontSize:10}}>{ACTIONS.find(a=>a.v===r.action)?.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modal&&<AutoModal auto={modal===true?null:modal} onSave={save} onClose={()=>setModal(null)}/>}
    </>
  )
}
