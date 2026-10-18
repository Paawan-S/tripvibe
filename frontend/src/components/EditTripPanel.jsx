import { useState } from 'react'
import { Loader, Save } from 'lucide-react'
import { tripsAPI } from '../services/api'
import { DIETARY, INTERESTS, PACES, VIBES } from '../utils/options'
import { daysBetween } from '../utils/format'

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function sameList(a, b) {
  const x = [...(a || [])].sort()
  const y = [...(b || [])].sort()
  return x.length === y.length && x.every((v, i) => v === y[i])
}

export default function EditTripPanel({ trip, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: trip.title || '',
    destination: trip.destination || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    group_size: trip.group_size ?? 1,
    budget_per_day: trip.budget_per_day ?? 3000,
    travel_style: trip.travel_style || 'cultural',
    pace: trip.pace || 'moderate',
    interests: trip.interests || [],
    dietary: trip.dietary_restrictions || [],
    mobility: trip.mobility_concerns || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const interestOptions = [...new Set([...INTERESTS, ...(trip.interests || [])])]
  const dietaryOptions = [...new Set([...DIETARY, ...(trip.dietary_restrictions || [])])]

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    if (!form.title.trim()) return 'Give the trip a name'
    if (form.destination.trim().length < 2) return 'Enter a destination'
    if (!form.start_date || !form.end_date) return 'Pick both dates'
    if (form.end_date < form.start_date) return 'The end date must be on or after the start date'
    if (daysBetween(form.start_date, form.end_date) > 10) return 'Trips can be at most 10 days'
    const size = Number(form.group_size)
    if (!Number.isInteger(size) || size < 1 || size > 20) return 'Group size must be between 1 and 20'
    if (!(Number(form.budget_per_day) > 0)) return 'Enter a daily budget greater than 0'
    return ''
  }

  // Compare with the saved trip and keep only what changed
  function buildChanges() {
    const changes = {}
    if (form.title.trim() !== trip.title) changes.title = form.title.trim()
    if (form.destination.trim() !== trip.destination) changes.destination = form.destination.trim()
    if (form.start_date !== trip.start_date) changes.start_date = form.start_date
    if (form.end_date !== trip.end_date) changes.end_date = form.end_date
    if (Number(form.group_size) !== trip.group_size) changes.group_size = Number(form.group_size)
    if (Number(form.budget_per_day) !== Number(trip.budget_per_day)) {
      changes.budget_per_day = Number(form.budget_per_day)
    }
    if (form.travel_style !== trip.travel_style) changes.travel_style = form.travel_style
    if (form.pace !== trip.pace) changes.pace = form.pace
    if (!sameList(form.interests, trip.interests)) changes.interests = form.interests
    if (!sameList(form.dietary, trip.dietary_restrictions)) {
      changes.dietary_restrictions = form.dietary.length ? form.dietary : null
    }
    if (form.mobility.trim() !== (trip.mobility_concerns || '')) {
      changes.mobility_concerns = form.mobility.trim() || null
    }
    return changes
  }

  async function save() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    const changes = buildChanges()
    if (Object.keys(changes).length === 0) {
      setError('Nothing has changed yet.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await tripsAPI.update(trip.id, changes)
      // Only a new name leaves the itinerary valid. Anything else makes it out of date.
      const affectsPlan = Object.keys(changes).some((key) => key !== 'title')
      onSaved(updated, affectsPlan)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="card edit-panel no-print">
      <h2>Edit trip details</h2>
      <p className="muted">Change anything below. You can regenerate the itinerary afterwards.</p>

      <div className="field">
        <label htmlFor="e-title">Trip name</label>
        <input id="e-title" value={form.title} onChange={(e) => update('title', e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="e-dest">Destination</label>
        <input
          id="e-dest"
          value={form.destination}
          onChange={(e) => update('destination', e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="e-start">Start date</label>
          <input
            id="e-start"
            type="date"
            value={form.start_date}
            onChange={(e) => update('start_date', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="e-end">End date</label>
          <input
            id="e-end"
            type="date"
            min={form.start_date}
            value={form.end_date}
            onChange={(e) => update('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="e-group">Travelers</label>
          <input
            id="e-group"
            type="number"
            min="1"
            max="20"
            value={form.group_size}
            onChange={(e) => update('group_size', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="e-budget">Budget per person per day (₹)</label>
          <input
            id="e-budget"
            type="number"
            min="1"
            step="100"
            value={form.budget_per_day}
            onChange={(e) => update('budget_per_day', e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="e-style">Vibe</label>
          <select
            id="e-style"
            value={form.travel_style}
            onChange={(e) => update('travel_style', e.target.value)}
          >
            {VIBES.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="e-pace">Pace</label>
          <select id="e-pace" value={form.pace} onChange={(e) => update('pace', e.target.value)}>
            {PACES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="section-title">Interests</p>
      <div className="chip-row">
        {interestOptions.map((item) => (
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

      <p className="section-title">Dietary needs</p>
      <div className="chip-row">
        {dietaryOptions.map((item) => (
          <button
            type="button"
            key={item}
            className={`chip ${form.dietary.includes(item) ? 'active' : ''}`}
            onClick={() => update('dietary', toggle(form.dietary, item))}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="e-mob">Mobility needs</label>
        <input
          id="e-mob"
          placeholder="e.g. avoid long walks and stairs"
          value={form.mobility}
          onChange={(e) => update('mobility', e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="edit-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader size={16} className="spin" /> : <Save size={16} />} Save changes
        </button>
      </div>
    </div>
  )
}