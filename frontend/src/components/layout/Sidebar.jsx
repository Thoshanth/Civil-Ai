import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Mountain, 
  FileSpreadsheet, 
  BookOpen, 
  Building2, 
  FileText, 
  Camera 
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/geotech', icon: Mountain, label: 'Geotech Analysis' },
  { to: '/boq', icon: FileSpreadsheet, label: 'BOQ Gen' },
  { to: '/structural', icon: Building2, label: 'Structural' },
  { to: '/iscode', icon: BookOpen, label: 'IS Code Asst' },
  { to: '/tender', icon: FileText, label: 'Tender Analysis' },
  { to: '/site-photo', icon: Camera, label: 'Site Photo' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 glass-panel border-r border-white/40 m-4 rounded-3xl overflow-hidden flex flex-col z-20">
      <div className="h-20 flex items-center justify-center px-6 border-b border-white/20 bg-white/40">
        <h1 className="text-2xl font-heading font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
          CivilAI
        </h1>
      </div>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-700 shadow-sm border border-primary-100/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-primary-600 hover:shadow-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-gradient-to-b from-primary-500 to-secondary-500 transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50 opacity-50'}`} />
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-semibold tracking-wide text-[15px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-white/20 bg-gradient-to-t from-white/40 to-transparent">
        <div className="text-xs text-center font-medium text-slate-400">
          v2.0 Premium
        </div>
      </div>
    </aside>
  )
}
