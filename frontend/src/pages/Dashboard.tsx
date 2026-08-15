import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  FileText,
  Briefcase,
  Activity,
  TrendingUp,
  Users,
  Shield,
  Brain,
} from 'lucide-react'
import { getDashboardStats } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      label: 'Active Issues',
      value: stats?.open_issues ?? '-',
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Citizen Reports',
      value: stats?.total_reports ?? '-',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Job Opportunities',
      value: stats?.total_jobs ?? '-',
      icon: Briefcase,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Agent Actions',
      value: stats?.total_agent_actions ?? '-',
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Civic Journey Platform
        </h1>
        <p className="text-gray-500 mt-1">
          From Citizen Voice to Accountable Action
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-4">
              <div className={`${bg} p-3 rounded-lg`}>
                <Icon size={22} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain size={20} className="text-civic-600" />
            System Architecture
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Brain size={18} className="text-purple-600" />
              <div>
                <p className="text-sm font-medium">Strands Agent</p>
                <p className="text-xs text-gray-500">AI reasoning and orchestration via Amazon Bedrock</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield size={18} className="text-green-600" />
              <div>
                <p className="text-sm font-medium">CockroachDB MCP Server</p>
                <p className="text-xs text-gray-500">Agent-to-database bridge for persistent memory</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <TrendingUp size={18} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium">Distributed Vector Indexing</p>
                <p className="text-xs text-gray-500">Semantic search across issues, reports, and jobs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users size={18} className="text-orange-600" />
              <div>
                <p className="text-sm font-medium">CockroachDB Agent Skills</p>
                <p className="text-xs text-gray-500">Reusable database capabilities for the agent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-civic-600" />
            Issues by Category
          </h2>
          {stats?.issues_by_category?.length ? (
            <div className="space-y-2">
              {stats.issues_by_category.map((cat: any) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium capitalize">
                    {cat.category}
                  </span>
                  <span className="badge bg-civic-100 text-civic-800">
                    {cat.cnt}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No issues yet. Use the Civic Agent to report concerns.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/agent" className="btn-primary">
            Report a Concern
          </Link>
          <Link to="/issues" className="btn-secondary">
            View Issues
          </Link>
          <Link to="/jobs" className="btn-secondary">
            Browse Opportunities
          </Link>
          <Link to="/activity" className="btn-secondary">
            Agent Activity
          </Link>
        </div>
      </div>
    </div>
  )
}
