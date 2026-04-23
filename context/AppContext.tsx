'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Contact, Pipeline, CRMField, Automation, Thread, Message, Campaign, Workspace, WorkspaceMember } from '@/lib/types'
import { DEMO_PIPELINES, DEMO_FIELDS, DEMO_CONTACTS, DEMO_AUTOMATIONS, DEMO_THREADS, DEMO_MESSAGES, DEMO_CAMPAIGNS, DEMO_WORKSPACE_ID, DEMO_USER_ID } from '@/lib/defaults'
import { ls, uid } from '@/lib/utils'

interface AppContextType {
  workspace: Workspace
  members: WorkspaceMember[]
  currentUser: WorkspaceMember
  activeWsId: string
  setActiveWsId: (id: string) => void
  contacts: Contact[]
  pipelines: Pipeline[]
  fields: CRMField[]
  threads: Thread[]
  messages: Message[]
  campaigns: Campaign[]
  automations: Automation[]
  addContact: (c: Omit<Contact,'id'>) => void
  updateContact: (c: Contact) => void
  deleteContact: (id: number) => void
  moveStage: (id: number, stageId: string) => void
  setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>
  setFields: React.Dispatch<React.SetStateAction<CRMField[]>>
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
  addMessage: (threadId: string, body: string) => void
  addThread: (t: Omit<Thread,'id'|'created_at'|'last_message_at'>) => Thread
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace>>
}

const Ctx = createContext<AppContextType | null>(null)

const DEFAULT_WORKSPACE: Workspace = {
  id: DEMO_WORKSPACE_ID, name: 'My Workspace', slug: 'my-workspace',
  industry: 'SaaS', currency: 'USD', accent: '#e8a045',
  plan: 'pro', owner_id: DEMO_USER_ID, created_at: '2026-01-01',
}

const DEFAULT_MEMBERS: WorkspaceMember[] = [
  { id: 'wm1', workspace_id: DEMO_WORKSPACE_ID, user_id: DEMO_USER_ID, email: 'dearis@co.com', name: 'DeAris', role: 'owner', avatar_color: '#e8a045', online: true },
  { id: 'wm2', workspace_id: DEMO_WORKSPACE_ID, user_id: 'user_alex',  email: 'alex@co.com',   name: 'Alex',   role: 'admin', avatar_color: '#5b8ef5', online: true },
  { id: 'wm3', workspace_id: DEMO_WORKSPACE_ID, user_id: 'user_maria', email: 'maria@co.com',  name: 'Maria',  role: 'member', avatar_color: '#9b72f5', online: false },
]

export function AppProvider({ children }: { children: ReactNode }) {
  // Active workspace ID — all data is scoped to this
  const [activeWsId, setActiveWsIdState] = useState<string>(() =>
    ls.get('nx_active_ws', 'ws_demo_001')
  )

  const setActiveWsId = useCallback((id: string) => {
    ls.set('nx_active_ws', id)
    setActiveWsIdState(id)
  }, [])

  const [workspace,   setWorkspace]   = useState<Workspace>(() => ls.get('nx_workspace', DEFAULT_WORKSPACE))
  const [members]                     = useState<WorkspaceMember[]>(DEFAULT_MEMBERS)

  // All data keyed by workspace ID so each workspace is fully isolated
  const [contacts,    setContacts]    = useState<Contact[]>(() =>    ls.get(`nx_contacts_${ls.get('nx_active_ws','ws_demo_001')}`,    DEMO_CONTACTS))
  const [pipelines,   setPipelines]   = useState<Pipeline[]>(() =>   ls.get(`nx_pipelines_${ls.get('nx_active_ws','ws_demo_001')}`,   DEMO_PIPELINES))
  const [fields,      setFields]      = useState<CRMField[]>(() =>   ls.get(`nx_fields_${ls.get('nx_active_ws','ws_demo_001')}`,      DEMO_FIELDS))
  const [automations, setAutomations] = useState<Automation[]>(() => ls.get(`nx_automations_${ls.get('nx_active_ws','ws_demo_001')}`, DEMO_AUTOMATIONS))
  const [threads,     setThreads]     = useState<Thread[]>(() =>     ls.get(`nx_threads_${ls.get('nx_active_ws','ws_demo_001')}`,     DEMO_THREADS))
  const [messages,    setMessages]    = useState<Message[]>(() =>    ls.get(`nx_messages_${ls.get('nx_active_ws','ws_demo_001')}`,    DEMO_MESSAGES))
  const [campaigns,   setCampaigns]   = useState<Campaign[]>(() =>   ls.get(`nx_campaigns_${ls.get('nx_active_ws','ws_demo_001')}`,   DEMO_CAMPAIGNS))

  // Persist workspace settings
  useEffect(() => ls.set('nx_workspace', workspace), [workspace])

  // Persist all data scoped to active workspace
  useEffect(() => ls.set(`nx_contacts_${activeWsId}`,    contacts),    [contacts,    activeWsId])
  useEffect(() => ls.set(`nx_pipelines_${activeWsId}`,   pipelines),   [pipelines,   activeWsId])
  useEffect(() => ls.set(`nx_fields_${activeWsId}`,      fields),      [fields,      activeWsId])
  useEffect(() => ls.set(`nx_automations_${activeWsId}`, automations), [automations, activeWsId])
  useEffect(() => ls.set(`nx_threads_${activeWsId}`,     threads),     [threads,     activeWsId])
  useEffect(() => ls.set(`nx_messages_${activeWsId}`,    messages),    [messages,    activeWsId])
  useEffect(() => ls.set(`nx_campaigns_${activeWsId}`,   campaigns),   [campaigns,   activeWsId])

  // When workspace switches, reload all data for that workspace
  useEffect(() => {
    setContacts(   ls.get(`nx_contacts_${activeWsId}`,    activeWsId === 'ws_demo_001' ? DEMO_CONTACTS    : []))
    setPipelines(  ls.get(`nx_pipelines_${activeWsId}`,   activeWsId === 'ws_demo_001' ? DEMO_PIPELINES   : DEMO_PIPELINES))
    setFields(     ls.get(`nx_fields_${activeWsId}`,      DEMO_FIELDS))
    setAutomations(ls.get(`nx_automations_${activeWsId}`, activeWsId === 'ws_demo_001' ? DEMO_AUTOMATIONS : []))
    setThreads(    ls.get(`nx_threads_${activeWsId}`,     activeWsId === 'ws_demo_001' ? DEMO_THREADS     : []))
    setMessages(   ls.get(`nx_messages_${activeWsId}`,    activeWsId === 'ws_demo_001' ? DEMO_MESSAGES    : []))
    setCampaigns(  ls.get(`nx_campaigns_${activeWsId}`,   activeWsId === 'ws_demo_001' ? DEMO_CAMPAIGNS   : []))
  }, [activeWsId])

  const addContact = useCallback((c: Omit<Contact,'id'>) => {
    setContacts(p => [...p, { ...c, id: Date.now() }])
  }, [])

  const updateContact = useCallback((c: Contact) => {
    setContacts(p => p.map(x => x.id === c.id ? c : x))
  }, [])

  const deleteContact = useCallback((id: number) => {
    setContacts(p => p.filter(c => c.id !== id))
  }, [])

  const moveStage = useCallback((id: number, stageId: string) => {
    setContacts(p => p.map(c => c.id === id ? { ...c, stage_id: stageId } : c))
  }, [])

  const addMessage = useCallback((threadId: string, body: string) => {
    const msg: Message = {
      id: uid(), thread_id: threadId, workspace_id: activeWsId,
      author_id: DEMO_USER_ID, author_name: 'DeAris', author_color: '#e8a045',
      body, mentions: [], reactions: {}, created_at: new Date().toISOString(),
    }
    setMessages(p => [...p, msg])
    setThreads(p => p.map(t => t.id === threadId ? { ...t, last_message_at: msg.created_at } : t))
  }, [activeWsId])

  const addThread = useCallback((t: Omit<Thread,'id'|'created_at'|'last_message_at'>): Thread => {
    const now = new Date().toISOString()
    const thread: Thread = { ...t, id: uid(), created_at: now, last_message_at: now }
    setThreads(p => [thread, ...p])
    return thread
  }, [])

  const currentUser = members[0]

  return (
    <Ctx.Provider value={{
      workspace, members, currentUser, activeWsId, setActiveWsId,
      contacts, pipelines, fields, automations, threads, messages, campaigns,
      addContact, updateContact, deleteContact, moveStage,
      setPipelines, setFields, setAutomations, setCampaigns,
      addMessage, addThread, setWorkspace,
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