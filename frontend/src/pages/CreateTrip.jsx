import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Calendar, Check, Loader, MapPin, Sparkles, Users, Wallet,
} from 'lucide-react'
import { tripsAPI } from '../services/api'
import { DIETARY, INTERESTS, PACES, VIBES } from '../utils/options'
import { daysBetween, inr } from '../utils/format'

const STEPS = ['Your vibe', 'Where & when', 'Final details']

const STEP_INFO = [
  { title: 'What kind of trip?', sub: 'Pick a vibe, pace and budget. The AI plans around them.' },
  { title: 'Where and when', sub: 'Choose a destination, or let TripVibe suggest one.' },
  { title: 'Final touches', sub: 'Anything the plan should respect? Then generate.' },
]

const LOADING_MESSAGES = [
  'Finding the best spots…',
  'Grouping places that are close together…',
  'Planning your route day by day…',
  'Checking costs against your budget…',
  'Adding photos…',
]

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function CreateTrip() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    travel_style: 'cultural',
    interests: [],
    group_size: 2,
    pace: 'moderate',
    budget_per_day: 3000,
    dietary_restrictions: [],
    mobility_concerns: '',
  })
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  const [recs, setRecs] = useState([])
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const days = daysBetween(form.start_date, form.end_date)
  const vibeLabel = VIBES.find((v) => v.id === form.travel_style)?.label

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Rotate the loading message while the AI works
  useEffect(() => {
    if (!generating) return
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [generating])

  function validate(s) {
    if (s === 0) {
      if (!(Number(form.budget_per_day) > 0)) return 'Enter a daily budget greater than 0'
    }
    if (s === 1) {
      if (form.destination.trim().length < 2) {
        return 'Enter a destination, or tap "Not sure? Suggest"'
      }
      if (!form.start_date || !form.end_date) return 'Pick your start and end dates'
      if (form.end_date < form.start_date) return 'The end date must be on or after the start date'
      if (days > 10) return 'Trips can be at most 10 days'
      const size = Number(form.group_size)
      if (!Number.isInteger(size) || size < 1 || size > 20) return 'Group size must be between 1 and 20'
    }
    return ''
  }

  function next() {
    const problem = validate(step)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setStep(step + 1)
  }

  function back() {
    setError('')
    setStep(step - 1)
  }

  async function suggest() {
    setRecLoading(true)
    setRecError('')
    setRecs([])
    try {
      const res = await tripsAPI.recommend({
        travel_style: form.travel_style,
        interests: form.interests,
        budget_per_day: Number(form.budget_per_day) || 3000,
        duration_days: days >= 1 && days <= 10 ? days : 3,
        group_size: Number(form.group_size) || 1,
      })
      setRecs(res.destinations)
    } catch (err) {
      setRecError(err.message)
    } finally {
      setRecLoading(false)
    }
  }

  async function generate() {
    const problem = validate(0) || validate(1)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setMsgIndex(0)
    setGenerating(true)

    const payload = {
      title: form.title.trim() || undefined,
      destination: form.destination.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      travel_style: form.travel_style,
      interests: form.interests,
      group_size: Number(form.group_size),
      pace: form.pace,
      budget_per_day: Number(form.budget_per_day),
      dietary_restrictions: form.dietary_restrictions.length ? form.dietary_restrictions : null,
      mobility_concerns: form.mobility_concerns.trim() || null,
    }

    try {
      const data = await tripsAPI.create(payload)
      navigate(`/trips/${data.trip.id}`)
    } catch (err) {
      setError(err.message)
      setGenerating(false)
    }
  }

  return (
    <div className="create-wrap">
      <div className="page-header">
        <div>
          <span className="eyebrow">New trip</span>
          <h1>Plan a new trip</h1>
          <p className="muted">Answer a few questions and the AI builds your day-by-day plan.</p>
        </div>
      </div>

      <div className="stepper">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`step ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
          >
            <span className="step-dot">{i < step ? <Check size={16} /> : i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <div className="step-head">
              <h2>{STEP_INFO[step].title}</h2>
              <p className="muted">{STEP_INFO[step].sub}</p>
            </div>

            {step === 0 && (
              <div>
                <p className="section-title">Travel vibe</p>
                <div className="vibe-grid">
                  {VIBES.map((v) => {
                    const Icon = v.icon
                    return (
                      <button
                        type="button"
                        key={v.id}
                        className={`vibe-card ${form.travel_style === v.id ? 'active' : ''}`}
                        onClick={() => update('travel_style', v.id)}
                      >
                        <span className="vibe-icon">
                          <Icon size={20} />
                        </span>
                        <strong>{v.label}</strong>
                        <span>{v.hint}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="section-title">Pace</p>
                <div className="chip-row">
                  {PACES.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`chip ${form.pace === p.id ? 'active' : ''}`}
                      onClick={() => update('pace', p.id)}
                    >
                      {p.label} · {p.hint}
                    </button>
                  ))}
                </div>

                <p className="section-title">Interests (pick any)</p>
                <div className="chip-row">
                  {INTERESTS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`chip ${form.interests.includes(item) ? 'active' : ''}`}
                      onClick={() => update('interests', toggle(form.interests, item))}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="field">
                  <label htmlFor="budget">Budget per person per day (₹)</label>
                  <div className="input-icon">
                    <Wallet size={18} />
                    <input
                      id="budget"
                      type="number"
                      min="1"
                      step="100"
                      value={form.budget_per_day}
                      onChange={(e) => update('budget_per_day', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="field">
                  <label htmlFor="destination">Destination</label>
                  <div className="input-row">
                    <div className="input-icon">
                      <MapPin size={18} />
                      <input
                        id="destination"
                        placeholder="e.g. Goa, Jaipur, Bali"
                        value={form.destination}
                        onChange={(e) => update('destination', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={suggest}
                      disabled={recLoading}
                    >
                      {recLoading ? <Loader size={16} className="spin" /> : <Sparkles size={16} />}
                      Not sure? Suggest
                    </button>
                  </div>
                </div>

                {recError && <div className="error-box">{recError}</div>}
                {recLoading && <p className="muted">Finding destinations that match your vibe…</p>}

                {recs.length > 0 && (
                  <div className="rec-grid">
                    {recs.map((r) => {
                      const value = `${r.name}, ${r.country}`
                      return (
                        <button
                          type="button"
                          key={value}
                          className={`rec-card ${form.destination === value ? 'active' : ''}`}
                          onClick={() => update('destination', value)}
                        >
                          <div className="rec-top">
                            <strong>{r.name}</strong>
                            <span className="muted">{r.country}</span>
                          </div>
                          <p>{r.why}</p>
                          <div className="rec-foot">
                            {r.best_for.map((tag) => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                            <span className="muted">≈ {inr(r.estimated_budget_per_day)} / day</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="start">Start date</label>
                    <div className="input-icon">
                      <Calendar size={18} />
                      <input
                        id="start"
                        type="date"
                        min={today}
                        value={form.start_date}
                        onChange={(e) => update('start_date', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="end">End date</label>
                    <div className="input-icon">
                      <Calendar size={18} />
                      <input
                        id="end"
                        type="date"
                        min={form.start_date || today}
                        value={form.end_date}
                        onChange={(e) => update('end_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {days > 0 && (
                  <p className="muted">
                    {days} day{days > 1 ? 's' : ''}
                  </p>
                )}

                <div className="field">
                  <label htmlFor="group">Number of travelers</label>
                  <div className="input-icon">
                    <Users size={18} />
                    <input
                      id="group"
                      type="number"
                      min="1"
                      max="20"
                      value={form.group_size}
                      onChange={(e) => update('group_size', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="section-title">Dietary needs (optional)</p>
                <div className="chip-row">
                  {DIETARY.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`chip ${form.dietary_restrictions.includes(item) ? 'active' : ''}`}
                      onClick={() =>
                        update('dietary_restrictions', toggle(form.dietary_restrictions, item))
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="field">
                  <label htmlFor="mobility">Mobility needs (optional)</label>
                  <input
                    id="mobility"
                    placeholder="e.g. travelling with a senior, avoid long walks and stairs"
                    value={form.mobility_concerns}
                    onChange={(e) => update('mobility_concerns', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="title">Trip name (optional)</label>
                  <input
                    id="title"
                    placeholder={`Trip to ${form.destination || 'your destination'}`}
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                  />
                </div>

                <div className="review">
                  <p className="review-title">Your trip at a glance</p>
                  <p>
                    <strong>{form.destination || '-'}</strong> · {days || '?'} day{days === 1 ? '' : 's'} ·{' '}
                    {form.group_size} traveler(s)
                  </p>
                  <p className="muted">
                    {vibeLabel} vibe · {form.pace} pace · {inr(form.budget_per_day)} per person per day
                  </p>
                  {form.interests.length > 0 && (
                    <p className="muted">Interests: {form.interests.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <div className="error-box">{error}</div>}

        <div className="actions-row">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={back}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={generate} disabled={generating}>
              <Sparkles size={16} /> Generate my itinerary
            </button>
          )}
        </div>
      </div>

      {generating && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="spin-ring">
              <Loader size={34} className="spin" />
            </div>
            <h2>Planning your trip…</h2>
            <p className="muted">{LOADING_MESSAGES[msgIndex]}</p>
            <p className="muted small">
              This usually takes 10 to 30 seconds. If the server was asleep, the first try can take
              up to a minute.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}