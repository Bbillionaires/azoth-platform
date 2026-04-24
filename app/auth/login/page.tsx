'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !pass) { setErr('Email and password required'); return }
    setLoading(true); setErr('')
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) { setErr(error.message); setLoading(false); return }
      router.push('/dashboard')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ color: 'var(--acc)' }}>N</span>exus
        </div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to your workspace</div>
        {err && <div className="auth-error">{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div className="field">
            <label className="fl">Email</label>
            <input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          <div className="field">
            <label className="fl">Password</label>
            <input className="fi" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
        </div>
        <button className="btn btn-acc" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 14 }} onClick={login} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--t3)' }}>
          No account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--acc)' }}>Create workspace</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--t3)' }}>
          <Link href="/dashboard" style={{ color: 'var(--t3)' }}>Continue with demo →</Link>
        </div>
      </div>
    </div>
  )
}
