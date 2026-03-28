'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Contact, Pipeline, CRMField, Automation, Thread, Message, Campaign, Workspace, WorkspaceMember } from '@/lib/types'
import { DEMO_PIPELINES, DEMO_FIELDS, DEMO_CONTACTS, DEMO_AUTOMATIONS, DEMO_THREADS, DEMO_MESSAGES, DEMO_CAMPAIGNS, DEMO_WORKSPACE_ID, DEMO_USER_ID } from '@/lib/defaults'
import { ls, uid } from '@/lib/utils'

interface AppContextType {
  // Workspace
  workspace: Workspace
  members: WorkspaceMember[]
  currentUser: WorkspaceMember

  // CRM
  contacts: Contact[]
  pipelines: Pipeline[]
  fields: CRMField[]

  // Inbox
  threads: Thread[]
  messages: Message[]

  // Campaigns
  campaigns: Campaign[]

  // Automations
  automations: Automation[]

  // Contact actions
  addContact: (c: Omit<Contact,'id'>) => void
  updateContact: (c: Contact) => void
  deleteContact: (id: number) => void
  moveStage: (id: number, stageId: string) => void

  // Pipeline actions
  setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>
  setFields: React.Dispatch<React.SetStateAction<CRMField[]>>

  // Automation actions
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>

  // Campaign actions
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>

  // Inbox actions
  addMessage: (threadId: string, body: string) => void
  addThread: (t: Omit<Thread,'id'|'created_at'|'last_message_at'>) => Thread

  // Workspace
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
  { id: 'wm3', workspace_id: DEMO_WORKSPACE_ID, user_id: 'user_maria', email: 'maria@co.com',  name: 'Maria',  role: 'member',avatar_color: '#9b72f5', online: false },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [workspace,   setWorkspace]   = useState<Workspace>(() => ls.get('nx_workspace', DEFAULT_WORKSPACE))
  const [members]                     = useState<WorkspaceMember[]>(DEFAULT_MEMBERS)
  const [contacts,    setContacts]    = useState<Contact[]>(() => ls.get('nx_contacts', DEMO_CONTACTS))
  const [pipelines,   setPipelines]   = useState<Pipeline[]>(() => ls.get('nx_pipelines', DEMO_PIPELINES))
  const [fields,      setFields]      = useState<CRMField[]>(() => ls.get('nx_fields', DEMO_FIELDS))
  const [automations, setAutomations] = useState<Automation[]>(() => ls.get('nx_automations', DEMO_AUTOMATIONS))
  const [threads,     setThreads]     = useState<Thread[]>(() => ls.get('nx_threads', DEMO_THREADS))
  const [messages,    setMessages]    = useState<Message[]>(() => ls.get('nx_messages', DEMO_MESSAGES))
  const [campaigns,   setCampaigns]   = useState<Campaign[]>(() => ls.get('nx_campaigns', DEMO_CAMPAIGNS))

  useEffect(() => ls.set('nx_workspace',   workspace),   [workspace])
  useEffect(() => ls.set('nx_contacts',    contacts),    [contacts])
  useEffect(() => ls.set('nx_pipelines',   pipelines),   [pipelines])
  useEffect(() => ls.set('nx_fields',      fields),      [fields])
  useEffect(() => ls.set('nx_automations', automations), [automations])
  useEffect(() => ls.set('nx_threads',     threads),     [threads])
  useEffect(() => ls.set('nx_messages',    messages),    [messages])
  useEffect(() => ls.set('nx_campaigns',   campaigns),   [campaigns])

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
      id: uid(), thread_id: threadId, workspace_id: DEMO_WORKSPACE_ID,
      author_id: DEMO_USER_ID, author_name: 'DeAris', author_color: '#e8a045',
      body, mentions: [], reactions: {}, created_at: new Date().toISOString(),
    }
    setMessages(p => [...p, msg])
    setThreads(p => p.map(t => t.id === threadId ? { ...t, last_message_at: msg.created_at } : t))
  }, [])

  const addThread = useCallback((t: Omit<Thread,'id'|'created_at'|'last_message_at'>): Thread => {
    const now = new Date().toISOString()
    const thread: Thread = { ...t, id: uid(), created_at: now, last_message_at: now }
    setThreads(p => [thread, ...p])
    return thread
  }, [])

  const currentUser = members[0]

  return (
    <Ctx.Provider value={{
      workspace, members, currentUser,
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
