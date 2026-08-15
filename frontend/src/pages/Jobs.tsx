import { useEffect, useState } from 'react'
import { Briefcase, ExternalLink, MapPin, Clock, Filter } from 'lucide-react'
import { getJobs } from '../services/api'

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    work_type: '',
    experience_level: '',
  })

  useEffect(() => {
    setLoading(true)
    getJobs({
      location: filters.location || undefined,
      work_type: filters.work_type || undefined,
      experience_level: filters.experience_level || undefined,
    })
      .then((res) => setJobs(res.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Job Opportunities</h1>
        <p className="text-gray-500 text-sm mt-1">
          Verified opportunities linked to civic employment issues
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter size={16} className="text-gray-400" />
        <select
          value={filters.work_type}
          onChange={(e) => setFilters((f) => ({ ...f, work_type: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          value={filters.experience_level}
          onChange={(e) =>
            setFilters((f) => ({ ...f, experience_level: e.target.value }))
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </select>
        <input
          type="text"
          placeholder="Location..."
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-48"
        />
      </div>

      {/* Job List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No job opportunities found.</p>
          <p className="text-sm text-gray-400 mt-1">
            Use the Civic Agent to discover relevant opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{job.title}</h3>
                  <p className="text-xs text-gray-500">{job.company}</p>
                </div>
                {job.salary_range && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                    {job.salary_range}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                {job.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {job.skills?.slice(0, 5).map((skill: string) => (
                  <span
                    key={skill}
                    className="text-xs bg-civic-50 text-civic-700 px-2 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {job.location}
                  </span>
                )}
                <span className="capitalize">{job.work_type}</span>
                <span className="capitalize">{job.employment_type}</span>
                {job.experience_level && (
                  <span className="capitalize">{job.experience_level}</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Source: {job.source}</span>
                  {job.posted_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(job.posted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {job.source_url && (
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-civic-600 flex items-center gap-1"
                    >
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs btn-primary py-1 px-3 flex items-center gap-1"
                    >
                      Apply <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
