'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'
import { createClient } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalTask {
  id: string
  workspace_id: string
  contact_id?: number
  title: string
  done: boolean
  due_date?: string
  due_time?: string
  created_at: string
  contacts?: { name: string } | null
}

interface CalEvent {
  id: string
  type: 'task' | 'campaign' | 'followup'
  title: string
  subtitle?: string
  date: string      // YYYY-MM-DD
  time?: string     // HH:MM
  color: string
  raw?: unknown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }
function ymd(d: Date)   { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function today()        { return ymd(new Date()) }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return ymd(d)
}

function monthStart(y: number, m: number) { return new Date(y, m, 1) }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }

const DOW_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const HOURS = Array.from({length: 14}, (_,i) => i + 7) // 7..20

function formatHour(h: number) {
  if (h === 0 || h === 12) return '12 ' + (h < 12 ? 'AM' : 'PM')
  return h < 12 ? `${h} AM` : `${h-12} PM`
}

// Monday-anchored week grid for a month
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = monthStart(year, month)
  // 0=Sun..6=Sat → 0=Mon..6=Sun
  let startDow = first.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const days = daysInMonth(year, month)
  const cells: (Date | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i+7))
  return rows
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { contacts, campaigns, activeWsId } = useApp()
  const supabase = createClient()

  const now = new Date()
  const [view, setView]           = useState<'month'|'week'|'day'>('month')
  const [curYear, setCurYear]     = useState(now.getFullYear())
  const [curMonth, setCurMonth]   = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(today())
  const [tasks, setTasks]         = useState<CalTask[]>([])
  const [showModal, setShowModal] = useState(false)
  const [dayPanel, setDayPanel]   = useState<string | null>(null)

  // New task form
  const [form, setForm] = useState({ title: '', date: today(), time: '09:00', contact_id: '', note: '' })
  const [saving, setSaving] = useState(false)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!activeWsId) return
    const { data } = await supabase
      .from('tasks')
      .select('*, contacts(name)')
      .eq('workspace_id', activeWsId)
    if (data) setTasks(data as CalTask[])
  }, [activeWsId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Build events
  const events: CalEvent[] = []

  // Tasks
  for (const t of tasks) {
    if (!t.due_date) continue
    events.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      subtitle: (t.contacts as any)?.name,
      date: t.due_date.slice(0, 10),
      time: t.due_time,
      color: 'var(--blue)',
      raw: t,
    })
  }

  // Campaigns
  for (const c of campaigns) {
    if (!c.scheduled_at) continue
    events.push({
      id: `camp-${c.id}`,
      type: 'campaign',
      title: c.name,
      subtitle: c.type,
      date: c.scheduled_at.slice(0, 10),
      time: c.scheduled_at.slice(11, 16),
      color: 'var(--acc)',
      raw: c,
    })
  }

  // Follow-ups (last_contact + 7 days)
  for (const c of contacts) {
    if (!c.last_contact) continue
    const followDate = addDays(c.last_contact.slice(0, 10), 7)
    events.push({
      id: `fu-${c.id}`,
      type: 'followup',
      title: 'Follow up due',
      subtitle: c.name,
      date: followDate,
      color: 'var(--green)',
      raw: c,
    })
  }

  const eventsOnDate = (d: string) => events.filter(e => e.date === d)
  const eventsOnHour = (d: string, h: number) =>
    events.filter(e => e.date === d && e.time && parseInt(e.time.split(':')[0]) === h)

  // Week dates (Mon-Sun)
  function getWeekDates(dateStr: string): string[] {
    const d = new Date(dateStr + 'T00:00:00')
    let dow = d.getDay()
    dow = dow === 0 ? 6 : dow - 1
    const mon = new Date(d)
    mon.setDate(d.getDate() - dow)
    return Array.from({length: 7}, (_, i) => {
      const dd = new Date(mon)
      dd.setDate(mon.getDate() + i)
      return ymd(dd)
    })
  }

  // Navigation
  function prevMonth()  { if (curMonth === 0) { setCurYear(y => y-1); setCurMonth(11) } else setCurMonth(m => m-1) }
  function nextMonth()  { if (curMonth === 11) { setCurYear(y => y+1); setCurMonth(0) } else setCurMonth(m => m+1) }
  function prevWeek()   { const d = new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()-7); setSelectedDate(ymd(d)) }
  function nextWeek()   { const d = new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()+7); setSelectedDate(ymd(d)) }
  function prevDay()    { const d = new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()-1); setSelectedDate(ymd(d)) }
  function nextDay()    { const d = new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()+1); setSelectedDate(ymd(d)) }

  function goToday() {
    const t = today()
    const d = new Date(t)
    setCurYear(d.getFullYear())
    setCurMonth(d.getMonth())
    setSelectedDate(t)
  }

  function jumpToDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    setCurYear(d.getFullYear())
    setCurMonth(d.getMonth())
    setSelectedDate(dateStr)
  }

  // Save task
  async function saveTask() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await supabase.from('tasks').insert({
        workspace_id: activeWsId,
        title: form.title,
        due_date: form.date,
        due_time: form.time || null,
        contact_id: form.contact_id ? parseInt(form.contact_id) : null,
        notes: form.note || null,
        done: false,
        created_by: '',
        created_at: new Date().toISOString(),
      })
      await fetchTasks()
      setShowModal(false)
      setForm({ title: '', date: today(), time: '09:00', contact_id: '', note: '' })
    } finally {
      setSaving(false)
    }
  }

  const weekDates = getWeekDates(selectedDate)
  const monthGrid = buildMonthGrid(curYear, curMonth)
  const todayStr  = today()

  // Mini calendar — same month as curYear/curMonth
  const miniGrid = buildMonthGrid(curYear, curMonth)

  // ── Render helpers ──────────────────────────────────────────────────────────

  function EventChip({ ev, small }: { ev: CalEvent; small?: boolean }) {
    const bg = ev.color.replace('var(--blue)', 'rgba(37,99,235,.12)')
                       .replace('var(--acc)',  'rgba(212,136,10,.12)')
                       .replace('var(--green)','rgba(22,163,74,.12)')
    const border = ev.color.replace('var(--blue)', 'rgba(37,99,235,.4)')
                           .replace('var(--acc)',  'rgba(212,136,10,.4)')
                           .replace('var(--green)','rgba(22,163,74,.4)')
    return (
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${ev.color}`,
        borderRadius: 4,
        padding: small ? '1px 4px' : '3px 6px',
        marginBottom: 2,
        fontSize: small ? 10 : 11.5,
        color: 'var(--t1)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        cursor: 'default',
        boxShadow: '0 1px 2px rgba(0,0,0,.06)',
      }}>
        <span style={{ fontWeight: 600 }}>{ev.title}</span>
        {ev.subtitle && <span style={{ color: 'var(--t3)', marginLeft: 4 }}>{ev.subtitle}</span>}
      </div>
    )
  }

  function EventBlock({ ev }: { ev: CalEvent }) {
    const bg = ev.color.replace('var(--blue)', 'rgba(37,99,235,.15)')
                       .replace('var(--acc)',  'rgba(212,136,10,.15)')
                       .replace('var(--green)','rgba(22,163,74,.15)')
    return (
      <div style={{
        background: bg,
        borderLeft: `3px solid ${ev.color}`,
        borderRadius: 4,
        padding: '4px 7px',
        marginBottom: 3,
        fontSize: 11.5,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{ev.title}</div>
        {ev.subtitle && <div style={{ color: 'var(--t3)', fontSize: 11 }}>{ev.subtitle}</div>}
        {ev.time && <div style={{ color: ev.color, fontSize: 10.5, marginTop: 1 }}>{ev.time}</div>}
      </div>
    )
  }

  // ── Month View ──────────────────────────────────────────────────────────────

  const MonthView = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--br)' }}>
        {DOW_LABELS.map(d => (
          <div key={d} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.4px', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      {/* Rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
        {monthGrid.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 1, borderBottom: '1px solid var(--br)', minHeight: 90 }}>
            {row.map((cell, ci) => {
              const ds = cell ? ymd(cell) : null
              const isToday   = ds === todayStr
              const isSelected = ds === selectedDate
              const dayEvs    = ds ? eventsOnDate(ds) : []
              return (
                <div
                  key={ci}
                  onClick={() => { if (ds) { setDayPanel(ds); setSelectedDate(ds) } }}
                  style={{
                    borderRight: ci < 6 ? '1px solid var(--br)' : 'none',
                    padding: '6px 7px',
                    cursor: ds ? 'pointer' : 'default',
                    background: isSelected ? 'var(--acc-bg)' : 'transparent',
                    transition: 'background .1s',
                    position: 'relative',
                    minHeight: 90,
                  }}
                  onMouseEnter={e => { if (ds && !isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--s3)' }}
                  onMouseLeave={e => { if (ds && !isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  {cell && (
                    <>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12.5, fontWeight: isToday ? 700 : 400,
                        background: isToday ? 'var(--acc)' : 'transparent',
                        color: isToday ? '#fff' : isSelected ? 'var(--acc)' : 'var(--t1)',
                        marginBottom: 4,
                      }}>
                        {cell.getDate()}
                      </div>
                      {dayEvs.slice(0, 3).map(ev => (
                        <EventChip key={ev.id} ev={ev} small />
                      ))}
                      {dayEvs.length > 3 && (
                        <div style={{ fontSize: 10, color: 'var(--t3)', paddingLeft: 4 }}>+{dayEvs.length - 3} more</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  // ── Week View ───────────────────────────────────────────────────────────────

  const WeekView = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '54px repeat(7,1fr)', borderBottom: '1px solid var(--br)', position: 'sticky', top: 0, background: 'var(--s1)', zIndex: 2 }}>
        <div />
        {weekDates.map(d => {
          const dt = new Date(d+'T00:00:00')
          const isToday = d === todayStr
          return (
            <div
              key={d}
              onClick={() => { setSelectedDate(d); setView('day') }}
              style={{ padding: '6px 4px', textAlign: 'center', cursor: 'pointer', borderLeft: '1px solid var(--br)' }}
            >
              <div style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                {DOW_LABELS[new Date(d+'T00:00:00').getDay() === 0 ? 6 : new Date(d+'T00:00:00').getDay()-1]}
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: isToday ? 700 : 500,
                background: isToday ? 'var(--acc)' : 'transparent',
                color: isToday ? '#fff' : 'var(--t1)',
                marginTop: 2,
              }}>
                {dt.getDate()}
              </div>
            </div>
          )
        })}
      </div>
      {/* Hour rows */}
      {HOURS.map(h => (
        <div key={h} style={{ display: 'grid', gridTemplateColumns: '54px repeat(7,1fr)', borderBottom: '1px solid var(--br)', minHeight: 64 }}>
          <div style={{ padding: '4px 8px 4px 4px', textAlign: 'right', fontSize: 10.5, color: 'var(--t3)', paddingTop: 5 }}>{formatHour(h)}</div>
          {weekDates.map(d => {
            const evs = eventsOnHour(d, h)
            return (
              <div key={d} style={{ borderLeft: '1px solid var(--br)', padding: '3px 4px', position: 'relative', minHeight: 64 }}>
                {evs.map(ev => <EventChip key={ev.id} ev={ev} />)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )

  // ── Day View ────────────────────────────────────────────────────────────────

  const DayView = (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {HOURS.map(h => {
        const evs = eventsOnHour(selectedDate, h)
        return (
          <div key={h} style={{ display: 'flex', borderBottom: '1px solid var(--br)', minHeight: 72 }}>
            <div style={{ width: 64, flexShrink: 0, padding: '5px 12px 5px 0', textAlign: 'right', fontSize: 11, color: 'var(--t3)' }}>{formatHour(h)}</div>
            <div style={{ flex: 1, padding: '5px 12px', borderLeft: '1px solid var(--br)' }}>
              {evs.map(ev => <EventBlock key={ev.id} ev={ev} />)}
            </div>
          </div>
        )
      })}
      {/* All-day events (no time) */}
      {eventsOnDate(selectedDate).filter(e => !e.time).length > 0 && (
        <div style={{ padding: '10px 12px 10px 76px', borderBottom: '1px solid var(--br)', background: 'var(--s2)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>All day</div>
          {eventsOnDate(selectedDate).filter(e => !e.time).map(ev => <EventBlock key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  )

  // ── Day Panel (right sidebar in month view) ─────────────────────────────────

  const dayPanelEvs = dayPanel ? eventsOnDate(dayPanel) : []
  const dpDate = dayPanel ? new Date(dayPanel + 'T00:00:00') : null

  // ── Mini calendar ───────────────────────────────────────────────────────────

  const miniDates = new Set(events.map(e => e.date))

  const MiniCal = (
    <div style={{ padding: 12, borderBottom: '1px solid var(--br)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>
          {MONTH_LABELS[curMonth].slice(0,3)} {curYear}
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9.5, color: 'var(--t3)', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      {miniGrid.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {row.map((cell, ci) => {
            const ds = cell ? ymd(cell) : ''
            const isToday    = ds === todayStr
            const isSelected = ds === selectedDate
            const hasDot     = ds && miniDates.has(ds)
            return (
              <div
                key={ci}
                onClick={() => { if (ds) { jumpToDate(ds); if (view === 'month') setDayPanel(ds) } }}
                style={{
                  position: 'relative',
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10.5, cursor: ds ? 'pointer' : 'default',
                  background: isToday ? 'var(--acc)' : isSelected ? 'var(--acc-bg)' : 'transparent',
                  color: isToday ? '#fff' : isSelected ? 'var(--acc)' : ds ? 'var(--t2)' : 'transparent',
                  fontWeight: isToday ? 700 : 400,
                  margin: '1px auto',
                  transition: 'background .1s',
                }}
              >
                {cell?.getDate()}
                {hasDot && !isToday && (
                  <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--acc)' }} />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )

  // ── Nav title ───────────────────────────────────────────────────────────────

  let navTitle = ''
  if (view === 'month') navTitle = `${MONTH_LABELS[curMonth]} ${curYear}`
  else if (view === 'week') {
    const wd = weekDates
    const a  = new Date(wd[0]+'T00:00:00')
    const b  = new Date(wd[6]+'T00:00:00')
    navTitle = a.getMonth() === b.getMonth()
      ? `${MONTH_LABELS[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`
      : `${MONTH_LABELS[a.getMonth()].slice(0,3)} ${a.getDate()} – ${MONTH_LABELS[b.getMonth()].slice(0,3)} ${b.getDate()}, ${a.getFullYear()}`
  } else {
    const d = new Date(selectedDate + 'T00:00:00')
    navTitle = `${DOW_LABELS[d.getDay()===0?6:d.getDay()-1]}, ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }

  function handlePrev() { if (view==='month') prevMonth(); else if (view==='week') prevWeek(); else prevDay() }
  function handleNext() { if (view==='month') nextMonth(); else if (view==='week') nextWeek(); else nextDay() }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Calendar">
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 8 }}>
          {(['month','week','day'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 12, padding: '4px 10px', textTransform: 'capitalize',
                background: view === v ? 'var(--acc-bg)' : '',
                color: view === v ? 'var(--acc)' : 'var(--t2)',
                borderColor: view === v ? 'var(--acc-br)' : 'var(--br)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          className="btn btn-acc btn-sm"
          onClick={() => setShowModal(true)}
          style={{ fontSize: 13, padding: '4px 12px' }}
        >
          + Add Event
        </button>
      </Topbar>

      <div style={{ display: 'flex', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--br)', background: 'var(--s1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {MiniCal}

          {/* Legend */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Legend</div>
            {[
              { color: 'var(--blue)',  label: 'Tasks' },
              { color: 'var(--acc)',   label: 'Campaigns' },
              { color: 'var(--green)', label: 'Follow-ups' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Calendar ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--br)', background: 'var(--s1)' }}>
            <button onClick={handlePrev} style={navBtnStyle}>‹</button>
            <button onClick={handleNext} style={navBtnStyle}>›</button>
            <button
              onClick={goToday}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              Today
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginLeft: 6 }}>{navTitle}</span>
          </div>

          {/* Calendar body + optional day panel */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {view === 'month' && MonthView}
              {view === 'week'  && WeekView}
              {view === 'day'   && DayView}
            </div>

            {/* Day detail panel (month view only) */}
            {view === 'month' && dayPanel && (
              <div style={{
                width: 280, flexShrink: 0, borderLeft: '1px solid var(--br)', background: 'var(--s1)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                {/* Panel header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--br)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                      {dpDate && `${MONTH_LABELS[dpDate.getMonth()].slice(0,3)} ${dpDate.getDate()}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{dayPanelEvs.length} event{dayPanelEvs.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    onClick={() => setDayPanel(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--t3)', lineHeight: 1, padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit' }}
                  >
                    ×
                  </button>
                </div>
                {/* Events list */}
                <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                  {dayPanelEvs.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', paddingTop: 24 }}>No events</div>
                  ) : dayPanelEvs.map(ev => <EventBlock key={ev.id} ev={ev} />)}
                  <button
                    onClick={() => { setForm(f => ({ ...f, date: dayPanel })); setShowModal(true) }}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', marginTop: 10, fontSize: 12 }}
                  >
                    + Add event on this day
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--s1)', borderRadius: 12, width: 420, boxShadow: '0 16px 48px rgba(0,0,0,.25)', border: '1px solid var(--br)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--br)' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>New Task</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--t3)', lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input className="fi" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Task title" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input className="fi" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input className="fi" type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Contact</label>
                <select className="fs" value={form.contact_id} onChange={e => setForm(f => ({...f, contact_id: e.target.value}))} style={{ width: '100%' }}>
                  <option value="">— No contact —</option>
                  {contacts.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Note</label>
                <textarea className="fi" value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} placeholder="Optional note" rows={3} style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-acc btn-sm" onClick={saveTask} disabled={saving || !form.title.trim()}>
                  {saving ? 'Saving…' : 'Save Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Shared style objects ─────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  background: 'var(--s2)',
  border: '1px solid var(--br)',
  borderRadius: 6,
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
  color: 'var(--t2)',
  fontFamily: 'inherit',
  lineHeight: 1,
  padding: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--t3)',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '.35px',
}
