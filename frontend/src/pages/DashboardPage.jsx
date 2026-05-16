import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI } from '../lib/api'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import { FolderKanban, FileText, TrendingUp, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    recentProjects: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await projectsAPI.getAll()
      const projects = response.data
      setStats({
        totalProjects: projects.length,
        recentProjects: projects.slice(0, 5),
      })
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    { name: 'Geotech Analysis', path: '/geotech', icon: '🏔️', color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' },
    { name: 'BOQ Generation', path: '/boq', icon: '📊', color: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
    { name: 'Structural Analysis', path: '/structural', icon: '🏗️', color: 'from-violet-500 to-fuchsia-400', shadow: 'shadow-violet-500/20' },
    { name: 'IS Code Assistant', path: '/iscode', icon: '📚', color: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
    { name: 'Tender Analysis', path: '/tender', icon: '📄', color: 'from-rose-500 to-pink-400', shadow: 'shadow-rose-500/20' },
    { name: 'Site Photo Analysis', path: '/site-photo', icon: '📷', color: 'from-indigo-500 to-blue-400', shadow: 'shadow-indigo-500/20' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4 animate-pulse-glow">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary-600 font-medium font-heading">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg">Welcome back to CivilAI Platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-primary-600', bg: 'bg-primary-50', delay: '0.2s' },
          { title: 'Documents', value: '-', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', delay: '0.3s' },
          { title: 'Analyses', value: '-', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', delay: '0.4s' },
          { title: 'Recent Activity', value: '-', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', delay: '0.5s' }
        ].map((stat, i) => (
          <Card key={i} className={`animate-slide-up transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`} style={{ animationDelay: stat.delay }}>
            <CardContent className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${stat.bg} shadow-inner`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        {/* AI Modules */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="text-2xl font-bold text-slate-800">AI Modules</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((module) => (
                <Link
                  key={module.path}
                  to={module.path}
                  className="group relative overflow-hidden p-5 border border-slate-200/60 rounded-2xl bg-white/50 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="flex flex-col gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg ${module.shadow} transform group-hover:scale-110 transition-transform duration-300`}>
                      {module.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{module.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">AI-powered tools</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Recent Projects</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-bold bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
              View All
            </Link>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {stats.recentProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FolderKanban className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No projects yet</p>
                <Link to="/projects" className="text-primary-600 text-sm font-semibold mt-2 hover:underline">Create your first project</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border border-slate-100 rounded-2xl bg-white/40 hover:bg-white hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors line-clamp-1">{project.name}</h3>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                        {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
