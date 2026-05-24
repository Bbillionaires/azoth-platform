'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'

type Tab = 'api' | 'mcp' | 'embed' | 'webhook'

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function CodeBlock({
  code,
  id,
  copied,
  onCopy,
  lang,
}: {
  code: string
  id: string
  copied: string | null
  onCopy: (text: string, id: string) => void
  lang?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      {lang && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 14,
            fontSize: 10,
            color: 'var(--t3)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          {lang}
        </div>
      )}
      <div
        className="code"
        style={{
          fontSize: 12,
          lineHeight: 1.7,
          whiteSpace: 'pre',
          overflowX: 'auto',
          paddingTop: lang ? 28 : 14,
        }}
      >
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

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'api', label: 'API' },
  { id: 'mcp', label: 'MCP / AI' },
  { id: 'embed', label: 'Embed Widget' },
  { id: 'webhook', label: 'Webhooks' },
]

export default function ConnectPage() {
  const { activeWsId } = useApp()
  const [tab, setTab] = useState<Tab>('api')
  const [copied, setCopied] = useState<string | null>(null)

  const apiKey = `azoth_live_${activeWsId?.slice(0, 8) ?? 'xxxxxxxx'}`
  const wsId = activeWsId ?? 'YOUR_WORKSPACE_ID'

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  // ── API snippets ───────────────────────────────────────────────────────────
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

  // ── MCP config ────────────────────────────────────────────────────────────
  const mcpConfig = `{
  "mcpServers": {
    "azoth": {
      "type": "http",
      "url": "https://azoth-platform.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ${apiKey}",
        "x-workspace-id": "${wsId}"
      }
    }
  }
}`

  // ── Embed tag ──────────────────────────────────────────────────────────────
  const embedTag = `<script src="https://azoth-platform.vercel.app/api/embed?key=${apiKey}&workspace=${wsId}&color=%23e8a045&source=your-website"></script>`

  return (
    <>
      <Topbar title="Connect" />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Connect Your Workspace</h1>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
            Send leads, run AI commands, embed a widget, and connect automation tools.
          </div>
        </div>

        {/* Credentials */}
        <div className="g2 mb">
          <div
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--br)',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--t3)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    marginBottom: 4,
                  }}
                >
                  Your API Key
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                  Use as Bearer token in Authorization header
                </div>
              </div>
              <CopyBtn text={apiKey} />
            </div>
            <div className="code" style={{ fontSize: 11.5, color: 'var(--acc)' }}>
              {apiKey}
            </div>
          </div>

          <div
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--br)',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--t3)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    marginBottom: 4,
                  }}
                >
                  Workspace ID
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                  Pass as x-workspace-id header or in request body
                </div>
              </div>
              <CopyBtn text={wsId} />
            </div>
            <div className="code" style={{ fontSize: 11.5, color: 'var(--t2)' }}>
              {wsId}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 20,
            borderBottom: '1px solid var(--br)',
          }}
        >
          {TAB_LABELS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: tab === t.id ? '2px solid var(--acc)' : '2px solid transparent',
                color: tab === t.id ? 'var(--acc)' : 'var(--t3)',
                fontWeight: tab === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── API Tab ── */}
        {tab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--acc-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--acc)',
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Basic contact creation</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                    Add any lead from your website into Azoth as a contact
                  </div>
                </div>
              </div>
              <CodeBlock code={snippet1} id="s1" copied={copied} onCopy={copy} lang="js" />
            </div>

            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--acc-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--acc)',
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>With pipeline routing</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                    Drop the lead straight into a specific pipeline stage
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
                Find your pipeline and stage IDs on the{' '}
                <a href="/pipeline" style={{ color: 'var(--acc)', textDecoration: 'none' }}>
                  Pipeline page
                </a>{' '}
                — hover any stage to see its ID.
              </div>
              <CodeBlock code={snippet2} id="s2" copied={copied} onCopy={copy} lang="js" />
            </div>

            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--acc-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--acc)',
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Affiliate lead recording</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                    Record a conversion and credit an affiliate automatically
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
                Use an affiliate&apos;s code (from the{' '}
                <a href="/affiliates" style={{ color: 'var(--acc)', textDecoration: 'none' }}>
                  Affiliates page
                </a>
                ) to track which partner referred the lead.
              </div>
              <CodeBlock code={snippet3} id="s3" copied={copied} onCopy={copy} lang="js" />
            </div>

            {/* Tips */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Tips</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    icon: '🔒',
                    text: 'Keep your API key server-side only — never expose it in browser JavaScript.',
                  },
                  {
                    icon: '⚡',
                    text: 'Fire-and-forget is fine for analytics events. For lead creation, check res.ok.',
                  },
                  {
                    icon: '🔁',
                    text: 'Duplicate contacts (same email) are automatically merged into the existing record.',
                  },
                  {
                    icon: '📡',
                    text: "Use Zapier or Make to connect Azoth to tools that don't support HTTP — see the Webhooks tab.",
                  },
                ].map(tip => (
                  <div
                    key={tip.text}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12.5,
                      color: 'var(--t2)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MCP Tab ── */}
        {tab === 'mcp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Intro */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--acc-br)',
                borderRadius: 12,
                padding: '20px 22px',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    Connect AI to your CRM
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                    Add Azoth to Claude Code or Claude Desktop and your AI can manage your CRM with
                    natural language — create contacts, move deals through stages, generate affiliate
                    links, and pull workspace stats without opening the app.
                  </div>
                </div>
              </div>
            </div>

            {/* Claude Code config */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                Claude Code setup
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
                Add to <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>.claude/mcp.json</code> in your project, or in your global{' '}
                <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>~/.claude/mcp.json</code>
              </div>
              <CodeBlock code={mcpConfig} id="mcp-config" copied={copied} onCopy={copy} lang="json" />
            </div>

            {/* Claude Desktop config */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                MCP endpoint URL
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
                For any MCP-compatible client. Use HTTP transport with the headers below.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div
                  className="code"
                  style={{ fontSize: 12, color: 'var(--acc)', padding: '10px 14px' }}
                >
                  https://azoth-platform.vercel.app/api/mcp
                </div>
                <CopyBtn text="https://azoth-platform.vercel.app/api/mcp" />
              </div>
            </div>

            {/* Example prompts */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Example prompts after connecting
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Add John Smith (john@example.com) as a new lead in my Film pipeline',
                  'Show me all contacts in the Qualified stage',
                  'Create an affiliate for Jane with 15% commission linking to my website',
                  'Move contact ID 42 to the Closed Won stage',
                  'Give me a stats overview of my workspace',
                ].map(prompt => (
                  <div
                    key={prompt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: 'var(--s3)',
                      border: '1px solid var(--br)',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.4 }}>
                      &ldquo;{prompt}&rdquo;
                    </div>
                    <CopyBtn text={prompt} />
                  </div>
                ))}
              </div>
            </div>

            {/* Available tools */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Available MCP tools
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'list_contacts', desc: 'List and search contacts/leads by pipeline, stage, name, or email' },
                  { name: 'create_contact', desc: 'Create a new contact with full details' },
                  { name: 'move_contact_stage', desc: 'Move a contact to a different pipeline stage' },
                  { name: 'get_pipelines', desc: 'Fetch all pipelines and their stages' },
                  { name: 'list_affiliates', desc: 'List all affiliates with click and lead stats' },
                  { name: 'create_affiliate', desc: 'Create a new affiliate with referral link' },
                  { name: 'get_workspace_stats', desc: 'Overview: contacts, pipelines, affiliates, campaigns' },
                ].map(tool => (
                  <div
                    key={tool.name}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 12.5,
                    }}
                  >
                    <code
                      style={{
                        background: 'var(--acc-bg)',
                        color: 'var(--acc)',
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: 11.5,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {tool.name}
                    </code>
                    <span style={{ color: 'var(--t2)', lineHeight: 1.5 }}>{tool.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Embed Tab ── */}
        {tab === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Intro */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--acc-br)',
                borderRadius: 12,
                padding: '20px 22px',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>🪄</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    One-line embed widget
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                    Add a floating &ldquo;Get in Touch&rdquo; button to any website with a single{' '}
                    <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>&lt;script&gt;</code>{' '}
                    tag. Leads captured automatically flow into this workspace.
                  </div>
                </div>
              </div>
            </div>

            {/* Script tag */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                Your embed code
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
                Paste this just before the closing{' '}
                <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 4 }}>
                  &lt;/body&gt;
                </code>{' '}
                tag on any page
              </div>
              <CodeBlock code={embedTag} id="embed-tag" copied={copied} onCopy={copy} lang="html" />
            </div>

            {/* Widget preview */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                What visitors see
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--acc-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    💬
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      Floating button (bottom-right)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                      A pill-shaped &ldquo;Get in Touch&rdquo; button sits fixed in the corner of your page.
                      Matches your brand color via the <code style={{ background: 'var(--s3)', padding: '1px 4px', borderRadius: 3 }}>color</code> param.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--acc-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    📋
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      Slide-in lead form
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                      Clicking opens a dark modal with Name, Email, and Message fields. On submit the
                      contact is created in Azoth and tagged with <code style={{ background: 'var(--s3)', padding: '1px 4px', borderRadius: 3 }}>embed-widget</code>.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--acc-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    🔗
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      Affiliate tracking built-in
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                      If a visitor arrived via an affiliate link, the{' '}
                      <code style={{ background: 'var(--s3)', padding: '1px 4px', borderRadius: 3 }}>aff_ref</code>{' '}
                      cookie is automatically included in the lead submission.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Query params */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Customisation parameters
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { param: 'key', desc: 'Your API key (required)' },
                  { param: 'workspace', desc: 'Your workspace ID (required)' },
                  { param: 'color', desc: 'Hex color for button & CTA — URL-encode the #, e.g. %23e8a045' },
                  { param: 'source', desc: 'Tag contacts with where they came from, e.g. "my-blog"' },
                ].map(p => (
                  <div key={p.param} style={{ display: 'flex', gap: 12, fontSize: 12.5 }}>
                    <code
                      style={{
                        background: 'var(--s3)',
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: 11.5,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        color: 'var(--t1)',
                      }}
                    >
                      {p.param}
                    </code>
                    <span style={{ color: 'var(--t2)', lineHeight: 1.5 }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Webhook Tab ── */}
        {tab === 'webhook' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Intro */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--acc-br)',
                borderRadius: 12,
                padding: '20px 22px',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    Zapier &amp; Make integrations
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                    Use Zapier or Make.com (Integromat) to connect Azoth with thousands of tools —
                    no code required. Trigger automations from new contacts, or push data from
                    external forms directly into your CRM.
                  </div>
                </div>
              </div>
            </div>

            {/* Zapier */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Sending data to Azoth via Zapier
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    step: '1',
                    title: 'Create a new Zap',
                    desc: 'Choose any trigger — Typeform submission, Google Form, Calendly booking, Stripe payment, etc.',
                  },
                  {
                    step: '2',
                    title: 'Add a Webhooks by Zapier action',
                    desc: 'Select "POST" as the method.',
                  },
                  {
                    step: '3',
                    title: 'Configure the request',
                    desc: `URL: https://azoth-platform.vercel.app/api/contacts\nHeaders: Authorization → Bearer ${apiKey}\nHeaders: x-workspace-id → ${wsId}\nBody (JSON): { "name": ..., "email": ..., "source": "zapier" }`,
                  },
                  {
                    step: '4',
                    title: 'Map your trigger fields',
                    desc: 'Drag in the name and email fields from your trigger step into the JSON body.',
                  },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--acc-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--acc)',
                        flexShrink: 0,
                      }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--t3)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Make */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Make.com (Integromat) setup
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Add an HTTP module with method POST',
                  `Set URL to https://azoth-platform.vercel.app/api/contacts`,
                  `Add header Authorization: Bearer ${apiKey}`,
                  `Add header x-workspace-id: ${wsId}`,
                  'Set request content type to JSON and map your fields',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: 'var(--s3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--t3)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook endpoint reference */}
            <div
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--br)',
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Endpoint reference
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    method: 'POST',
                    path: '/api/contacts',
                    desc: 'Create or update a contact',
                  },
                  {
                    method: 'POST',
                    path: '/api/affiliate/lead',
                    desc: 'Record an affiliate conversion',
                  },
                  {
                    method: 'GET',
                    path: '/api/contacts',
                    desc: 'List contacts',
                  },
                ].map(ep => (
                  <div
                    key={ep.path}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      fontSize: 12.5,
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--acc-bg)',
                        color: 'var(--acc)',
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '.04em',
                        flexShrink: 0,
                      }}
                    >
                      {ep.method}
                    </span>
                    <code
                      style={{
                        color: 'var(--t1)',
                        fontSize: 11.5,
                        flexShrink: 0,
                      }}
                    >
                      {ep.path}
                    </code>
                    <span style={{ color: 'var(--t3)' }}>{ep.desc}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: 'var(--t3)',
                  lineHeight: 1.5,
                }}
              >
                Full documentation and more endpoints on the{' '}
                <a href="/integrations" style={{ color: 'var(--acc)', textDecoration: 'none' }}>
                  Integrations page
                </a>
                .
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
