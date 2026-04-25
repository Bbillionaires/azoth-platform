import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, owner_id, industry, email, userName } = body

  if (!name || !owner_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Use service role to bypass RLS for initial workspace creation
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name, slug, owner_id, industry, plan: 'free' })
      .select()
      .single()

    if (wsErr) return NextResponse.json({ error: wsErr.message }, { status: 500 })

    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: owner_id,
      email,
      name: userName,
      role: 'owner',
      avatar_color: '#e8a045'
    })

    return NextResponse.json({ workspace: ws }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}