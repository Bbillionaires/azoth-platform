'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Contact, Pipeline, CRMField, Automation, Thread, Message, Campaign, Workspace, WorkspaceMember } from '@/lib/types'
import { DEMO_PIPELINES, DEMO_FIELDS } from '@/lib/defaults'
import { uid } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface AppContextType {
  workspace: Workspace | null
  members: WorkspaceMember[]
  currentUser: WorkspaceMember | null
  activeWsId: string
  setActiveWsId: (id: string) => void
  contacts: Contact[]
  pipelines: Pipeline[]
  fields: CRMField[]
  threads: Thread[]
  messages: Message[]
  campaigns: Campaign[]
  automations: Automation[]
  loading: boolean
  addContact: (c: Omit<Contact,'id'>) => Promise<void>
  updateContact: (c: Contact) => Promise<void>
  deleteContact: (id: number) => Promise<void>
  moveStage: (id: number, stageId: string) => Promise<void>
  setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>
  setFields: React.Dispatch<React.SetStateAction<CRMField[]>>
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
  addMessage: (threadId: string, body: string) => Promise<void>
  addThread: (t: Omit<Thread,'id'|'created_at'|'last_message_at'>) => Promise<Thread>
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>
  refetch: () => Promise<void>
}

const Ctx = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [loading,     setLoading]     = useState(true)
  const [activeWsId,  setActiveWsIdState] = useState<string>('')
  const [workspace,   setWorkspace]   = useState<Workspace | null>(null)
  const [members,     setMembers]     = useState<WorkspaceMember[]>([])
  const [contacts,    setContacts]    = useState<Contact[]>([])
  const [pipelines,   setPipelines]   = useState<Pipeline[]>([])
  const [fields,      setFields]      = useState<CRMField[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [threads,     setThreads]     = useState<Thread[]>([])
  const [messages,    setMessages]    = useState<Message[]>([])
  const [campaigns,   setCampaigns]   = useState<Campaign[]>([])

  // ── Load all data for a workspace ─────────
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    if (!wsId) return
    setLoading(true)
    // Clear all data first so old workspace data doesn't bleed through
    setContacts([])
    setPipelines([])
    setThreads([])
    setCampaigns([])
    setAutomations([])
    setMembers([])
    try {
      const [
        { data: contactsData },
        { data: pipelinesData },
        { data: threadsData },
        { data: campaignsData },
        { data: automationsData },
        { data: membersData },
      ] = await Promise.all([
        supabase.from('contacts').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
        supabase.from('pipelines').select('*, stages(*)').eq('workspace_id', wsId),
        supabase.from('threads').select('*').eq('workspace_id', wsId).order('last_message_at', { ascending: false }),
        supabase.from('campaigns').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
        supabase.from('automations').select('*').eq('workspace_id', wsId),
        supabase.from('workspace_members').select('*').eq('workspace_id', wsId),
      ])

      if (contactsData)    setContacts(contactsData)
      if (pipelinesData)   setPipelines(pipelinesData.length > 0 ? pipelinesData : [])
      if (threadsData)     setThreads(threadsData)
      if (campaignsData)   setCampaigns(campaignsData)
      if (automationsData) setAutomations(automationsData)
      if (membersData)     setMembers(membersData)
    } catch (err) {
      console.error('[AZOTH] Failed to load workspace data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Init — get current user + workspace ───
  const init = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get user's workspace membership
      const { data: memberRow } = await supabase
        .from('workspace_members')
        .select('*, workspaces(*)')
        .eq('user_id', user.id)
        .single()

      if (!memberRow) { setLoading(false); return }

      const ws = memberRow.workspaces as unknown as Workspace
      setWorkspace(ws)
      setActiveWsIdState(ws.id)
      await loadWorkspaceData(ws.id)
    } catch (err) {
      console.error('[AZOTH] Init error:', err)
      setLoading(false)
    }
  }, [loadWorkspaceData])

  useEffect(() => { init() }, [])

  // ── Switch workspace ──────────────────────
  const setActiveWsId = useCallback(async (id: string) => {
    setActiveWsIdState(id)
    const { data: ws } = await supabase.from('workspaces').select('*').eq('id', id).single()
    if (ws) setWorkspace(ws)
    await loadWorkspaceData(id)
  }, [loadWorkspaceData])

  const refetch = useCallback(() => loadWorkspaceData(activeWsId), [activeWsId, loadWorkspaceData])

  // ── Current user ──────────────────────────
  const currentUser = members[0] ?? null

  // ── Contact CRUD ──────────────────────────
  const addContact = useCallback(async (c: Omit<Contact,'id'>) => {
    // Remove id if present — Postgres generates it automatically
    const { id: _removed, ...contactData } = c as any
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contactData, workspace_id: activeWsId })
      .select()
      .single()
    if (error) { console.error('[AZOTH] addContact:', error); return }
    if (data) setContacts(p => [data, ...p])
  }, [activeWsId])

  const updateContact = useCallback(async (c: Contact) => {
    const { error } = await supabase
      .from('contacts')
      .update(c)
      .eq('id', c.id)
      .eq('workspace_id', activeWsId)
    if (error) { console.error('[AZOTH] updateContact:', error); return }
    setContacts(p => p.map(x => x.id === c.id ? c : x))
  }, [activeWsId])

  const deleteContact = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', activeWsId)
    if (error) { console.error('[AZOTH] deleteContact:', error); return }
    setContacts(p => p.filter(c => c.id !== id))
  }, [activeWsId])

  const moveStage = useCallback(async (id: number, stageId: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ stage_id: stageId })
      .eq('id', id)
      .eq('workspace_id', activeWsId)
    if (error) { console.error('[AZOTH] moveStage:', error); return }
    setContacts(p => p.map(c => c.id === id ? { ...c, stage_id: stageId } : c))
  }, [activeWsId])

  // ── Messages ──────────────────────────────
  const addMessage = useCallback(async (threadId: string, body: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const member = members.find(m => m.user_id === user.id) ?? members[0]
    const msg = {
      thread_id: threadId,
      workspace_id: activeWsId,
      author_id: user.id,
      author_name: member?.name ?? 'User',
      author_color: member?.avatar_color ?? '#e8a045',
      body,
      mentions: [],
      reactions: {},
    }
    const { data, error } = await supabase.from('messages').insert(msg).select().single()
    if (error) { console.error('[AZOTH] addMessage:', error); return }
    if (data) {
      setMessages(p => [...p, data])
      setThreads(p => p.map(t => t.id === threadId ? { ...t, last_message_at: data.created_at } : t))
    }
  }, [activeWsId, members])

  const addThread = useCallback(async (t: Omit<Thread,'id'|'created_at'|'last_message_at'>): Promise<Thread> => {
    const { data, error } = await supabase
      .from('threads')
      .insert({ ...t, workspace_id: activeWsId })
      .select()
      .single()
    if (error) { console.error('[AZOTH] addThread:', error); throw error }
    setThreads(p => [data, ...p])
    return data
  }, [activeWsId])

  return (
    <Ctx.Provider value={{
      workspace, members, currentUser, activeWsId, setActiveWsId,
      contacts, pipelines, fields, automations, threads, messages, campaigns,
      loading,
      addContact, updateContact, deleteContact, moveStage,
      setPipelines, setFields, setAutomations, setCampaigns,
      addMessage, addThread, setWorkspace, refetch,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = (): AppContextType => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}