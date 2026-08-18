import { useState, useRef } from 'react'
import {
  Search, Loader2, Cloud, CheckCircle, XCircle, ExternalLink,
  Briefcase, MapPin, Code, ArrowRight, Zap, Database, Brain,
  Target, AlertTriangle, Award, Shield,
} from 'lucide-react'
import BackButton from '../components/BackButton'
import { careerSearch, CareerSearchResult, CareerJobResult } from '../services/api'

type SearchState = 'idle' | 'searching' | 'done' | 'error'

export default function AWSCareerAgent() {
  const [query, setQuery] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [location, setLocation] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [result, setResult] = useState<CareerSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSteps, setActiveSteps] = useState<{ step: string; tool: string; status: string }[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setSearchState('searching')
    setError(null)
    setResult(null)
    setActiveSteps([
      { step: 'skill_extraction', tool: 'AWS Career Agent', status: 'running' },
    ])

    // Simulate step progression for UX
    setTimeout(() => {
      setActiveSteps(prev => [
        { ...prev[0], status: 'completed' },
        { step: 'vector_search', tool: 'CockroachDB Vector Search', status: 'running' },
      ])
    }, 400)

    setTimeout(() => {
      setActiveSteps(prev => [
        prev[0],
        { ...prev[1], status: 'completed' },
        { step: 'skill_matching', tool: 'AWS Career Agent', status: 'running' },
      ])
    }, 800)

    try {
      const skills = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      const data = await careerSearch(
        query,
        skills.length > 0 ? skills : undefined,
        location || undefined,
        experienceLevel || undefined,
      )

      setResult(data)
      setActiveSteps(data.steps || [])
      setSearchState('done')

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err: any) {
      setError(err?.message || 'Career search failed. Please try again.')
      setSearchState('error')
      setActiveSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s))
    }
  }

  const handleQuickSearch = (text: string, skills: string) => {
    setQuery(text)
    setSkillsInput(skills)
    setTimeout(() => {
      const form = document.getElementById('career-search-form') as HTMLFormElement
      form?.requestSubmit()
    }, 50)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500 text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
          <div className="mb-2">
            <BackButton to="/" label="← Back to Dashboard" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Cloud size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AWS Career Agent</h1>
              <p className="text-white/80 text-sm">Job Search + Skills Matching powered by CockroachDB Vector Search</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
            <span className="flex items-center gap-1"><Database size={12} /> Real Data Only</span>
            <span className="flex items-center gap-1"><Zap size={12} /> Vector Search</span>
            <span className="flex items-center gap-1"><Target size={12} /> Skill Gap Analysis</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <form id="career-search-form" onSubmit={handleSearch} className="space-y-4">
            {/* Main search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                What kind of role are you looking for?
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. AWS Cloud Engineer, DevOps, Python developer..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Skills + filters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Your Skills (comma-separated)
                </label>
                <div className="relative">
                  <Code size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={e => setSkillsInput(e.target.value)}
                    placeholder="AWS, Python, Docker, Terraform..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Remote, San Francisco..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Any level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Principal</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || searchState === 'searching'}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searchState === 'searching' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Find Matching Jobs
                </>
              )}
            </button>
          </form>

          {/* Quick examples */}
          {searchState === 'idle' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: 'Find me AWS Cloud/DevOps jobs', skills: 'AWS, Python, Docker' },
                  { text: 'Junior cloud engineer roles', skills: 'AWS, Linux, Python' },
                  { text: 'Remote Kubernetes and Terraform positions', skills: 'Kubernetes, Terraform, AWS, Docker' },
                  { text: 'Full stack developer with cloud experience', skills: 'React, Node.js, AWS, TypeScript' },
                ].map(({ text, skills }) => (
                  <button
                    key={text}
                    onClick={() => handleQuickSearch(text, skills)}
                    className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 border border-orange-200 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agent Activity Steps */}
        {searchState === 'searching' && activeSteps.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-orange-400" />
              <h3 className="text-sm font-semibold">Agent Activity</h3>
              <Loader2 size={14} className="text-orange-400 animate-spin ml-auto" />
            </div>
            <div className="space-y-2">
              {activeSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.status === 'running' && <Loader2 size={13} className="animate-spin text-orange-400" />}
                  {step.status === 'completed' && <CheckCircle size={13} className="text-green-400" />}
                  {step.status === 'error' && <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs text-gray-300">
                    {step.step === 'skill_extraction' && 'Extracting skills from your query'}
                    {step.step === 'vector_search' && 'CockroachDB Vector Search - finding matching jobs'}
                    {step.step === 'skill_matching' && 'Performing skill gap analysis'}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-auto">{step.tool}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {searchState === 'error' && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Search failed</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {searchState === 'done' && result && (
          <div ref={resultsRef}>
            {/* Summary Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Found {result.total_found} matching {result.total_found === 1 ? 'opportunity' : 'opportunities'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  in {result.duration_ms}ms
                </div>
                {result.user_skills.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-gray-500">Your skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.user_skills.map(skill => (
                        <span key={skill} className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Activity steps (completed) */}
              {result.steps && result.steps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    {result.steps.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-green-500" />
                        {step.tool}
                        {step.result && <span className="text-gray-400">({step.result})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* No results */}
            {result.jobs.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 font-medium">No matching opportunities found</p>
                <p className="text-xs text-gray-500 mt-1">Try broadening your search or adjusting filters.</p>
              </div>
            )}

            {/* Job Cards */}
            <div className="space-y-4">
              {result.jobs.map((job, index) => (
                <JobCard key={job.id} job={job} rank={index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function JobCard({ job, rank }: { job: CareerJobResult; rank: number }) {
  const [expanded, setExpanded] = useState(false)

  const matchColor = job.match_percentage >= 80
    ? 'text-green-700 bg-green-50 border-green-200'
    : job.match_percentage >= 50
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-gray-700 bg-gray-50 border-gray-200'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400">#{rank}</span>
              <h3 className="text-base font-bold text-gray-900 truncate">{job.title}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="font-medium">{job.company}</span>
              {job.location && (
                <span className="flex items-center gap-1 text-xs">
                  <MapPin size={12} className="text-gray-400" />
                  {job.location}
                </span>
              )}
              {job.work_type && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                  {job.work_type}
                </span>
              )}
              {job.experience_level && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                  {job.experience_level}
                </span>
              )}
            </div>
          </div>

          {/* Match Badge */}
          <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${matchColor}`}>
            <span className="text-lg font-bold">{job.match_percentage}%</span>
            <span className="text-[10px] font-medium">Match</span>
          </div>
        </div>

        {/* Salary */}
        {job.salary_range && (
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{job.salary_range}</span>
          </div>
        )}

        {/* Skills Section */}
        <div className="mt-4 space-y-3">
          {/* Required Skills */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
              <Shield size={12} className="text-gray-400" />
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map(skill => {
                const isMatch = job.matching_skills.includes(skill)
                return (
                  <span
                    key={skill}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      isMatch
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {isMatch && <CheckCircle size={10} className="inline mr-1 -mt-0.5" />}
                    {!isMatch && <XCircle size={10} className="inline mr-1 -mt-0.5" />}
                    {skill}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Matching Skills */}
          {job.matching_skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                <Award size={12} />
                Matching Skills ({job.matching_skills.length}/{job.required_skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.matching_skills.map(skill => (
                  <span key={skill} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          {job.missing_skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                Skill Gaps ({job.missing_skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.missing_skills.map(skill => (
                  <span key={skill} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expandable description */}
        {job.description && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {expanded ? 'Hide description' : 'Show description'}
            </button>
            {expanded && (
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">{job.description}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              Apply Now
              <ExternalLink size={14} />
            </a>
          )}
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Source: {job.source || 'Job Board'}
              <ExternalLink size={11} />
            </a>
          )}
          <span className="text-[10px] text-gray-400 ml-auto">
            Similarity: {(job.similarity_score * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
