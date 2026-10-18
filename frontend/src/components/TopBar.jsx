import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const name = user?.user_metadata?.name || user?.email || ''
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <header className="topbar">
      <div className="topbar-greet">
        <span className="topbar-hello">Welcome back</span>
        <strong className="topbar-user">{name}</strong>
      </div>
      <div className="topbar-right">
        <span className="avatar">{initial}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </header>
  )
}