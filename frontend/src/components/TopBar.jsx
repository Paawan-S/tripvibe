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

  const name = user?.user_metadata?.name || user?.email

  return (
    <header className="topbar">
      <span className="topbar-user">Hi, {name}</span>
      <button className="btn btn-ghost" onClick={handleLogout}>
        <LogOut size={16} /> Log out
      </button>
    </header>
  )
}