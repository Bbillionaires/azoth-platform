import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, industry, accent, owner_id, email, userName } = body

  if (!name || !owner_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the user actually exists in Supabase Auth
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(owner_id)
    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Create workspace
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        owner_id,
        industry: industry || 'SaaS',
        accent: accent || '#e8a045',
        plan: 'free',
      })
      .select()
      .single()

    if (wsErr) return NextResponse.json({ error: wsErr.message }, { status: 500 })

    // Add owner as workspace member
    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: owner_id,
      email: email || user.email,
      name: userName || user.email,
      role: 'owner',
      avatar_color: accent || '#e8a045',
    })

    // Create default pipelines
    const defaultPipelines = [
      {
        name: 'Sales Pipeline', color: '#e8a045', position: 0,
        stages: [
          { name: 'New Lead',     color: '#555e6e', position: 0 },
          { name: 'Contacted',    color: '#5b8ef5', position: 1 },
          { name: 'Qualified',    color: '#9b72f5', position: 2 },
          { name: 'Proposal',     color: '#e8a045', position: 3 },
          { name: 'Negotiation',  color: '#f0a045', position: 4 },
          { name: 'Won',          color: '#3ecf8e', position: 5 },
          { name: 'Lost',         color: '#f06060', position: 6 },
        ],
      },
      {
        name: 'Lead Generation', color: '#5b8ef5', position: 1,
        stages: [
          { name: 'Prospect',     color: '#555e6e', position: 0 },
          { name: 'Outreach',     color: '#5b8ef5', position: 1 },
          { name: 'Responded',    color: '#e8a045', position: 2 },
          { name: 'Meeting Set',  color: '#9b72f5', position: 3 },
          { name: 'Converted',    color: '#3ecf8e', position: 4 },
          { name: 'Not Interested', color: '#f06060', position: 5 },
        ],
      },
      {
        name: 'Customer Success', color: '#3ecf8e', position: 2,
        stages: [
          { name: 'Onboarding',   color: '#5b8ef5', position: 0 },
          { name: 'Active',       color: '#3ecf8e', position: 1 },
          { name: 'At Risk',      color: '#e8a045', position: 2 },
          { name: 'Renewal',      color: '#9b72f5', position: 3 },
          { name: 'Churned',      color: '#f06060', position: 4 },
        ],
      },
    ]

    for (const pl of defaultPipelines) {
      const { data: pipeline } = await supabase
        .from('pipelines')
        .insert({ workspace_id: ws.id, name: pl.name, color: pl.color, position: pl.position })
        .select()
        .single()
      if (pipeline) {
        await supabase.from('stages').insert(
          pl.stages.map(s => ({ ...s, pipeline_id: pipeline.id }))
        )
      }
    }

    return NextResponse.json({ workspace: ws }, { status: 201 })
  } catch (err) {
    console.error('[AZOTH] workspace creation error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}