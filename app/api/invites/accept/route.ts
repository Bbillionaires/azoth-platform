import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { token, user_id, name, email } = await req.json()
    if (!token || !user_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Validate token
    const { data: invite, error: invErr } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (invErr || !invite)   return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (invite.accepted)     return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })

    // Add member
    const colors = ['#5b8ef5','#e8a045','#4caf50','#e040fb','#26c6da','#ff7043']
    const avatar_color = colors[Math.floor(Math.random() * colors.length)]

    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id,
        email,
        name: name || email.split('@')[0],
        role: invite.role,
        avatar_color,
      })

    if (memberErr && !memberErr.message.includes('unique')) {
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    // Mark invite accepted
    await supabase
      .from('workspace_invites')
      .update({ accepted: true })
      .eq('token', token)

    return NextResponse.json({ success: true, workspace_id: invite.workspace_id })
  } catch (err) {
    console.error('[AZOTH] accept invite:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}