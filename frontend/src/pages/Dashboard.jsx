import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Compass, MapPin, Plus, Users } from 'lucide-react'
import { tripsAPI } from '../services/api'
import { VIBES } from '../utils/options'
import { daysBetween, formatDate, inr } from '../utils/format'

function TripCard({ trip }) {
  const vibe = VIBES.find((v) => v.id === trip.travel_style)
  const Icon = vibe?.icon || Compass
  const days = daysBetween(trip.start_date, trip.end_date)

  return (
    <Link to={`/trips/${trip.id}`} className="trip-card">
      <div className={`trip-cover cover-${vibe ? vibe.id : 'default'}`}>
        <Icon size={56} strokeWidth={1.4} className="cover-icon" />
        <span className="cover-pill">
          {vibe?.label || 'Custom'} · {trip.pace}
        </span>
        {days > 0 && (
          <span className="cover-days">
            {days} day{days > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="trip-body">
        <h3>{trip.title}</h3>
        <p className="meta">
          <MapPin size={14} /> {trip.destination}
        </p>
        <p className="meta">
          <Calendar size={14} /> {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
        </p>
        <div className="trip-foot">
          <span className="meta">
            <Users size={14} /> {trip.group_size}
          </span>
          <span className="trip-budget">
            {inr(trip.budget_per_day)}
            <small> / day</small>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tripsAPI
      .list()
      .then(setTrips)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const subtitle =
    !loading && trips.length > 0
      ? `${trips.length} saved trip${trips.length > 1 ? 's' : ''}`
      : 'Your saved itineraries'

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>My Trips</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Plus size={16} /> New trip
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <>
          <div className="trip-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skel-cover" />
                <div className="skeleton skel-line" />
                <div className="skeleton skel-line short" />
                <div className="skeleton skel-line" />
              </div>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 14 }}>
            Loading your trips. The first load can take up to a minute while the free server wakes
            up.
          </p>
        </>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">
            <Compass size={32} />
          </span>
          <h3>No trips yet</h3>
          <p className="muted">
            Tell TripVibe your vibe, budget and dates, and get your first day-by-day plan.
          </p>
          <Link to="/create" className="btn btn-primary">
            <Plus size={16} /> Plan your first trip
          </Link>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <div className="trip-grid">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}