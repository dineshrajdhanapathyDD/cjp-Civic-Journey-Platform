import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Clock, ChevronRight, Filter, MapPin, Search } from 'lucide-react'
import { getIssues } from '../services/api'
import { CIVIC_CATEGORIES } from '../data/indiaLocations'
import IndiaLocationSelector from '../components/IndiaLocationSelector'
import BackButton from '../components/BackButton'

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
  const [searchParams] = useSearchParams()
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [locState, setLocState] = useState('')
  const [locCity, setLocCity] = useState('')

  useEffect(() => {
    setLoading(true)
    getIssues(statusFilter || undefined, categoryFilter || undefined)
      .then(res => setIssues(res.issues))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [statusFilter, categoryFilter])

  const filteredIssues = issues.filter(issue => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!issue.title?.toLowerCase().includes(q) && !issue.description?.toLowerCase().includes(q)) {
        return false
      }
    }
    if (locState && issue.location && !issue.location.includes(locState)) {
      return false
    }
    return true
  })

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <BackButton to="/" label="← Back to Dashboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Civic Issues</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Consolidated civic concerns from citizen reports
          </p>
        </div>
        <Link to="/agent" className="btn-primary text-sm">
          Report a Concern
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search civic issues..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civic-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={14} className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
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
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="">All Categories</option>
          {CIVIC_CATEGORIES.map(c => (
            <option key={c} value={c.toLowerCase()}>{c}</option>
          ))}
        </select>
        <IndiaLocationSelector
          state={locState}
          city={locCity}
          onStateChange={setLocState}
          onCityChange={setLocCity}
          compact
        />
      </div>

      {/* Issue List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={44} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No civic issues found</p>
          <p className="text-sm text-gray-400 mt-1">Report your first concern to begin the journey.</p>
          <Link to="/agent" className="btn-primary mt-4 inline-block text-sm">
            Report Concern
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map(issue => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-all hover:border-civic-200 cursor-pointer group p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-civic-700 transition-colors">
                    {issue.title}
                  </h3>
                  <span className={`badge ${statusColors[issue.status] || 'bg-gray-100'}`}>
                    {issue.status}
                  </span>
                  <span className={`badge ${priorityColors[issue.priority] || 'bg-gray-100'}`}>
                    {issue.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{issue.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="capitalize font-medium text-gray-500">{issue.category}</span>
                  {issue.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {issue.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(issue.created_at).toLocaleDateString('en-IN')}
                  </span>
                  <span>{issue.report_count} report{issue.report_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-civic-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
