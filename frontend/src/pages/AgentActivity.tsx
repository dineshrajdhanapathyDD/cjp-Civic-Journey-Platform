import { useEffect, useState } from 'react'
import {
  Activity,
  Brain,
  Database,
  Search,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { getAgentActions } from '../services/api'

const toolMeta: Record<string, { icon: any; label: string; category: string }> = {
  search_civic_memory: { icon: Search, label: 'Civic Memory Search', category: 'Vector Search' },
  find_related_issues: { icon: Search, label: 'Related Issue Search', category: 'Vector Search' },
  create_civic_issue: { icon: Database, label: 'Create Issue', category: 'CockroachDB MCP' },
  update_issue: { icon: Database, label: 'Update Issue', category: 'CockroachDB MCP' },
  get_issue_context: { icon: Database, label: 'Retrieve Context', category: 'CockroachDB MCP' },
  record_evidence: { icon: Database, label: 'Record Evidence', category: 'CockroachDB MCP' },
  record_action: { icon: Database, label: 'Record Action', category: 'CockroachDB MCP' },
  find_job_opportunities: { icon: Briefcase, label: 'Job Search', category: 'Vector Search' },
  record_job_match: { icon: Briefcase, label: 'Job Match', category: 'CockroachDB MCP' },
  get_issue_timeline: { icon: Clock, label: 'Get Timeline', category: 'CockroachDB MCP' },
  add_timeline_event: { icon: Clock, label: 'Timeline Event', category: 'CockroachDB MCP' },
  civic_agent: { icon: Brain, label: 'Agent Processing', category: 'Strands Agent' },
}

const categoryColors: Record<string, string> = {
  'Strands Agent': 'bg-purple-100 text-purple-800',
  'CockroachDB MCP': 'bg-green-100 text-green-800',
  'Vector Search': 'bg-blue-100 text-blue-800',
}

export default function AgentActivity() {
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    getAgentActions()
      .then((res) => setActions(res.agent_actions))
      .catch(() => setActions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  // Group stats
  const stats = {
    total: actions.length,
    mcp: actions.filter(
      (a) => (toolMeta[a.tool_name]?.category || '') === 'CockroachDB MCP'
    ).length,
    vector: actions.filter(
      (a) => (toolMeta[a.tool_name]?.category || '') === 'Vector Search'
    ).length,
    agent: actions.filter(
      (a) => (toolMeta[a.tool_name]?.category || '') === 'Strands Agent'
    ).length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-civic-600" />
            Agent Activity
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time view of agent tool interactions with CockroachDB
          </p>
        </div>
        <button onClick={refresh} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Actions</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-green-600">{stats.mcp}</p>
          <p className="text-xs text-gray-500">MCP Operations</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-blue-600">{stats.vector}</p>
          <p className="text-xs text-gray-500">Vector Searches</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-purple-600">{stats.agent}</p>
          <p className="text-xs text-gray-500">Agent Reasoning</p>
        </div>
      </div>

      {/* Actions List */}
      {loading && actions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Loading activity...</div>
      ) : actions.length === 0 ? (
        <div className="text-center py-12">
          <Activity size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No agent activity yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Use the Civic Agent to see tool interactions here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => {
            const meta = toolMeta[action.tool_name] || {
              icon: AlertCircle,
              label: action.tool_name,
              category: 'Unknown',
            }
            const Icon = meta.icon
            const catColor = categoryColors[meta.category] || 'bg-gray-100 text-gray-800'

            return (
              <div
                key={action.id}
                className="card py-3 px-4 flex items-center gap-4"
              >
                <div
                  className={`p-2 rounded-lg ${
                    meta.category === 'Strands Agent'
                      ? 'bg-purple-50'
                      : meta.category === 'CockroachDB MCP'
                      ? 'bg-green-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      meta.category === 'Strands Agent'
                        ? 'text-purple-600'
                        : meta.category === 'CockroachDB MCP'
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className={`badge ${catColor}`}>{meta.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {action.action}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {action.status === 'completed' ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Clock size={14} className="text-yellow-500" />
                    )}
                    <span className="text-xs text-gray-400">
                      {action.duration_ms ? `${action.duration_ms}ms` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(action.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
