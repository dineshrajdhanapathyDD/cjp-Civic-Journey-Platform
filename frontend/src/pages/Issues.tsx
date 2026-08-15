import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, ChevronRight, Filter } from 'lucide-react'
import { getIssues } from '../services/api'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default function Issues() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    getIssues(statusFilter || undefined, categoryFilter || undefined)
      .then((res) => setIssues(res.issues))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [statusFilter, categoryFilter])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Civic Issues</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consolidated issues from citizen reports
          </p>
        </div>
        <Link to="/agent" className="btn-primary">
          Report New Concern
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter size={16} className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Categories</option>
          <option value="employment">Employment</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="education">Education</option>
          <option value="healthcare">Healthcare</option>
          <option value="environment">Environment</option>
          <option value="safety">Safety</option>
          <option value="transportation">Transportation</option>
        </select>
      </div>

      {/* Issue List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No issues found.</p>
          <Link to="/agent" className="text-civic-600 text-sm hover:underline mt-2 inline-block">
            Use the Civic Agent to report a concern
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate">
                    {issue.title}
                  </h3>
                  <span
                    className={`badge ${statusColors[issue.status] || 'bg-gray-100'}`}
                  >
                    {issue.status}
                  </span>
                  <span
                    className={`badge ${priorityColors[issue.priority] || 'bg-gray-100'}`}
                  >
                    {issue.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {issue.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="capitalize">{issue.category}</span>
                  {issue.location && <span>{issue.location}</span>}
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                  <span>{issue.report_count} reports</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
