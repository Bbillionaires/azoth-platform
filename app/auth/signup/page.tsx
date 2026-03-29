'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1|2>(1)
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [wsName, setWsName] = useState('')
  const [industry, setIndustry] = useState('SaaS')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const step1 = () => {
    if (!name || !email || !pass) { setErr('All fields required'); return }
    if (pass.length < 8) { setErr('Password must be at least 8 characters'); return }
    setErr(''); setStep(2)
  }

  const create = async () => {
    if (!wsName) { setErr('Workspace name required'); return }
    setLoading(true); setErr('')
    try {
      // Supabase sign-up + workspace creation — uncomment when connected:
      // const { createClient } = await import('@/lib/supabase')
      // const supabase = createClient()
      // const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } })
      // if (error) { setErr(error.message); return }
      // await supabase.from('workspaces').insert({ name: wsName, slug: wsName.toLowerCase().replace(/\s+/g,'-'), owner_id: data.user!.id, industry })
      // await supabase.from('workspace_members').insert({ workspace_id: wsId, user_id: data.user!.id, name, email, role: 'owner' })
      await new Promise(r => setTimeout(r, 800))
      router.push('/dashboard')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo"><span style={{ color: 'var(--acc)' }}>N</span>exus</div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {[1,2].map(s=>(
            <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: s <= step ? 'var(--acc)' : 'var(--s3)', transition: 'background .2s' }}/>
          ))}
        </div>

        {step === 1 ? (
          <>
            <div className="auth-title">Create your account</div>
            <div className="auth-sub">Step 1 of 2 — Your details</div>
            {err && <div className="auth-error">{err}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div className="field"><label className="fl">Full Name</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="DeAris Anderson"/></div>
              <div className="field"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></div>
              <div className="field"><label className="fl">Password</label><input className="fi" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min. 8 characters"/></div>
            </div>
            <button className="btn btn-acc" style={{ width:'100%',justifyContent:'center',padding:'10px',fontSize:14 }} onClick={step1}>Continue →</button>
          </>
        ) : (
          <>
            <div className="auth-title">Name your workspace</div>
            <div className="auth-sub">Step 2 of 2 — Your workspace</div>
            {err && <div className="auth-error">{err}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div className="field"><label className="fl">Workspace Name</label><input className="fi" value={wsName} onChange={e=>setWsName(e.target.value)} placeholder="Acme Sales Team"/></div>
              <div className="field">
                <label className="fl">Industry</label>
                <select className="fs" value={industry} onChange={e=>setIndustry(e.target.value)}>
                  {['SaaS','Agency','Real Estate','Healthcare','Finance','E-commerce','Consulting','Other'].map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              {wsName && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)', background: 'var(--s3)', padding: '8px 12px', borderRadius: 'var(--r8)', border: '1px solid var(--br)' }}>
                  Your URL: <span style={{ color: 'var(--acc)' }}>AZOTH.app/{wsName.toLowerCase().replace(/\s+/g,'-')}</span>
                </div>
              )}
            </div>
            <button className="btn btn-acc" style={{ width:'100%',justifyContent:'center',padding:'10px',fontSize:14 }} onClick={create} disabled={loading}>
              {loading ? 'Creating workspace…' : 'Launch my workspace 🚀'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'center',marginTop:8 }} onClick={()=>setStep(1)}>← Back</button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--t3)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--acc)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
