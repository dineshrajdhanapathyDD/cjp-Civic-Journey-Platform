import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  AlertCircle,
  Briefcase,
  Activity,
  Cloud,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: MessageSquare, label: 'Civic Agent' },
  { to: '/career', icon: Cloud, label: 'AWS Career Agent' },
  { to: '/issues', icon: AlertCircle, label: 'Civic Issues' },
  { to: '/jobs', icon: Briefcase, label: 'Opportunities' },
  { to: '/activity', icon: Activity, label: 'Agent Activity' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-civic-950 text-white flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-civic-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">CJP</h1>
              <p className="text-civic-400 text-[10px] mt-0.5 uppercase tracking-wider">
                Civic Journey Platform
              </p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-civic-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-civic-300 text-xs mt-2 leading-relaxed">
            From Citizen Voice to Accountable Action
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-civic-700/80 text-white font-medium shadow-sm'
                    : 'text-civic-200 hover:bg-civic-800/60 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Journey indicator */}
        <div className="px-4 py-3 border-t border-civic-800">
          <p className="text-[10px] text-civic-500 uppercase tracking-wider mb-2">CJP Journey</p>
          <div className="flex items-center gap-1 text-[10px] text-civic-400">
            <span>Report</span>
            <ChevronRight size={10} />
            <span>Understand</span>
            <ChevronRight size={10} />
            <span>Connect</span>
            <ChevronRight size={10} />
            <span>Act</span>
          </div>
        </div>

        <div className="p-4 border-t border-civic-800">
          <div className="text-[10px] text-civic-500">
            Powered by Strands + CockroachDB + Bedrock
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-600 hover:text-civic-600"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-civic-900">CJP</span>
          <span className="text-xs text-gray-400">Civic Journey Platform</span>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
