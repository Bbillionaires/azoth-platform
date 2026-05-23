import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client bypasses RLS so we can look up any user's workspace membership
const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const supabase = admin()

  // Get workspace membership with workspace details
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*, workspaces(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!members?.length) return NextResponse.json({ workspace: null, member: null })

  const member = members[0]
  const workspace = member.workspaces

  // Get pipelines with stages
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('*, stages(*)')
    .eq('workspace_id', workspace.id)
    .order('position', { ascending: true })

  return NextResponse.json({ workspace, member, pipelines: pipelines || [] })
}
