'use client'
import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar, Avatar } from '@/components/ui'
import { timeAgo, uid } from '@/lib/utils'
import type { Thread } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  deal_room: '🏢', team: '💬', announcement: '📣', direct: '👤'
}
const TYPE_LABEL: Record<string, string> = {
  deal_room: 'Deal Room', team: 'Team', announcement: 'Announcement', direct: 'Direct'
}

export default function InboxPage() {
  const { threads, messages, contacts, addMessage, addThread, currentUser } = useApp()
  const [activeId, setActiveId] = useState<string>(threads[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<Thread['type']>('team')
  const [newContact, setNewContact] = useState('')
  const [filter, setFilter] = useState<'all' | Thread['type']>('all')
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeThread = threads.find(t => t.id === activeId)
  const threadMessages = messages.filter(m => m.thread_id === activeId).sort((a, b) => a.created_at.localeCompare(b.created_at))
  const filteredThreads = threads
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [threadMessages.length, activeId])

  const send = () => {
    if (!draft.trim() || !activeId) return
    addMessage(activeId, draft.trim())
    setDraft('')
  }

  const createThread = () => {
    if (!newTitle.trim()) return
    const t = addThread({
      workspace_id: currentUser.workspace_id,
      title: newTitle,
      type: newType,
      contact_id: newContact ? parseInt(newContact) : undefined,
      created_by: currentUser.user_id,
      pinned: false,
    })
    setActiveId(t.id)
    setShowNew(false)
    setNewTitle('')
    setNewContact('')
  }

  const getContactForThread = (t: Thread) => t.contact_id ? contacts.find(c => c.id === t.contact_id) : null

  return (
    <>
      <Topbar title="Inbox">
        <button className="btn btn-acc btn-sm" onClick={() => setShowNew(true)}>+ New Thread</button>
      </Topbar>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 54px)' }}>
        {/* Thread list */}
        <div className="thread-list" style={{ background: 'var(--s1)' }}>
          {/* Filter tabs */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--br)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {(['all','deal_room','team','announcement'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="btn btn-ghost btn-xs"
                style={{ fontSize: 10.5, padding: '3px 8px', background: filter === f ? 'var(--acc-bg)' : '', color: filter === f ? 'var(--acc)' : 'var(--t3)', borderColor: filter === f ? 'var(--acc-br)' : 'var(--br)' }}>
                {f === 'all' ? 'All' : TYPE_LABEL[f]}
              </button>
            ))}
          </div>

          {filteredThreads.map(t => {
            const lastMsg = [...messages].filter(m => m.thread_id === t.id).sort((a,b) => b.created_at.localeCompare(a.created_at))[0]
            const contact = getContactForThread(t)
            return (
              <div key={t.id} className={`thread-item ${activeId === t.id ? 'active' : ''}`} onClick={() => setActiveId(t.id)}
                style={activeId === t.id ? { borderLeftColor: 'var(--acc)' } : {}}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICON[t.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{timeAgo(t.last_message_at)}</span>
                    </div>
                    {lastMsg && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {lastMsg.author_name}: {lastMsg.body}
                    </div>}
                    {contact && <div style={{ fontSize: 10, color: 'var(--acc)', marginTop: 3 }}>📎 {contact.name}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message area */}
        <div className="msg-area">
          {activeThread ? (
            <>
              {/* Thread header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--s1)' }}>
                <span style={{ fontSize: 20 }}>{TYPE_ICON[activeThread.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{activeThread.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{TYPE_LABEL[activeThread.type]} · {threadMessages.length} messages</div>
                </div>
                {getContactForThread(activeThread) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--s3)', border: '1px solid var(--br)', borderRadius: 8 }}>
                    <div className="dot" style={{ background: 'var(--acc)' }} />
                    <span style={{ fontSize: 12, color: 'var(--t2)' }}>{getContactForThread(activeThread)?.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{getContactForThread(activeThread)?.company}</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="msg-list">
                {threadMessages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)', fontSize: 13 }}>
                    No messages yet. Start the conversation.
                  </div>
                )}
                {threadMessages.map((m, i) => {
                  const isOwn = m.author_id === currentUser.user_id
                  const showAvatar = i === 0 || threadMessages[i-1]?.author_id !== m.author_id
                  return (
                    <div key={m.id} className={`msg-bubble ${isOwn ? 'own' : ''}`}>
                      {showAvatar ? (
                        <div className="av" style={{ width: 28, height: 28, background: m.author_color + '22', color: m.author_color, fontSize: 10, borderRadius: 7, flexShrink: 0 }}>
                          {m.author_name.slice(0,2).toUpperCase()}
                        </div>
                      ) : <div style={{ width: 28 }} />}
                      <div>
                        {showAvatar && <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, paddingLeft: isOwn ? 0 : 2, textAlign: isOwn ? 'right' : 'left' }}>
                          {isOwn ? 'You' : m.author_name} · {timeAgo(m.created_at)}
                        </div>}
                        <div className="msg-body">
                          {m.body}
                        </div>
                        {Object.keys(m.reactions).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                            {Object.entries(m.reactions).map(([emoji, users]) => (
                              <span key={emoji} style={{ fontSize: 11, background: 'rgba(255,255,255,.07)', border: '1px solid var(--br)', padding: '2px 6px', borderRadius: 10, cursor: 'pointer' }}>
                                {emoji} {users.length}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="msg-input-bar">
                <textarea
                  className="fta"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
                  style={{ minHeight: 38, maxHeight: 120, resize: 'none', flex: 1 }}
                  rows={1}
                />
                <button className="btn btn-acc" onClick={send} disabled={!draft.trim()}>Send</button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
              Select a thread to start messaging
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNew && (
        <div className="ov" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-title">New Thread</div>
            <div className="modal-sub">Create a deal room, team thread, or announcement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field"><label className="fl">Title</label>
                <input className="fi" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Stackhaus Deal Room" />
              </div>
              <div className="field"><label className="fl">Type</label>
                <select className="fs" value={newType} onChange={e => setNewType(e.target.value as Thread['type'])}>
                  <option value="deal_room">🏢 Deal Room (linked to a contact)</option>
                  <option value="team">💬 Team Thread</option>
                  <option value="announcement">📣 Announcement</option>
                  <option value="direct">👤 Direct Message</option>
                </select>
              </div>
              {newType === 'deal_room' && (
                <div className="field"><label className="fl">Link to Contact (optional)</label>
                  <select className="fs" value={newContact} onChange={e => setNewContact(e.target.value)}>
                    <option value="">— None —</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name} · {c.company}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-acc" onClick={createThread}>Create Thread</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
