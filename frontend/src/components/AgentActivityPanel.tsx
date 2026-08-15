import { Activity, Database, Search, Brain, Briefcase, CheckCircle, Loader2 } from 'lucide-react'

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
  record_evidence: Database,
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

export default function AgentActivityPanel({ actions, isProcessing }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 h-full overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-civic-400" />
        <h3 className="text-sm font-semibold text-white">Agent Activity</h3>
        {isProcessing && (
          <Loader2 size={14} className="text-civic-400 animate-spin ml-auto" />
        )}
      </div>

      <div className="space-y-2">
        {isProcessing && (
          <div className="flex items-start gap-3 p-2 rounded-lg bg-gray-800 border border-civic-700 animate-pulse">
            <Brain size={16} className="text-civic-400 mt-0.5" />
            <div>
              <p className="text-xs text-civic-300 font-medium">Strands Agent</p>
              <p className="text-xs text-gray-400">Processing request...</p>
            </div>
          </div>
        )}

        {actions.map((action) => {
          const Icon = toolIcons[action.tool_name] || Database
          const label = toolLabels[action.tool_name] || action.tool_name

          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-gray-800"
            >
              <Icon
                size={16}
                className={
                  action.status === 'completed'
                    ? 'text-green-400 mt-0.5'
                    : 'text-yellow-400 mt-0.5'
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 font-medium">{label}</p>
                <p className="text-xs text-gray-500 truncate">{action.action}</p>
              </div>
              {action.status === 'completed' && (
                <CheckCircle size={12} className="text-green-500 mt-0.5" />
              )}
            </div>
          )
        })}

        {!isProcessing && actions.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">
            Agent activity will appear here
          </p>
        )}
      </div>
    </div>
  )
}
