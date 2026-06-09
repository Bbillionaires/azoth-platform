import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const rawBody = await req.text()

    // Simple API key auth — external sites pass this in the header
    const apiKey  = req.headers.get('x-api-key') ?? ''
    const secret  = process.env.WEBHOOK_SECRET ?? ''

    if (secret && apiKey !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let payload: {
      event: string
      workspace_id: string
      data: {
        name?: string
        email?: string
        phone?: string
        company?: string
        source?: string
        notes?: string
        tags?: string[]
        pipeline_id?: string
        stage_id?: string
        value?: number
      }
    }

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event, workspace_id, data } = payload

    if (!workspace_id) {
      return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })
    }

    if (event === 'lead.created' || event === 'contact.created') {
      if (!data.email && !data.name) {
        return NextResponse.json({ error: 'Lead must have at least name or email' }, { status: 400 })
      }

      // Get first pipeline + stage for this workspace if not provided
      let pipeline_id = data.pipeline_id
      let stage_id    = data.stage_id

      if (!pipeline_id) {
        const { data: pipeline } = await supabase
          .from('pipelines')
          .select('id')
          .eq('workspace_id', workspace_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        pipeline_id = pipeline?.id
      }

      if (!stage_id && pipeline_id) {
        const { data: stage } = await supabase
          .from('stages')
          .select('id')
          .eq('pipeline_id', pipeline_id)
          .order('position', { ascending: true })
          .limit(1)
          .single()
        stage_id = stage?.id
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          workspace_id,
          pipeline_id,
          stage_id,
          name:        data.name ?? 'Unknown',
          email:       data.email ?? '',
          phone:       data.phone ?? null,
          company:     data.company ?? null,
          source:      data.source ?? 'webhook',
          notes:       data.notes ?? null,
          tags:        data.tags ?? [],
          value:       data.value ?? 0,
          status:      'active',
          color:       '#5b8ef5',
          last_contact: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) {
        console.error('[AZOTH Webhook] Insert error:', error)
        return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
      }

      console.log(`[AZOTH Webhook] Lead saved: ${contact.id} → workspace ${workspace_id}`)
      return NextResponse.json({ received: true, contact_id: contact.id })
    }

    return NextResponse.json({ received: true, event })

  } catch (err) {
    console.error('[AZOTH Webhook] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}