import { NavLink } from 'react-router-dom'
import { Compass, LayoutDashboard, Plus } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Compass size={22} /> TripVibe
      </div>
      <nav>
        <NavLink to="/dashboard" className="nav-link">
          <LayoutDashboard size={18} /> My Trips
        </NavLink>
        <NavLink to="/create" className="nav-link">
          <Plus size={18} /> New Trip
        </NavLink>
      </nav>
    </aside>
  )
}