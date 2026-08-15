import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  AlertCircle,
  Briefcase,
  Activity,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: MessageSquare, label: 'Civic Agent' },
  { to: '/issues', icon: AlertCircle, label: 'Issues' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/activity', icon: Activity, label: 'Agent Activity' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-civic-950 text-white flex flex-col">
        <div className="p-6 border-b border-civic-800">
          <h1 className="text-xl font-bold">CJP</h1>
          <p className="text-civic-300 text-xs mt-1">
            From Citizen Voice to Accountable Action
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-civic-700 text-white'
                    : 'text-civic-200 hover:bg-civic-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-civic-800">
          <div className="text-xs text-civic-400">
            Powered by Strands + CockroachDB
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
