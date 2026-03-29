'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'

const INTEGRATIONS = [
  { id:'zapier',     name:'Zapier',     icon:'⚡', desc:'No-code automation · 5,000+ apps',   cat:'automation', default:true  },
  { id:'make',       name:'Make',       icon:'🔀', desc:'Visual workflow automation',           cat:'automation', default:false },
  { id:'n8n',        name:'n8n',        icon:'🔧', desc:'Self-hosted automation engine',        cat:'automation', default:true  },
  { id:'slack',      name:'Slack',      icon:'💬', desc:'Team notifications + deal alerts',     cat:'comms',      default:true  },
  { id:'twilio',     name:'Twilio',     icon:'📱', desc:'SMS sending for campaigns',            cat:'comms',      default:false },
  { id:'sendgrid',   name:'SendGrid',   icon:'✉️', desc:'Transactional + bulk email',           cat:'comms',      default:true  },
  { id:'stripe',     name:'Stripe',     icon:'💳', desc:'Payments + subscription billing',      cat:'billing',    default:false },
  { id:'hubspot',    name:'HubSpot',    icon:'🔶', desc:'Bi-directional CRM sync',              cat:'crm',        default:false },
  { id:'salesforce', name:'Salesforce', icon:'☁️', desc:'Enterprise CRM + opportunity sync',   cat:'crm',        default:false },
  { id:'notion',     name:'Notion',     icon:'📝', desc:'Database + wiki sync',                 cat:'tools',      default:false },
  { id:'airtable',   name:'Airtable',   icon:'📊', desc:'Spreadsheet-style data sync',          cat:'tools',      default:false },
  { id:'calendly',   name:'Calendly',   icon:'📅', desc:'Book meetings → create contacts',      cat:'tools',      default:false },
]

const API_KEY = 'azoth_live_xK9mP2wQ7nR4vT8jL5sH3uA6bF1cN0eY'

export default function IntegrationsPage() {
  const { contacts, pipelines } = useApp()
  const [connected, setConnected] = useState<Record<string,boolean>>(
    Object.fromEntries(INTEGRATIONS.map(i=>[i.id, i.default]))
  )
  const [copied, setCopied] = useState<string|null>(null)
  const [catFilter, setCatFilter] = useState('all')

  const copy = (text:string, key:string) => {
    navigator.clipboard.writeText(text).catch(()=>{})
    setCopied(key); setTimeout(()=>setCopied(null),1800)
  }

  const exportJSON = () => {
    const exp = { version:'2.0', exported: new Date().toISOString(), pipelines, contacts, meta:{total:contacts.length} }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exp,null,2)],{type:'application/json'}))
    a.download = 'AZOTH-export.json'; a.click()
  }

  const connectedCount = Object.values(connected).filter(Boolean).length
  const cats = ['all','automation','comms','billing','crm','tools']
  const filtered = INTEGRATIONS.filter(i=>catFilter==='all'||i.cat===catFilter)

  const sdkCode = `// AZOTH JS SDK
import AZOTH from '@AZOTH/sdk'
const crm = new AZOTH({ apiKey: '${API_KEY}' })

// Contacts
const list = await crm.contacts.list({ stage: 'Qualified' })
const contact = await crm.contacts.create({ name, email, value })
await crm.contacts.update(id, { stage_id: 's5' })

// Campaigns
const camp = await crm.campaigns.create({ name, type:'email', subject, body })
await crm.campaigns.send(camp.id, { audience: { tag: 'priority' } })

// Automations
crm.on('contact.stage_changed', async (e) => {
  if (e.data.to_stage === 'Won') {
    await crm.tasks.create({ title: 'Schedule onboarding', contact_id: e.data.contact.id })
  }
})`

  const webhookPayload = JSON.stringify({
    event: 'contact.stage_changed',
    timestamp: new Date().toISOString(),
    workspace: 'nx_ws_abc123',
    data: {
      contact: { id:2, name:'Marcus Rivera', company:'Stackhaus', value:85000 },
      pipeline: 'Sales Pipeline',
      from: 'Qualified', to: 'Proposal',
    }
  }, null, 2)

  const restRef = `# AZOTH REST API  —  https://api.azoth.io/v2

GET    /contacts                 List (filters: ?stage=, ?pipeline=, ?q=)
POST   /contacts                 Create contact
PATCH  /contacts/:id             Update (stage, value, tags, custom fields)
DELETE /contacts/:id

GET    /pipelines                List pipelines
POST   /pipelines                Create pipeline with stages

GET    /campaigns                List campaigns
POST   /campaigns                Create campaign
POST   /campaigns/:id/send       Send or schedule

GET    /automations              List rules
POST   /automations              Create rule
PATCH  /automations/:id          Toggle active / update

POST   /threads                  Create inbox thread
POST   /threads/:id/messages     Post message to thread

# Auth: Authorization: Bearer <api_key>
# Rate limit: 1,000 req/min (Pro) · 100 req/min (Free)`

  return (
    <>
      <Topbar title="Integrations"/>
      <div className="page">
        <div className="g3 mb">
          {[
            {l:'API Calls / Day', v:'2,847',           c:'var(--blue)'},
            {l:'Webhooks Fired',  v:'341',              c:'var(--green)'},
            {l:'Connected Apps',  v:connectedCount,     c:'var(--purple)'},
          ].map(s=>(
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{fontSize:22,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Integration grid */}
        <div className="card mb">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span className="sh">App Connections</span>
            <div style={{display:'flex',gap:5}}>
              {cats.map(c=>(
                <button key={c} className={`btn btn-ghost btn-xs ${catFilter===c?'btn-blue':''}`}
                  style={{fontSize:10.5,textTransform:'capitalize',background:catFilter===c?'rgba(91,142,245,.1)':'',color:catFilter===c?'var(--blue)':'',borderColor:catFilter===c?'rgba(91,142,245,.25)':''}}
                  onClick={()=>setCatFilter(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {filtered.map(i=>(
              <div key={i.id}
                style={{background:'var(--s1)',border:`1px solid ${connected[i.id]?'rgba(62,207,142,.2)':'var(--br)'}`,borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',transition:'all .12s'}}
                onClick={()=>setConnected(p=>({...p,[i.id]:!p[i.id]}))}>
                <span style={{fontSize:20,flexShrink:0}}>{i.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:600,marginBottom:2}}>{i.name}</div>
                  <div style={{fontSize:10.5,color:'var(--t3)',lineHeight:1.4}}>{i.desc}</div>
                </div>
                <div className="dot" style={{background:connected[i.id]?'var(--green)':'rgba(255,255,255,.12)',marginTop:3,flexShrink:0}}/>
              </div>
            ))}
          </div>
        </div>

        {/* API + Webhooks */}
        <div className="g2 mb">
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span className="sh">API Key</span>
              <button className="btn btn-ghost btn-xs" onClick={()=>copy(API_KEY,'key')}>{copied==='key'?'✓ Copied':'Copy'}</button>
            </div>
            <div className="code" style={{fontSize:10.5,color:'var(--acc)',marginBottom:14}}>{API_KEY}</div>
            <div style={{fontSize:12,color:'var(--t3)',lineHeight:1.6,marginBottom:16}}>Keep secret. Rotate anytime. Rate limited per plan.</div>
            <hr className="div"/>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button className="btn btn-acc btn-sm" onClick={exportJSON}>Export JSON</button>
              <button className="btn btn-ghost btn-sm">Import CSV</button>
              <button className="btn btn-ghost btn-sm">View API Docs ↗</button>
            </div>
          </div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span className="sh">Webhook Payload</span>
              <button className="btn btn-ghost btn-xs" onClick={()=>copy(webhookPayload,'wh')}>{copied==='wh'?'✓ Copied':'Copy'}</button>
            </div>
            <div className="code">{webhookPayload}</div>
          </div>
        </div>

        <div className="g2">
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span className="sh">JS SDK</span>
              <button className="btn btn-ghost btn-xs" onClick={()=>copy(sdkCode,'sdk')}>{copied==='sdk'?'✓ Copied':'Copy'}</button>
            </div>
            <div className="code">{sdkCode}</div>
          </div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span className="sh">REST API Reference</span>
              <button className="btn btn-ghost btn-xs" onClick={()=>copy(restRef,'rest')}>{copied==='rest'?'✓ Copied':'Copy'}</button>
            </div>
            <div className="code">{restRef}</div>
          </div>
        </div>
      </div>
    </>
  )
}
