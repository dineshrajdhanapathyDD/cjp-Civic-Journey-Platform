import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  FileText,
  Shield,
  Briefcase,
  Activity,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import {
  getIssue,
  getIssueTimeline,
  getIssueReports,
  getIssueEvidence,
  getIssueActions,
  getIssueJobs,
} from '../services/api'

type Tab = 'timeline' | 'reports' | 'evidence' | 'actions' | 'jobs'

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>()
  const [issue, setIssue] = useState<any>(null)
  const [counts, setCounts] = useState<any>({})
  const [tab, setTab] = useState<Tab>('timeline')
  const [tabData, setTabData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getIssue(id)
      .then((res) => {
        setIssue(res.issue)
        setCounts(res.counts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setTabData([])
    const fetchers: Record<Tab, () => Promise<any>> = {
      timeline: () => getIssueTimeline(id).then((r) => r.timeline),
      reports: () => getIssueReports(id).then((r) => r.reports),
      evidence: () => getIssueEvidence(id).then((r) => r.evidence),
      actions: () => getIssueActions(id).then((r) => r.actions),
      jobs: () => getIssueJobs(id).then((r) => r.job_matches),
    }
    fetchers[tab]()
      .then(setTabData)
      .catch(() => setTabData([]))
  }, [id, tab])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  if (!issue) {
    return <div className="p-8 text-center text-gray-500">Issue not found</div>
  }

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'reports', label: 'Reports', icon: FileText, count: counts.reports },
    { key: 'evidence', label: 'Evidence', icon: Shield, count: counts.evidence },
    { key: 'actions', label: 'Actions', icon: Activity, count: counts.actions },
    { key: 'jobs', label: 'Jobs', icon: Briefcase },
  ]

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        to="/issues"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-civic-600 mb-4"
      >
        <ArrowLeft size={16} /> Back to Issues
      </Link>

      {/* Issue Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{issue.title}</h1>
            <p className="text-gray-600 mt-2">{issue.description}</p>
          </div>
          <div className="flex gap-2">
            <span className="badge bg-blue-100 text-blue-800">
              {issue.status}
            </span>
            <span className="badge bg-orange-100 text-orange-800">
              {issue.priority}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
          <span className="capitalize">Category: {issue.category}</span>
          {issue.location && <span>Location: {issue.location}</span>}
          <span>Confidence: {(issue.confidence * 100).toFixed(0)}%</span>
          <span>{issue.report_count} reports</span>
          <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-civic-600 text-civic-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
              {count !== undefined && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {tabData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No {tab} data yet.
          </p>
        ) : tab === 'timeline' ? (
          <div className="relative pl-6 border-l-2 border-civic-200 space-y-4">
            {tabData.map((event: any) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[25px] w-3 h-3 bg-civic-500 rounded-full border-2 border-white" />
                <div className="card py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-civic-700 bg-civic-50 px-2 py-0.5 rounded">
                      {event.event_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{event.description}</p>
                  {event.actor && (
                    <p className="text-xs text-gray-400 mt-1">By: {event.actor}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'reports' ? (
          tabData.map((report: any) => (
            <div key={report.id} className="card">
              <p className="text-sm">{report.content}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>Source: {report.source}</span>
                <span className="capitalize">
                  Status: {report.verification_status}
                </span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : tab === 'evidence' ? (
          tabData.map((ev: any) => (
            <div key={ev.id} className="card">
              <p className="text-sm">{ev.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>Source: {ev.source}</span>
                <span>Type: {ev.evidence_type}</span>
                <span className="capitalize">{ev.verification_status}</span>
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-civic-600 hover:underline"
                  >
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : tab === 'actions' ? (
          tabData.map((action: any) => (
            <div key={action.id} className="card">
              <div className="flex items-center gap-2">
                <span className="badge bg-purple-100 text-purple-800">
                  {action.action_type}
                </span>
                <span
                  className={`badge ${
                    action.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : action.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {action.status}
                </span>
              </div>
              <p className="text-sm mt-2">{action.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                {action.assigned_to && <span>Assigned: {action.assigned_to}</span>}
                <span>{new Date(action.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : tab === 'jobs' ? (
          tabData.map((match: any) => (
            <div key={match.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{match.title}</h3>
                  <p className="text-xs text-gray-500">{match.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">
                    {(match.match_score * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {match.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                {match.location && (
                  <span className="text-xs text-gray-400">{match.location}</span>
                )}
                {match.work_type && (
                  <span className="badge bg-gray-100 text-gray-600">
                    {match.work_type}
                  </span>
                )}
                {match.apply_url && (
                  <a
                    href={match.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs btn-primary py-1 px-3 flex items-center gap-1"
                  >
                    Apply <ExternalLink size={10} />
                  </a>
                )}
              </div>
              {match.match_reason && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  {match.match_reason}
                </p>
              )}
            </div>
          ))
        ) : null}
      </div>
    </div>
  )
}
