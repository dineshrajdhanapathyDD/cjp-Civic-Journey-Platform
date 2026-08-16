import { useEffect, useState } from 'react'
import { Briefcase, ExternalLink, MapPin, Clock, Filter, Search, Target } from 'lucide-react'
import { getJobs } from '../services/api'
import IndiaLocationSelector from '../components/IndiaLocationSelector'

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    location: '',
    work_type: '',
    experience_level: '',
  })
  const [locState, setLocState] = useState('')
  const [locCity, setLocCity] = useState('')

  useEffect(() => {
    setLoading(true)
    const loc = locCity || locState || filters.location
    getJobs({
      location: loc || undefined,
      work_type: filters.work_type || undefined,
      experience_level: filters.experience_level || undefined,
    })
      .then(res => setJobs(res.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [filters, locState, locCity])

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      job.title?.toLowerCase().includes(q) ||
      job.company?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.skills?.some((s: string) => s.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Job & Opportunity Hub</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Find opportunities connected to civic employment needs
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by title, company, or skills..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civic-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filters.work_type}
          onChange={e => setFilters(f => ({ ...f, work_type: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="">All Types</option>
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          value={filters.experience_level}
          onChange={e => setFilters(f => ({ ...f, experience_level: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="">All Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </select>
        <IndiaLocationSelector
          state={locState}
          city={locCity}
          onStateChange={setLocState}
          onCityChange={setLocCity}
          compact
        />
      </div>

      {/* Job List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-48" />)}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={44} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No opportunities found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try different filters or use the Civic Agent to discover relevant opportunities.
          </p>
          <button
            onClick={() => { setFilters({ location: '', work_type: '', experience_level: '' }); setLocState(''); setLocCity(''); setSearchQuery('') }}
            className="btn-secondary mt-3 text-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="card hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{job.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                </div>
                {job.salary_range && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                    {job.salary_range}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mb-3">{job.description}</p>

              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.skills.slice(0, 5).map((skill: string) => (
                    <span key={skill} className="text-xs bg-civic-50 text-civic-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="text-xs text-gray-400">+{job.skills.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {job.location}
                  </span>
                )}
                <span className="capitalize badge bg-gray-100 text-gray-600">{job.work_type}</span>
                <span className="capitalize">{job.employment_type}</span>
                {job.experience_level && (
                  <span className="capitalize">{job.experience_level} level</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Source: {job.source}</span>
                  {job.posted_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(job.posted_at).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {job.source_url && (
                    <a href={job.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-civic-600 flex items-center gap-1">
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                  {job.apply_url && (
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs btn-primary py-1 px-3 flex items-center gap-1">
                      Apply <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demo label */}
      {filteredJobs.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-6">Prototype Dataset — Verified opportunity sources</p>
      )}
    </div>
  )
}
