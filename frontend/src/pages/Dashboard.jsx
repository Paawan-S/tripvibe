import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Plus } from 'lucide-react'
import { tripsAPI } from '../services/api'

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Trips</h1>
          <p className="muted">Your saved itineraries</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Plus size={16} /> New trip
        </Link>
      </div>

      {loading && <p className="muted">Loading your trips…</p>}
      {error && <div className="error-box">{error}</div>}

      {!loading && !error && trips.length === 0 && (
        <div className="card empty">
          <h3>No trips yet</h3>
          <p className="muted">Create your first AI-planned trip.</p>
        </div>
      )}

      <div className="trip-grid">
        {trips.map((trip) => (
          <Link key={trip.id} to={`/trips/${trip.id}`} className="card trip-card">
            <h3>{trip.title}</h3>
            <p className="meta">
              <MapPin size={14} /> {trip.destination}
            </p>
            <p className="meta">
              <Calendar size={14} /> {trip.start_date} to {trip.end_date}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}