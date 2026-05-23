'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({ code, id, copied, onCopy }: { code: string; id: string; copied: string | null; onCopy: (text: string, id: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <div className="code" style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre', overflowX: 'auto' }}>
        {code}
      </div>
      <button
        className="btn btn-ghost btn-xs"
        style={{ position: 'absolute', top: 10, right: 10, fontSize: 10.5 }}
        onClick={() => onCopy(code, id)}
      >
        {copied === id ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function ConnectPage() {
  const { activeWsId } = useApp()
  const [copied, setCopied] = useState<string | null>(null)

  const apiKey = `azoth_live_${activeWsId?.slice(0, 8) ?? 'xxxxxxxx'}`
  const wsId = activeWsId ?? 'YOUR_WORKSPACE_ID'

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(null), 1800)
  }

  const snippet1 = `// POST a lead to your Azoth workspace
const res = await fetch('https://azoth-platform.vercel.app/api/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'x-workspace-id': '${wsId}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name, email, phone, source: 'your-website' }),
})`

  const snippet2 = `// Route to a specific pipeline by name
body: JSON.stringify({
  name,
  email,
  pipeline_id: 'PIPELINE_ID',
  stage_id: 'STAGE_ID',
  source: 'your-website',
})`

  const snippet3 = `// Record an affiliate conversion
await fetch('https://azoth-platform.vercel.app/api/affiliate/lead', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    affiliate_code: 'CODE',
    workspace_id: '${wsId}',
    contact_name: name,
    contact_email: email,
    source_project: 'your-site',
  }),
})`

  return (
    <>
      <Topbar title="Connect Your Site" />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Connect Your Website to Azoth</h1>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
            Send leads, contacts, and affiliate events from any external site directly into this workspace.
          </div>
        </div>

        {/* Credentials */}
        <div className="g2 mb">
          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Your API Key</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Use as Bearer token in Authorization header</div>
              </div>
              <CopyBtn text={apiKey} />
            </div>
            <div className="code" style={{ fontSize: 11.5, color: 'var(--acc)' }}>{apiKey}</div>
          </div>

          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Workspace ID</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Pass as x-workspace-id header or in request body</div>
              </div>
              <CopyBtn text={wsId} />
            </div>
            <div className="code" style={{ fontSize: 11.5, color: 'var(--t2)' }}>{wsId}</div>
          </div>
        </div>

        {/* Code snippets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Snippet 1 */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--acc-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>1</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Basic contact creation</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Add any lead from your website into Azoth as a contact</div>
              </div>
            </div>
            <CodeBlock code={snippet1} id="s1" copied={copied} onCopy={copy} />
          </div>

          {/* Snippet 2 */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--acc-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>2</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>With pipeline routing</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Drop the lead straight into a specific pipeline stage</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
              Find your pipeline and stage IDs on the{' '}
              <a href="/pipeline" style={{ color: 'var(--acc)', textDecoration: 'none' }}>Pipeline page</a> — hover any stage to see its ID in the URL or dev tools.
            </div>
            <CodeBlock code={snippet2} id="s2" copied={copied} onCopy={copy} />
          </div>

          {/* Snippet 3 */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--acc-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>3</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Affiliate lead recording</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Record a conversion and credit an affiliate automatically</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
              Use an affiliate's code (from the{' '}
              <a href="/affiliates" style={{ color: 'var(--acc)', textDecoration: 'none' }}>Affiliates page</a>
              ) to track which partner referred the lead.
            </div>
            <CodeBlock code={snippet3} id="s3" copied={copied} onCopy={copy} />
          </div>

        </div>

        {/* Tips */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 12, padding: '18px 20px', marginTop: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Tips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🔒', text: 'Keep your API key server-side only — never expose it in browser JavaScript.' },
              { icon: '⚡', text: 'Fire-and-forget is fine: you can ignore the response for analytics events. For lead creation, check res.ok.' },
              { icon: '🔁', text: 'Duplicate contacts (same email) are automatically merged into the existing record.' },
              { icon: '📡', text: 'Use Zapier or Make to connect Azoth to tools that don\'t support direct HTTP — see the Integrations page.' },
            ].map(tip => (
              <div key={tip.text} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
