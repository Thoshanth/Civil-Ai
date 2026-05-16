import { useAuthStore } from '../../store/authStore'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-20 glass-panel border-b border-white/40 flex items-center justify-between px-8 m-4 mb-0 z-10 sticky top-0">
      <div className="flex-1" />
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-slate-700 bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-1.5 rounded-full text-white shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-wide">{user?.name || user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium group"
        >
          <span>Logout</span>
          <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </header>
  )
}
