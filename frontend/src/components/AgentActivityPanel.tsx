import { Activity, Database, Search, Brain, Briefcase, CheckCircle, Loader2, Shield, Zap } from 'lucide-react'

interface AgentAction {
  id: string
  tool_name: string
  action: string
  status: string
  duration_ms?: number
  created_at: string
}

interface Props {
  actions: AgentAction[]
  isProcessing?: boolean
}

const toolIcons: Record<string, any> = {
  search_civic_memory: Search,
  find_related_issues: Search,
  create_civic_issue: Database,
  update_issue: Database,
  get_issue_context: Database,
  record_evidence: Shield,
  record_action: Database,
  find_job_opportunities: Briefcase,
  record_job_match: Briefcase,
  get_issue_timeline: Activity,
  add_timeline_event: Activity,
  civic_agent: Brain,
}

const toolLabels: Record<string, string> = {
  search_civic_memory: 'CockroachDB Vector Search',
  find_related_issues: 'Distributed Vector Index',
  create_civic_issue: 'CockroachDB MCP',
  update_issue: 'CockroachDB MCP',
  get_issue_context: 'CockroachDB MCP',
  record_evidence: 'CockroachDB MCP',
  record_action: 'CockroachDB MCP',
  find_job_opportunities: 'Job Semantic Search',
  record_job_match: 'CockroachDB MCP',
  get_issue_timeline: 'CockroachDB MCP',
  add_timeline_event: 'CockroachDB MCP',
  civic_agent: 'Strands Agent',
}

const toolColors: Record<string, string> = {
  search_civic_memory: 'text-blue-400',
  find_related_issues: 'text-blue-400',
  create_civic_issue: 'text-green-400',
  update_issue: 'text-green-400',
  get_issue_context: 'text-green-400',
  record_evidence: 'text-teal-400',
  record_action: 'text-green-400',
  find_job_opportunities: 'text-yellow-400',
  record_job_match: 'text-yellow-400',
  get_issue_timeline: 'text-cyan-400',
  add_timeline_event: 'text-cyan-400',
  civic_agent: 'text-purple-400',
}

export default function AgentActivityPanel({ actions, isProcessing }: Props) {
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-civic-400" />
        <h3 className="text-sm font-semibold text-white">Agent Activity</h3>
        {isProcessing && (
          <Loader2 size={14} className="text-civic-400 animate-spin ml-auto" />
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {isProcessing && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800 border border-civic-700/50 animate-pulse">
            <Brain size={15} className="text-purple-400 mt-0.5" />
            <div>
              <p className="text-xs text-purple-300 font-medium">Strands Agent</p>
              <p className="text-xs text-gray-400">Processing request...</p>
            </div>
          </div>
        )}

        {actions.map((action) => {
          const Icon = toolIcons[action.tool_name] || Database
          const label = toolLabels[action.tool_name] || action.tool_name
          const color = toolColors[action.tool_name] || 'text-gray-400'

          return (
            <div key={action.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-800/60">
              <Icon size={14} className={`${color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-300 font-medium">{label}</p>
                <p className="text-[10px] text-gray-500 truncate">{action.action}</p>
              </div>
              {action.status === 'completed' && (
                <CheckCircle size={11} className="text-green-500 mt-0.5 flex-shrink-0" />
              )}
            </div>
          )
        })}

        {/* Idle State */}
        {!isProcessing && actions.length === 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-center mb-4">
              <Brain size={28} className="mx-auto text-civic-500 mb-2" />
              <p className="text-xs text-gray-400 font-medium">Agent Ready</p>
            </div>
            <div className="space-y-1.5">
              {[
                { icon: Brain, label: 'Strands Agent', status: 'Ready' },
                { icon: Database, label: 'CockroachDB', status: 'Connected' },
                { icon: Zap, label: 'MCP Server', status: 'Ready' },
                { icon: Search, label: 'Vector Search', status: 'Ready' },
                { icon: Briefcase, label: 'Job Matching', status: 'Ready' },
              ].map(({ icon: SIcon, label, status }) => (
                <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-800/40">
                  <SIcon size={12} className="text-gray-500" />
                  <span className="text-[10px] text-gray-400 flex-1">{label}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-400">{status}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-4">
              Agent will show MCP, vector search, and action activity here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
