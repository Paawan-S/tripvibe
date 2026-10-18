import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Calendar, Check, Clock, Copy, Loader, MapPin, Moon, Navigation, Pencil,
  Printer, RefreshCw, Sparkles, Sun, Sunset, Trash2, Users, Wallet,
} from 'lucide-react'
import { tripsAPI } from '../services/api'
import EditTripPanel from '../components/EditTripPanel'
import { PACES, VIBES } from '../utils/options'
import { addDays, daysBetween, formatDate, inr } from '../utils/format'

const SLOT_ICONS = { morning: Sun, afternoon: Sunset, evening: Moon }

const QUICK_FEEDBACK = [
  'Make it more relaxed',
  'Add more local street food',
  'Keep it cheaper',
  'Add more adventure',
  'Start each day later',
  'Less travel between places',
]

function buildSummary(trip, itinerary) {
  const lines = [`${trip.title} (${formatDate(trip.start_date)} to ${formatDate(trip.end_date)})`]
  if (itinerary.summary) lines.push('', itinerary.summary)
  itinerary.days.forEach((day, i) => {
    lines.push('', `Day ${day.day} (${formatDate(addDays(trip.start_date, i))}): ${day.theme}`)
    day.activities.forEach((a) => lines.push(`- ${a.start_time} ${a.title} (${a.area})`))
  })
  lines.push('', 'Planned with TripVibe')
  return lines.join('\n')
}

export default function TripView() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState(0)

  const [showRegen, setShowRegen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [newStyle, setNewStyle] = useState('')
  const [newPace, setNewPace] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState('')

  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    tripsAPI
      .get(tripId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) return <p className="muted">Loading your trip…</p>
  if (error) {
    return (
      <div>
        <div className="error-box">{error}</div>
        <Link to="/dashboard" className="btn btn-ghost">Back to My Trips</Link>
      </div>
    )
  }
  if (!data) return null

  const { trip, itinerary } = data
  const days = itinerary?.days ?? []
  const totalCost = days.reduce((sum, d) => sum + (Number(d.estimated_day_cost) || 0), 0)
  const vibe = VIBES.find((v) => v.id === trip.travel_style)
  const vibeLabel = vibe?.label || trip.travel_style
  const coverClass = `cover-${vibe ? vibe.id : 'default'}`
  const nDays = daysBetween(trip.start_date, trip.end_date)
  const interests = trip.interests || []
  const dietary = trip.dietary_restrictions || []

  function addFeedback(text) {
    setFeedback((f) => (f ? `${f}. ${text}` : text))
  }

  function handleSaved(updatedTrip, affectsPlan) {
    setData((current) => ({ ...current, trip: updatedTrip }))
    setEditing(false)
    setNotice(
      affectsPlan
        ? 'Details saved. The itinerary below still shows the old plan, so regenerate it to match your changes.'
        : 'Trip name saved.',
    )
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenError('')
    try {
      const body = {}
      if (feedback.trim()) body.feedback = feedback.trim()
      if (newStyle && newStyle !== trip.travel_style) body.travel_style = newStyle
      if (newPace && newPace !== trip.pace) body.pace = newPace

      const result = await tripsAPI.regenerate(tripId, body)
      setData(result)
      setActiveDay(0)
      setShowRegen(false)
      setFeedback('')
      setNewStyle('')
      setNewPace('')
      setNotice('')
    } catch (err) {
      setRegenError(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildSummary(trip, itinerary))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.alert('Could not copy. Your browser blocked clipboard access.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this trip and all its versions? This cannot be undone.')) return
    setDeleting(true)
    try {
      await tripsAPI.remove(tripId)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div>
      {/* ---------- Header ---------- */}
      <div className="card trip-hero">
        <div className={`hero-band ${coverClass}`} />
        <div className="trip-hero-top">
          <div>
            <div className="hero-title-row">
              <h1>{trip.title}</h1>
              {itinerary && <span className="badge badge-primary">Version {itinerary.version}</span>}
            </div>
            <div className="meta-row">
              <p className="meta"><MapPin size={14} /> {trip.destination}</p>
              <p className="meta">
                <Calendar size={14} /> {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
              </p>
            </div>
          </div>
          <div className="hero-actions no-print">
            <button className="btn btn-ghost" onClick={() => setEditing((e) => !e)}>
              <Pencil size={16} /> {editing ? 'Close editor' : 'Edit details'}
            </button>
            {itinerary && (
              <>
                <button className="btn btn-ghost" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy summary'}
                </button>
                <button className="btn btn-ghost" onClick={() => window.print()}>
                  <Printer size={16} /> Download PDF
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-danger" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {itinerary?.summary && <p className="summary">{itinerary.summary}</p>}
      </div>

      {notice && (
        <div className="info-box notice no-print">
          <span>{notice}</span>
          {notice.includes('regenerate') && (
            <button className="btn btn-primary" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? (
                <>
                  <Loader size={16} className="spin" /> Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Regenerate now
                </>
              )}
            </button>
          )}
        </div>
      )}

      {editing && (
        <EditTripPanel
          trip={trip}
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* ---------- Refine / regenerate ---------- */}
      <div className="card regen no-print">
        <div className="regen-bar">
          <div>
            <strong>Want changes?</strong>
            <p className="muted" style={{ margin: 0 }}>
              Give feedback or switch the vibe. Each regenerate is saved as a new version.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowRegen((s) => !s)}>
            <RefreshCw size={16} /> {showRegen ? 'Close' : itinerary ? 'Refine or regenerate' : 'Generate itinerary'}
          </button>
        </div>

        {showRegen && (
          <div className="regen-body">
            <div className="chip-row">
              {QUICK_FEEDBACK.map((q) => (
                <button type="button" key={q} className="chip" onClick={() => addFeedback(q)}>
                  {q}
                </button>
              ))}
            </div>

            <div className="field">
              <label htmlFor="feedback">Your feedback</label>
              <textarea
                id="feedback"
                rows={3}
                placeholder="e.g. Make day 2 more relaxed and add a sunset spot"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="style">Vibe</label>
                <select id="style" value={newStyle} onChange={(e) => setNewStyle(e.target.value)}>
                  <option value="">Keep current ({vibeLabel})</option>
                  {VIBES.filter((v) => v.id !== trip.travel_style).map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pace">Pace</label>
                <select id="pace" value={newPace} onChange={(e) => setNewPace(e.target.value)}>
                  <option value="">Keep current ({trip.pace})</option>
                  {PACES.filter((p) => p.id !== trip.pace).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {regenError && <div className="error-box">{regenError}</div>}

            <button className="btn btn-primary" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? (
                <>
                  <Loader size={16} className="spin" /> Regenerating… (10 to 40 seconds)
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Regenerate
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ---------- Summary column + days ---------- */}
      <div className="trip-layout">
        <aside className="trip-side">
          <div className="card side-card">
            <ul className="facts">
              <li>
                <div className="fact-icon fi-blue"><Calendar size={18} /></div>
                <div>
                  <small>Duration</small>
                  <strong>{formatDate(trip.start_date)} to {formatDate(trip.end_date)}</strong>
                  {nDays > 0 && <em>{nDays} day{nDays > 1 ? 's' : ''}</em>}
                </div>
              </li>
              <li>
                <div className="fact-icon fi-mint"><Users size={18} /></div>
                <div>
                  <small>Travelers</small>
                  <strong>{trip.group_size} {trip.group_size === 1 ? 'traveler' : 'travelers'}</strong>
                </div>
              </li>
              <li>
                <div className="fact-icon fi-amber"><Sparkles size={18} /></div>
                <div>
                  <small>Style &amp; pace</small>
                  <strong className="cap">{vibeLabel} · {trip.pace} pace</strong>
                </div>
              </li>
              <li>
                <div className="fact-icon fi-rose"><Wallet size={18} /></div>
                <div>
                  <small>Budget</small>
                  <strong>{inr(trip.budget_per_day)}</strong>
                  <em>per person per day</em>
                </div>
              </li>
            </ul>
          </div>

          {(interests.length > 0 || dietary.length > 0 || trip.mobility_concerns) && (
            <div className="card side-card">
              {interests.length > 0 && (
                <>
                  <h4 className="side-title">Core interests</h4>
                  <div className="tag-row">
                    {interests.map((item) => (
                      <span key={item} className="tag">{item}</span>
                    ))}
                  </div>
                </>
              )}
              {dietary.length > 0 && (
                <>
                  <h4 className="side-title">Dietary needs</h4>
                  <div className="tag-row">
                    {dietary.map((item) => (
                      <span key={item} className="tag">{item}</span>
                    ))}
                  </div>
                </>
              )}
              {trip.mobility_concerns && (
                <>
                  <h4 className="side-title">Mobility</h4>
                  <p className="muted small" style={{ margin: 0 }}>{trip.mobility_concerns}</p>
                </>
              )}
            </div>
          )}

          {itinerary && (
            <div className="total-card">
              <span className="total-label">Estimated cost</span>
              <strong>{inr(totalCost)}</strong>
              <span className="total-note">
                Per person, all {days.length} day{days.length > 1 ? 's' : ''}. Activities, food and
                local transport.
              </span>
            </div>
          )}
        </aside>

        <div className="trip-main">
          {days.length > 0 && (
            <div className="tabs no-print">
              {days.map((day, i) => (
                <button
                  key={day.day}
                  className={`tab ${i === activeDay ? 'active' : ''}`}
                  onClick={() => setActiveDay(i)}
                >
                  Day {day.day}
                  <small>{formatDate(addDays(trip.start_date, i))}</small>
                </button>
              ))}
            </div>
          )}

          {days.map((day, i) => (
            <section
              key={day.day}
              className={`day-panel ${i === activeDay ? 'active' : 'inactive'}`}
            >
              {day.image_url && (
                <div className="day-hero">
                  <img src={day.image_url} alt={`${trip.destination}: ${day.theme}`} loading="lazy" />
                  {day.image_credit && (
                    <span className="credit">
                      Photo by{' '}
                      <a href={day.image_credit_url} target="_blank" rel="noreferrer">
                        {day.image_credit}
                      </a>{' '}
                      on{' '}
                      <a
                        href="https://unsplash.com/?utm_source=tripvibe&utm_medium=referral"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Unsplash
                      </a>
                    </span>
                  )}
                </div>
              )}

              <div className="day-head">
                <div className="day-title">
                  <div className="day-num">{String(day.day).padStart(2, '0')}</div>
                  <div>
                    <h2>{day.theme}</h2>
                    <p className="muted" style={{ margin: 0 }}>
                      Day {day.day} · {formatDate(addDays(trip.start_date, i))}
                    </p>
                  </div>
                </div>
                <div className="day-cost">
                  {inr(day.estimated_day_cost)}
                  <span>per person</span>
                  <span>of {inr(trip.budget_per_day)} daily budget</span>
                </div>
              </div>

              <ol className="timeline">
                {day.activities.map((a, j) => {
                  const Icon = SLOT_ICONS[a.time_slot] || Clock
                  return (
                    <li key={j} className="activity">
                      <div className="a-time">
                        <div className={`slot-bubble slot-${a.time_slot}`}>
                          <Icon size={18} />
                        </div>
                        <strong>{a.start_time}</strong>
                        <span>{a.time_slot}</span>
                      </div>
                      <div className="a-body">
                        <div className="a-top">
                          <h3>{a.title}</h3>
                          <span className="tag">{a.category}</span>
                        </div>
                        <p>{a.description}</p>
                        <div className="a-meta">
                          <span><MapPin size={13} /> {a.area}</span>
                          <span><Clock size={13} /> {a.duration_minutes} min</span>
                          <span>{inr(a.estimated_cost)}</span>
                          {a.travel_time_minutes > 0 && (
                            <span><Navigation size={13} /> {a.travel_time_minutes} min travel</span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}