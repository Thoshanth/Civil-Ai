import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-transparent">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 z-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
