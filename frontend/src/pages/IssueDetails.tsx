import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, FileText, Shield, Briefcase, Activity,
  ExternalLink, MapPin, ChevronRight, AlertCircle, CheckCircle,
  Target, BarChart3,
} from 'lucide-react'
import {
  getIssue, getIssueTimeline, getIssueReports,
  getIssueEvidence, getIssueActions, getIssueJobs,
} from '../services/api'

type Tab = 'overview' | 'timeline' | 'reports' | 'evidence' | 'actions' | 'jobs'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>()
  const [issue, setIssue] = useState<any>(null)
  const [counts, setCounts] = useState<any>({})
  const [tab, setTab] = useState<Tab>('overview')
  const [tabData, setTabData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getIssue(id)
      .then(res => { setIssue(res.issue); setCounts(res.counts) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || tab === 'overview') return
    setTabData([])
    const fetchers: Record<string, () => Promise<any>> = {
      timeline: () => getIssueTimeline(id).then(r => r.timeline),
      reports: () => getIssueReports(id).then(r => r.reports),
      evidence: () => getIssueEvidence(id).then(r => r.evidence),
      actions: () => getIssueActions(id).then(r => r.actions),
      jobs: () => getIssueJobs(id).then(r => r.job_matches),
    }
    if (fetchers[tab]) fetchers[tab]().then(setTabData).catch(() => setTabData([]))
  }, [id, tab])

  if (loading) return <div className="p-8"><div className="card animate-pulse h-40" /></div>
  if (!issue) return <div className="p-8 text-center text-gray-500">Issue not found</div>

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'reports', label: 'Reports', icon: FileText, count: counts.reports },
    { key: 'evidence', label: 'Evidence', icon: Shield, count: counts.evidence },
    { key: 'actions', label: 'Actions', icon: Activity, count: counts.actions },
    { key: 'jobs', label: 'Opportunities', icon: Briefcase },
  ]

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link to="/" className="hover:text-civic-600">Dashboard</Link>
        <ChevronRight size={12} />
        <Link to="/issues" className="hover:text-civic-600">Civic Issues</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600">Civic Journey</span>
      </nav>

      {/* Issue Header */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{issue.title}</h1>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">{issue.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
              <span className="capitalize font-medium bg-gray-100 px-2 py-0.5 rounded">{issue.category}</span>
              {issue.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-civic-500" />
                  {issue.location}
                </span>
              )}
              <span>Confidence: {(issue.confidence * 100).toFixed(0)}%</span>
              <span>{issue.report_count} report{issue.report_count !== 1 ? 's' : ''}</span>
              <span>Created: {new Date(issue.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <span className={`badge text-xs ${statusColors[issue.status] || 'bg-gray-100'}`}>
              {issue.status}
            </span>
            <span className="badge bg-orange-100 text-orange-800 text-xs">{issue.priority}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? 'border-civic-600 text-civic-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
              {count !== undefined && count > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-civic-700">{counts.reports || 0}</p>
              <p className="text-xs text-gray-500">Reports</p>
            </div>
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-teal-600">{counts.evidence || 0}</p>
              <p className="text-xs text-gray-500">Evidence</p>
            </div>
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{counts.actions || 0}</p>
              <p className="text-xs text-gray-500">Actions</p>
            </div>
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {issue.status === 'resolved' ? '100%' : `${Math.min(95, Math.round(issue.confidence * 100))}%`}
              </p>
              <p className="text-xs text-gray-500">Journey Progress</p>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          tabData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No timeline events yet.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-civic-200 space-y-4">
              {tabData.map((event: any) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 bg-civic-500 rounded-full border-2 border-white" />
                  <div className="card py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-civic-700 bg-civic-50 px-2 py-0.5 rounded">
                        {event.event_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(event.created_at).toLocaleString('en-IN')}
                      </span>
                      {event.actor && <span className="text-xs text-gray-400">by {event.actor}</span>}
                    </div>
                    <p className="text-sm mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'reports' && (
          tabData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No reports linked yet.</p>
          ) : (
            <div className="space-y-3">
              {tabData.map((report: any) => (
                <div key={report.id} className="card p-4">
                  <p className="text-sm text-gray-800">{report.content}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Source: {report.source}</span>
                    <span className="capitalize badge bg-gray-100 text-gray-600">{report.verification_status}</span>
                    <span>{new Date(report.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'evidence' && (
          tabData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No evidence recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {tabData.map((ev: any) => (
                <div key={ev.id} className="card p-4">
                  <p className="text-sm">{ev.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                    <span>Source: {ev.source}</span>
                    <span>Type: {ev.evidence_type}</span>
                    <span className={`badge ${
                      ev.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                      ev.verification_status === 'official' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{ev.verification_status}</span>
                    {ev.source_url && (
                      <a href={ev.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-civic-600 hover:underline">
                        View Source <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'actions' && (
          tabData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No actions recorded yet.</p>
              <Link to="/agent" className="btn-primary mt-3 inline-block text-sm">Find Opportunities</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tabData.map((action: any) => (
                <div key={action.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-purple-100 text-purple-800">{action.action_type}</span>
                    <span className={`badge ${
                      action.status === 'completed' ? 'bg-green-100 text-green-800' :
                      action.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{action.status}</span>
                  </div>
                  <p className="text-sm mt-1">{action.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {action.assigned_to && <span>Assigned: {action.assigned_to}</span>}
                    <span>{new Date(action.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'jobs' && (
          tabData.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No opportunities matched yet.</p>
              <p className="text-xs text-gray-400 mt-1">Use the Civic Agent to discover relevant jobs.</p>
              <Link to="/agent" className="btn-primary mt-3 inline-block text-sm">Find Opportunities</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tabData.map((match: any) => (
                <div key={match.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{match.title}</h3>
                      <p className="text-xs text-gray-500">{match.company}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-xs font-bold text-green-700">
                      <Target size={12} />
                      {(match.match_score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{match.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-400">
                    {match.location && <span className="flex items-center gap-1"><MapPin size={10} />{match.location}</span>}
                    {match.work_type && <span className="badge bg-gray-100 text-gray-600">{match.work_type}</span>}
                    {match.experience_level && <span className="badge bg-gray-100 text-gray-600">{match.experience_level}</span>}
                    {match.skills?.slice(0, 4).map((s: string) => (
                      <span key={s} className="badge bg-civic-50 text-civic-700">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    {match.match_reason && (
                      <p className="text-xs text-gray-400 italic flex-1">{match.match_reason}</p>
                    )}
                    {match.apply_url && (
                      <a href={match.apply_url} target="_blank" rel="noopener noreferrer"
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        Apply <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
