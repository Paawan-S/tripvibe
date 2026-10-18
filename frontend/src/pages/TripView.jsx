import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Calendar, Check, Clock, Copy, Loader, MapPin, Moon,
  Navigation, Printer, RefreshCw, Sun, Sunset, Trash2, Users,
} from 'lucide-react'
import { tripsAPI } from '../services/api'
import { PACES, VIBES } from '../utils/options'
import { addDays, formatDate, inr } from '../utils/format'

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
  const vibeLabel = VIBES.find((v) => v.id === trip.travel_style)?.label || trip.travel_style

  function addFeedback(text) {
    setFeedback((f) => (f ? `${f}. ${text}` : text))
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
      <div className="card trip-hero">
        <div className="trip-hero-top">
          <div>
            <h1>{trip.title}</h1>
            <p className="meta"><MapPin size={14} /> {trip.destination}</p>
            <p className="meta">
              <Calendar size={14} /> {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
            </p>
          </div>
          <div className="hero-actions no-print">
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

        <div className="badges">
          <span className="badge">{vibeLabel}</span>
          <span className="badge">{trip.pace} pace</span>
          <span className="badge"><Users size={12} /> {trip.group_size}</span>
          <span className="badge">{inr(trip.budget_per_day)} / day</span>
          {itinerary && <span className="badge badge-primary">Version {itinerary.version}</span>}
        </div>

        {itinerary?.summary && <p className="summary">{itinerary.summary}</p>}
        {itinerary && (
          <p className="muted">Estimated cost of activities: {inr(totalCost)} per person</p>
        )}
      </div>

      <div className="card regen no-print">
        <button className="btn btn-primary" onClick={() => setShowRegen((s) => !s)}>
          <RefreshCw size={16} /> {showRegen ? 'Close' : itinerary ? 'Refine or regenerate' : 'Generate itinerary'}
        </button>

        {showRegen && (
          <div className="regen-body">
            <p className="muted">
              Tell the AI what to change. It keeps what still fits and saves the result as a new
              version.
            </p>
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
            <div>
              <h2>Day {day.day}: {day.theme}</h2>
              <p className="muted">{formatDate(addDays(trip.start_date, i))}</p>
            </div>
            <div className="day-cost">
              {inr(day.estimated_day_cost)}
              <span>per person</span>
            </div>
          </div>

          <ol className="timeline">
            {day.activities.map((a, j) => {
              const Icon = SLOT_ICONS[a.time_slot] || Clock
              return (
                <li key={j} className="activity">
                  <div className="a-time">
                    <Icon size={16} />
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
  )
}