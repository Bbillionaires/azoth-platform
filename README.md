# Nexus Platform

**CRM · Team Inbox · Campaigns · Automations — built to resell**

A team-first revenue platform combining the collaboration feel of Basecamp, the pipeline depth of Salesforce, the outbound marketing power of GoHighLevel, and the customizability of Podio.

---

## What's Inside

| Module | Inspired by | Features |
|---|---|---|
| **Team Inbox** | Basecamp | Deal rooms per contact, @mentions, threads, announcements |
| **CRM + Pipeline** | Salesforce / Podio | Contacts, companies, custom fields, kanban board, activity timeline |
| **Campaigns** | GoHighLevel | Email, SMS, multi-step sequences, open/click tracking, templates |
| **Automations** | GHL / Salesforce | Trigger → Action rules, 7 triggers, 10 actions, recipes |
| **Integrations** | Zapier / HubSpot | REST API, webhooks, 12 app connectors, SDK, JSON export |
| **Settings** | Podio | Custom pipelines + stages, custom fields, workspace, billing |
| **Auth + Multi-tenant** | SaaS standard | Sign-up creates isolated workspace, Supabase Auth + RLS |

---

## Getting Started

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env.local
# Fill in Supabase credentials

# 3. Database
# Run lib/schema.sql in your Supabase SQL editor

# 4. Dev
npm run dev
```

Open http://localhost:3000 → auto-redirects to dashboard with demo data.

---

## Deploy in 5 minutes (Vercel)

1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy → get your live URL

Your CRM is now live at `yourapp.vercel.app`.

---

## Reselling This

Each user who signs up at `/auth/signup`:
1. Creates a Supabase auth account
2. Creates their own workspace (isolated by workspace_id)
3. Gets their own contacts, pipelines, campaigns — completely separate from every other user
4. Row-Level Security in Postgres ensures **zero data crossover**

**To monetize:**
1. Add Stripe: `npm install stripe` → wire up `/app/api/billing/`
2. Set plan limits in `lib/schema.sql` based on `workspaces.plan`
3. Gate features in UI by checking `workspace.plan`

---

## Project Structure

```
nexus/
├── app/
│   ├── dashboard/page.tsx        # Home: stats, activity, pipeline overview
│   ├── inbox/page.tsx            # Basecamp-style team inbox + deal rooms
│   ├── contacts/page.tsx         # CRM contacts table + detail view
│   ├── pipeline/page.tsx         # Kanban board per pipeline
│   ├── campaigns/page.tsx        # Email / SMS / sequence campaigns
│   ├── automations/page.tsx      # Trigger → Action rules + recipes
│   ├── integrations/page.tsx     # API, webhooks, 12 connectors
│   ├── settings/page.tsx         # Pipelines, fields, workspace, team, billing
│   ├── auth/
│   │   ├── login/page.tsx        # Sign in
│   │   └── signup/page.tsx       # 2-step workspace creation
│   └── api/
│       ├── contacts/route.ts     # REST: contacts CRUD
│       └── webhooks/route.ts     # Inbound webhook receiver
├── components/
│   ├── ui/Sidebar.tsx            # Nav with online team, badges
│   └── ui/index.tsx              # Avatar, Toggle, StagePill, Topbar, etc.
├── context/AppContext.tsx        # Global state + localStorage persistence
└── lib/
    ├── types.ts                  # All TypeScript types
    ├── defaults.ts               # Demo seed data
    ├── utils.ts                  # Helpers
    ├── supabase.ts               # Browser + server Supabase clients
    └── schema.sql                # Full Postgres schema with RLS
```

---

## Integrating DDI (Your Other Platform)

```js
// From DDI — push a tax-delinquent property as a CRM contact
await fetch('https://yourplatform.com/api/contacts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer nx_live_...', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Smith',
    email: 'john@example.com',
    pipeline_id: 'p1',
    stage_id: 's1',  // Lead
    value: 45000,
    tags: ['tax-delinquent', 'duval'],
    source: 'DDI Platform',
  })
})
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Auth + DB**: Supabase (PostgreSQL + Row-Level Security)
- **State**: React Context + localStorage (ready for Supabase realtime)
- **Styling**: CSS custom properties — no Tailwind dependency
- **Fonts**: DM Sans + JetBrains Mono

---

## Roadmap

- [ ] Drag-and-drop Kanban
- [ ] AI follow-up writer (Anthropic API)
- [ ] Email builder (drag-and-drop blocks)
- [ ] SMS via Twilio
- [ ] Stripe billing wired end-to-end
- [ ] Supabase Realtime for live inbox
- [ ] White-label (Agency plan: custom domain + branding)
- [ ] Mobile responsive
- [ ] Bulk CSV import
