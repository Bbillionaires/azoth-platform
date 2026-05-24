import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TOOLS = [
  {
    name: 'list_contacts',
    description: 'List contacts/leads in the CRM. Filter by pipeline, stage, or search by name/email.',
    inputSchema: {
      type: 'object',
      properties: {
        pipeline_id: { type: 'string', description: 'Filter by pipeline ID (optional)' },
        stage_id: { type: 'string', description: 'Filter by stage ID (optional)' },
        search: { type: 'string', description: 'Search by name or email (optional)' },
        limit: { type: 'number', description: 'Max results (default 20, max 100)' },
      },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact/lead in the CRM.',
    inputSchema: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        source: { type: 'string', description: 'Where this lead came from' },
        tags: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
        pipeline_id: { type: 'string' },
        stage_id: { type: 'string' },
      },
    },
  },
  {
    name: 'move_contact_stage',
    description: 'Move a contact to a different stage in the pipeline (e.g., from New Lead to Qualified).',
    inputSchema: {
      type: 'object',
      required: ['contact_id', 'stage_id'],
      properties: {
        contact_id: { type: 'number' },
        stage_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_pipelines',
    description: 'Get all pipelines for this workspace, including their stages.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_affiliates',
    description: 'List all affiliates for this workspace with their click and lead stats.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_affiliate',
    description: 'Create a new affiliate referral partner.',
    inputSchema: {
      type: 'object',
      required: ['name', 'email', 'destination_url'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        destination_url: { type: 'string', description: 'Where the affiliate link redirects to' },
        commission_rate: { type: 'number', description: 'Commission percentage (default 10)' },
      },
    },
  },
  {
    name: 'get_workspace_stats',
    description: 'Get an overview of the workspace: total contacts, active pipelines, affiliates, campaigns.',
    inputSchema: { type: 'object', properties: {} },
  },
]

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET() {
  return NextResponse.json({
    name: 'Azoth CRM MCP Server',
    version: '1.0.0',
    description: 'Connect your AI assistant to Azoth CRM',
    protocol: 'MCP JSON-RPC 2.0',
    endpoint: 'https://azoth-platform.vercel.app/api/mcp',
    auth: 'Authorization: Bearer azoth_live_xxx + x-workspace-id header',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    setup: {
      claude_desktop: {
        config_file: '~/Library/Application Support/Claude/claude_desktop_config.json',
        config: {
          mcpServers: {
            azoth: {
              command: 'npx',
              args: ['-y', '@azoth/mcp'],
              env: {
                AZOTH_API_KEY: 'your_azoth_live_key',
                AZOTH_WORKSPACE_ID: 'your_workspace_id',
              },
            },
          },
        },
      },
      claude_code: '// Add to .claude/mcp.json in your project',
    },
  })
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  const workspaceId =
    req.headers.get('x-workspace-id') ??
    req.nextUrl.searchParams.get('workspace_id') ??
    ''

  if (!token.startsWith('azoth_live_') || !workspaceId) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message:
          'Unauthorized. Provide Authorization: Bearer azoth_live_xxx and x-workspace-id headers.',
      },
      id: null,
    })
  }

  const body = await req.json()
  const { method, params, id } = body

  const supabase = admin()

  // initialize (handshake)
  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'azoth-crm', version: '1.0.0' },
      },
      id,
    })
  }

  // tools/list
  if (method === 'tools/list') {
    return NextResponse.json({ jsonrpc: '2.0', result: { tools: TOOLS }, id })
  }

  // tools/call
  if (method === 'tools/call') {
    const { name, arguments: args } = params
    try {
      const result = await callTool(supabase, workspaceId, name, args ?? {})
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
        id,
      })
    } catch (err: any) {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        },
        id,
      })
    }
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    error: { code: -32601, message: `Method not found: ${method}` },
    id,
  })
}

async function callTool(
  supabase: any,
  workspaceId: string,
  name: string,
  args: Record<string, any>
) {
  switch (name) {
    case 'list_contacts': {
      let query = supabase
        .from('contacts')
        .select('id,name,email,phone,company,stage_id,pipeline_id,tags,source,created_at')
        .eq('workspace_id', workspaceId)
        .limit(Math.min(args.limit ?? 20, 100))
      if (args.pipeline_id) query = query.eq('pipeline_id', args.pipeline_id)
      if (args.stage_id) query = query.eq('stage_id', args.stage_id)
      if (args.search)
        query = query.or(
          `name.ilike.%${args.search}%,email.ilike.%${args.search}%`
        )
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { contacts: data, total: data.length }
    }

    case 'create_contact': {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          workspace_id: workspaceId,
          name: args.name,
          email: args.email,
          phone: args.phone,
          company: args.company,
          source: args.source ?? 'mcp',
          tags: args.tags ?? [],
          notes: args.notes,
          pipeline_id: args.pipeline_id,
          stage_id: args.stage_id,
          value: 0,
          status: 'active',
          color: '#e8a045',
          last_contact: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, contact: data }
    }

    case 'move_contact_stage': {
      const { error } = await supabase
        .from('contacts')
        .update({ stage_id: args.stage_id })
        .eq('id', args.contact_id)
        .eq('workspace_id', workspaceId)
      if (error) throw new Error(error.message)
      return {
        success: true,
        contact_id: args.contact_id,
        new_stage_id: args.stage_id,
      }
    }

    case 'get_pipelines': {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*, stages(*)')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true })
      if (error) throw new Error(error.message)
      return { pipelines: data }
    }

    case 'list_affiliates': {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return { affiliates: data }
    }

    case 'create_affiliate': {
      const code =
        args.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 12) +
        '-' +
        Math.random().toString(36).slice(2, 6)
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          workspace_id: workspaceId,
          name: args.name,
          email: args.email,
          code,
          destination_url: args.destination_url,
          commission_rate: args.commission_rate ?? 10,
          status: 'active',
          total_clicks: 0,
          total_leads: 0,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return {
        success: true,
        affiliate: data,
        referral_link: `https://azoth-platform.vercel.app/r/${code}`,
        portal_link: `https://azoth-platform.vercel.app/portal/${code}`,
      }
    }

    case 'get_workspace_stats': {
      const [contacts, pipelines, affiliates, campaigns] = await Promise.all([
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId),
        supabase
          .from('pipelines')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId),
        supabase
          .from('affiliates')
          .select('id,total_clicks,total_leads')
          .eq('workspace_id', workspaceId),
        supabase
          .from('campaigns')
          .select('id,status', { count: 'exact' })
          .eq('workspace_id', workspaceId),
      ])
      return {
        total_contacts: contacts.count ?? 0,
        total_pipelines: pipelines.count ?? 0,
        total_affiliates: affiliates.data?.length ?? 0,
        total_affiliate_clicks:
          affiliates.data?.reduce(
            (s: number, a: any) => s + (a.total_clicks ?? 0),
            0
          ) ?? 0,
        total_affiliate_leads:
          affiliates.data?.reduce(
            (s: number, a: any) => s + (a.total_leads ?? 0),
            0
          ) ?? 0,
        total_campaigns: campaigns.count ?? 0,
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
