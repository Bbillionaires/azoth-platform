'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { Topbar } from '@/components/ui'
import type { Contact, Stage } from '@/lib/types'

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function scoreContact(contact: Contact, stages: Stage[]): { score: number; milestones: string[] } {
  const tags = (contact.tags ?? []).map(t => t.toLowerCase())
  const stage = stages.find(s => s.id === contact.stage_id)
  const stageName = (stage?.name ?? '').toLowerCase()
  const source = (contact.source ?? '').toLowerCase()

  let score = 0
  const milestones: string[] = []

  // contact_created: 1
  score += 1
  milestones.push('Lead Created')

  // call_attempted: 2
  if (source.includes('call') || tags.some(t => t.includes('called') || t === 'call')) {
    score += 2
    milestones.push('Call Attempted')
  }

  // call_answered: 4
  if (tags.includes('call-answered') || tags.includes('spoke')) {
    score += 4
    milestones.push('Call Answered')
  }

  // email_given: 5
  const email = contact.email ?? ''
  if (email && !email.includes('placeholder') && email.includes('@')) {
    score += 5
    milestones.push('Email Given')
  }

  // email_opened: 6
  if (tags.includes('email-opened')) {
    score += 6
    milestones.push('Email Opened')
  }

  // meeting_scheduled: 8
  if (tags.includes('meeting-scheduled') || tags.includes('appointment') || stageName.includes('meeting')) {
    score += 8
    milestones.push('Meeting Scheduled')
  }

  // contract_sent: 10
  if (tags.includes('contract-sent') || stageName.includes('proposal')) {
    score += 10
    milestones.push('Contract Sent')
  }

  // contract_signed: 15
  if (tags.includes('contract-signed') || stageName.includes('negotiation')) {
    score += 15
    milestones.push('Contract Signed')
  }

  // first_payment: 20
  if (tags.includes('paid') || tags.includes('payment') || stageName.includes('won')) {
    score += 20
    milestones.push('First Payment')
  }

  // full_payment: 25
  if (tags.includes('paid-full') || tags.includes('closed')) {
    score += 25
    milestones.push('Full Payment')
  }

  // referral_sent: 5 each
  const referrals = tags.filter(t => t.startsWith('referral')).length
  if (referrals > 0) {
    score += referrals * 5
    milestones.push(referrals + ' Referral' + (referrals > 1 ? 's' : ''))
  }

  return { score, milestones }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAR_NAMES = ['Ferrari', 'Lamborghini', 'Bentley', 'McLaren', 'Porsche', 'Bugatti', 'Aston Martin', 'Rolls Royce']

function getCarEmoji(score: number): string {
  if (score >= 71) return '👑'
  if (score >= 41) return '🚀'
  if (score >= 21) return '🏎️'
  return '🚗'
}

function getCarName(id: number | string): string {
  const n = typeof id === 'number' ? id : (id as string).split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  return CAR_NAMES[n % CAR_NAMES.length]
}

function getLap(score: number): number {
  if (score >= 64) return 3
  if (score >= 32) return 2
  return 1
}

function getLapColor(lap: number, score: number): string {
  if (score >= 96) return 'var(--acc)'
  if (lap === 3) return 'var(--green)'
  if (lap === 2) return 'var(--blue)'
  return '#f59e0b'
}

function getLapLabel(lap: number, score: number): string {
  if (score >= 96) return 'Finished!'
  if (lap === 3) return 'Lap 3'
  if (lap === 2) return 'Lap 2'
  return 'Lap 1'
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p: string) => p[0] ?? '').join('').toUpperCase()
}

function getTopMilestone(milestones: string[]): string {
  return milestones[milestones.length - 1] ?? 'Created'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CarData {
  contact: Contact
  score: number
  milestones: string[]
  lane: number
  angle: number
}

interface TooltipState {
  car: CarData
  x: number
  y: number
}

// ─── SVG Track ────────────────────────────────────────────────────────────────

function RaceTrackSVG({ cars }: { cars: CarData[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const VW = 800
  const VH = 460
  const cx = VW / 2
  const cy = VH / 2

  const LANES = [
    { rx: 200, ry: 130 },
    { rx: 245, ry: 165 },
    { rx: 290, ry: 200 },
  ]
  const TRACK_OUTER = { rx: 315, ry: 220 }
  const TRACK_INNER = { rx: 175, ry: 110 }

  function polarToXY(angleDeg: number, rx: number, ry: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return {
      x: cx + rx * Math.cos(rad),
      y: cy + ry * Math.sin(rad),
    }
  }

  const lap1Angle = (32 / 96) * 360
  const lap2Angle = (64 / 96) * 360

  const lap1Outer = polarToXY(lap1Angle, TRACK_OUTER.rx + 8, TRACK_OUTER.ry + 5)
  const lap1Inner = polarToXY(lap1Angle, TRACK_INNER.rx - 8, TRACK_INNER.ry - 5)
  const lap2Outer = polarToXY(lap2Angle, TRACK_OUTER.rx + 8, TRACK_OUTER.ry + 5)
  const lap2Inner = polarToXY(lap2Angle, TRACK_INNER.rx - 8, TRACK_INNER.ry - 5)

  const l1Label = polarToXY(60, TRACK_OUTER.rx - 40, TRACK_OUTER.ry - 35)
  const l2Label = polarToXY(180, TRACK_OUTER.rx - 40, TRACK_OUTER.ry - 35)
  const l3Label = polarToXY(300, TRACK_OUTER.rx - 40, TRACK_OUTER.ry - 35)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={'0 0 ' + VW + ' ' + VH}
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 520 }}
        onClick={() => setTooltip(null)}
      >
        <defs>
          <radialGradient id="trackGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e2535" />
            <stop offset="100%" stopColor="#0d1117" />
          </radialGradient>
          <radialGradient id="grassGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1f0a" />
            <stop offset="100%" stopColor="#071207" />
          </radialGradient>
          <filter id="carGlow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track surface */}
        <ellipse cx={cx} cy={cy} rx={TRACK_OUTER.rx} ry={TRACK_OUTER.ry} fill="url(#trackGrad)" />
        {/* Inner grass */}
        <ellipse cx={cx} cy={cy} rx={TRACK_INNER.rx} ry={TRACK_INNER.ry} fill="url(#grassGrad)" />
        <ellipse cx={cx} cy={cy} rx={TRACK_INNER.rx - 6} ry={TRACK_INNER.ry - 6} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Track borders */}
        <ellipse cx={cx} cy={cy} rx={TRACK_OUTER.rx} ry={TRACK_OUTER.ry} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
        <ellipse cx={cx} cy={cy} rx={TRACK_INNER.rx} ry={TRACK_INNER.ry} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />

        {/* Lane dividers */}
        <ellipse cx={cx} cy={cy} rx={(LANES[0].rx + LANES[1].rx) / 2} ry={(LANES[0].ry + LANES[1].ry) / 2}
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" strokeDasharray="14 9" />
        <ellipse cx={cx} cy={cy} rx={(LANES[1].rx + LANES[2].rx) / 2} ry={(LANES[1].ry + LANES[2].ry) / 2}
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" strokeDasharray="14 9" />

        {/* Start/finish checkered line at angle 0 (top) */}
        {[0,1,2,3,4,5,6,7].map(i => {
          const t0 = i / 8
          const t1 = (i + 1) / 8
          const p0 = polarToXY(0, TRACK_INNER.rx + t0 * (TRACK_OUTER.rx - TRACK_INNER.rx), TRACK_INNER.ry + t0 * (TRACK_OUTER.ry - TRACK_INNER.ry))
          const p1 = polarToXY(0, TRACK_INNER.rx + t1 * (TRACK_OUTER.rx - TRACK_INNER.rx), TRACK_INNER.ry + t1 * (TRACK_OUTER.ry - TRACK_INNER.ry))
          return (
            <line key={i}
              x1={p0.x} y1={p0.y - 5} x2={p1.x} y2={p1.y + 5}
              stroke={i % 2 === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.7)'}
              strokeWidth="9"
            />
          )
        })}
        {/* S/F label */}
        {(() => { const sfPt = polarToXY(0, TRACK_OUTER.rx + 20, TRACK_OUTER.ry + 8); return <text x={sfPt.x} y={sfPt.y} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700">S/F</text> })()}

        {/* Lap 1 marker */}
        <line x1={lap1Inner.x} y1={lap1Inner.y} x2={lap1Outer.x} y2={lap1Outer.y}
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />

        {/* Lap 2 marker */}
        <line x1={lap2Inner.x} y1={lap2Inner.y} x2={lap2Outer.x} y2={lap2Outer.y}
          stroke="#5b8ef5" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />

        {/* Lap zone labels */}
        <text x={l1Label.x} y={l1Label.y} textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700" opacity="0.85">LAP 1</text>
        <text x={l2Label.x} y={l2Label.y} textAnchor="middle" fill="#5b8ef5" fontSize="10" fontWeight="700" opacity="0.85">LAP 2</text>
        <text x={l3Label.x} y={l3Label.y} textAnchor="middle" fill="#3ecf8e" fontSize="10" fontWeight="700" opacity="0.85">LAP 3</text>

        {/* Center branding */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="14" fontWeight="800" letterSpacing="4">AZOTH</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.07)" fontSize="9" letterSpacing="3">RACE TRACK</text>

        {/* Cars */}
        {cars.map((car) => {
          const lane = LANES[car.lane] ?? LANES[1]
          const pos = polarToXY(car.angle, lane.rx, lane.ry)
          const lap = getLap(car.score)
          const carColor = car.contact.color || '#5b8ef5'
          const isActive = tooltip?.car.contact.id === car.contact.id

          return (
            <g key={car.contact.id}
              transform={'translate(' + pos.x + ',' + pos.y + ')'}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                setTooltip(isActive ? null : { car, x: pos.x, y: pos.y })
              }}
            >
              <circle r="15" fill={carColor} opacity="0.12" />
              <circle r="10" fill={carColor}
                stroke={isActive ? '#fff' : 'rgba(255,255,255,0.25)'}
                strokeWidth={isActive ? 2 : 1}
                filter="url(#carGlow)"
              />
              <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="6.5" fontWeight="700">
                {getInitials(car.contact.name)}
              </text>
              <circle cx="8" cy="-8" r="4" fill={getLapColor(lap, car.score)} stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
            </g>
          )
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = tooltip.x > VW / 2 ? tooltip.x - 162 : tooltip.x + 16
          const ty = Math.min(Math.max(tooltip.y - 15, 8), VH - 118)
          const car = tooltip.car
          const lap = getLap(car.score)
          const tagList = car.contact.tags.slice(0, 3)
          return (
            <g>
              <rect x={tx - 2} y={ty - 2} width="162" height="112" rx="9" fill="rgba(0,0,0,0.45)" />
              <rect x={tx} y={ty} width="158" height="108" rx="8"
                fill="#181e2b" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <text x={tx + 10} y={ty + 19} fill="#ecedf0" fontSize="11.5" fontWeight="700">{car.contact.name}</text>
              {car.contact.company
                ? <text x={tx + 10} y={ty + 33} fill="#8f98aa" fontSize="9">{car.contact.company}</text>
                : null
              }
              <text x={tx + 10} y={ty + 49} fill={getLapColor(lap, car.score)} fontSize="10" fontWeight="600">
                {getLapLabel(lap, car.score)} · {car.score} pts
              </text>
              <text x={tx + 10} y={ty + 63} fill="#8f98aa" fontSize="9">
                {getCarEmoji(car.score)} {getCarName(car.contact.id)} · {getTopMilestone(car.milestones)}
              </text>
              {tagList.length > 0 && (
                <>
                  {tagList.map((tag, i) => (
                    <g key={tag}>
                      <rect x={tx + 10 + i * 50} y={ty + 71} width="46" height="16" rx="4" fill="rgba(255,255,255,0.07)" />
                      <text x={tx + 33 + i * 50} y={ty + 82} textAnchor="middle" fill="#8f98aa" fontSize="8">{tag.length > 8 ? tag.slice(0, 7) + '…' : tag}</text>
                    </g>
                  ))}
                </>
              )}
              <text x={tx + 10} y={ty + 102} fill="#50596a" fontSize="7.5">Click to dismiss</text>
            </g>
          )
        })()}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#f59e0b', label: 'Lap 1 (0–31 pts)' },
          { color: 'var(--blue)', label: 'Lap 2 (32–63 pts)' },
          { color: 'var(--green)', label: 'Lap 3 (64–95 pts)' },
          { color: 'var(--acc)', label: 'Finished (96+ pts)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 3, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.8) 0px, rgba(255,255,255,.8) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 8px)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Start / Finish</span>
        </div>
      </div>
    </div>
  )
}

// ─── Leaderboard View ─────────────────────────────────────────────────────────

function LeaderboardView({ cars }: { cars: CarData[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {cars.map((car, i) => {
        const lap = getLap(car.score)
        const lapColor = getLapColor(lap, car.score)
        const pct = Math.min((car.score / 96) * 100, 100)
        const milestone = getTopMilestone(car.milestones)

        return (
          <div key={car.contact.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--s2)', border: '1px solid var(--br)',
            borderRadius: 'var(--r10)', padding: '10px 14px',
            transition: 'border-color .12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brm)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--br)')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: i < 3 ? lapColor + '22' : 'var(--s3)',
              color: i < 3 ? lapColor : 'var(--t3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i === 0 ? 14 : 12, fontWeight: 700,
            }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </div>

            <span style={{ fontSize: 18, flexShrink: 0 }}>{getCarEmoji(car.score)}</span>

            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: car.contact.color || 'var(--acc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {getInitials(car.contact.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {car.contact.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {car.contact.company || getCarName(car.contact.id)}
              </div>
            </div>

            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 5,
              background: lapColor + '18', color: lapColor,
              border: '1px solid ' + lapColor + '30',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {milestone}
            </span>

            <div style={{ minWidth: 115, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--t3)' }}>{getLapLabel(lap, car.score)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: lapColor }}>{car.score} pts</span>
              </div>
              <div style={{ height: 5, background: 'var(--s4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: pct + '%',
                  background: 'linear-gradient(90deg, ' + lapColor + ', ' + lapColor + 'bb)',
                  borderRadius: 3, transition: 'width .5s ease',
                }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RaceTrackPage() {
  const { contacts, pipelines } = useApp()
  const [view, setView] = useState<'track' | 'leaderboard'>('track')

  const stages = useMemo(() => pipelines.flatMap(p => p.stages ?? []), [pipelines])

  const cars = useMemo<CarData[]>(() => {
    const scored = contacts.map(contact => {
      const { score, milestones } = scoreContact(contact, stages)
      return { contact, score, milestones }
    })

    scored.sort((a, b) => b.score - a.score)
    const n = scored.length
    const third = Math.ceil(n / 3)

    return scored.map((s, i) => {
      const lane = i < third ? 0 : i < third * 2 ? 1 : 2
      // Angle proportional to score within its current lap (0-32 maps to 0-360 within each lap)
      const angle = ((s.score % 32) / 32) * 360
      return { ...s, lane, angle }
    })
  }, [contacts, stages])

  const stats = useMemo(() => {
    const lap1 = cars.filter(c => c.score < 32).length
    const lap2 = cars.filter(c => c.score >= 32 && c.score < 64).length
    const lap3plus = cars.filter(c => c.score >= 64).length
    const avg = cars.length > 0 ? Math.round(cars.reduce((a, c) => a + c.score, 0) / cars.length) : 0
    return { total: cars.length, lap1, lap2, lap3plus, avg }
  }, [cars])

  return (
    <>
      <Topbar title="Race Track" />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🏁</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.4px' }}>Race Track</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>Every move counts. Watch your leads race to close.</p>
        </div>

        {/* Stats Bar */}
        <div className="stat-g" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          {[
            { l: 'Total Leads', v: String(stats.total), c: 'var(--t1)' },
            { l: 'On Lap 1', v: String(stats.lap1), c: '#f59e0b' },
            { l: 'On Lap 2', v: String(stats.lap2), c: 'var(--blue)' },
            { l: 'Lap 3+', v: String(stats.lap3plus), c: 'var(--green)' },
            { l: 'Avg Score', v: stats.avg + ' pts', c: 'var(--acc)' },
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="stat-l">{s.l}</div>
              <div className="stat-v" style={{ color: s.c, fontSize: 20 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex', gap: 0, background: 'var(--s3)',
          borderRadius: 'var(--r8)', padding: 3, width: 'fit-content', marginBottom: 18,
          border: '1px solid var(--br)',
        }}>
          {(['track', 'leaderboard'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--sans)',
                transition: 'all .12s',
                background: view === v ? 'var(--s1)' : 'transparent',
                color: view === v ? 'var(--t1)' : 'var(--t3)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
              }}
            >
              {v === 'track' ? '🏟️ Track View' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {/* Content */}
        {view === 'track' ? (
          <div className="card" style={{ padding: '20px' }}>
            {cars.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', fontSize: 13 }}>
                No contacts yet. Add leads to see them race!
              </div>
            ) : (
              <RaceTrackSVG cars={cars} />
            )}
          </div>
        ) : (
          <div>
            {cars.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', fontSize: 13 }}>
                No contacts yet. Add leads to see the leaderboard!
              </div>
            ) : (
              <LeaderboardView cars={[...cars].sort((a, b) => b.score - a.score)} />
            )}
          </div>
        )}

        {/* Footer scoring key */}
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.7 }}>
          Scoring: created (1) · call attempted (2) · call answered (4) · email given (5) · email opened (6) · meeting (8) · contract sent (10) · contract signed (15) · first payment (20) · full payment (25) · referrals (5 ea) · Max 96 pts · 1 Lap = 32 pts
        </div>
      </div>
    </>
  )
}
