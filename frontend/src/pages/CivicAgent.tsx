import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, Loader2, Bot, User, MessageSquare, Search, Briefcase, MapPin,
  CheckCircle, AlertCircle, Database, Brain, Zap, ArrowRight, RefreshCw,
  FileText, Activity, XCircle,
} from 'lucide-react'
import AgentActivityPanel from '../components/AgentActivityPanel'
import IndiaLocationSelector from '../components/IndiaLocationSelector'
import { CIVIC_CATEGORIES } from '../data/indiaLocations'
import { sendMessage, getAgentActions, submitReport } from '../services/api'
import BackButton from '../components/BackButton'

type Mode = 'report' | 'explore' | 'opportunities'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ExecutionStep {
  id: string
  label: string
  tool: string
  status: 'pending' | 'running' | 'success' | 'error'
  duration?: number
}

interface ReportResult {
  conversationId: string
  response: string
  agentActions: any[]
  durationMs: number
}

export default function CivicAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [agentActions, setAgentActions] = useState<any[]>([])
  const [mode, setMode] = useState<Mode>('report')
  const [locState, setLocState] = useState('Tamil Nadu')
  const [locCity, setLocCity] = useState('')
  const [category, setCategory] = useState('Infrastructure')
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [reportResult, setReportResult] = useState<ReportResult | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    const interval = setInterval(() => {
      getAgentActions(conversationId).then(r => setAgentActions(r.agent_actions)).catch(() => {})
    }, 2000)
    return () => clearInterval(interval)
  }, [conversationId])

  // Map agent actions to execution steps
  useEffect(() => {
    if (agentActions.length === 0) return
    const steps: ExecutionStep[] = agentActions.map(a => ({
      id: a.id,
      label: getStepLabel(a.tool_name),
      tool: getToolCategory(a.tool_name),
      status: a.status === 'completed' ? 'success' : a.status === 'error' ? 'error' : 'running',
      duration: a.duration_ms,
    }))
    setExecutionSteps(steps)
  }, [agentActions])

  function getStepLabel(toolName: string): string {
    const labels: Record<string, string> = {
      search_civic_memory: 'Searching civic memory',
      find_related_issues: 'Finding related issues',
      create_civic_issue: 'Creating civic issue',
      update_issue: 'Updating issue',
      get_issue_context: 'Retrieving issue context',
      record_evidence: 'Recording evidence',
      record_action: 'Recording action',
      find_job_opportunities: 'Searching job opportunities',
      record_job_match: 'Recording job match',
      get_issue_timeline: 'Getting issue timeline',
      add_timeline_event: 'Adding timeline event',
      consult_cockroachdb_skill: 'Consulting CockroachDB skills',
      list_cockroachdb_skills: 'Listing available skills',
    }
    return labels[toolName] || toolName
  }

  function getToolCategory(toolName: string): string {
    const categories: Record<string, string> = {
      search_civic_memory: 'Vector Search',
      find_related_issues: 'Vector Search',
      create_civic_issue: 'CockroachDB MCP',
      update_issue: 'CockroachDB MCP',
      get_issue_context: 'CockroachDB MCP',
      record_evidence: 'CockroachDB MCP',
      record_action: 'CockroachDB MCP',
      find_job_opportunities: 'Vector Search',
      record_job_match: 'CockroachDB MCP',
      get_issue_timeline: 'CockroachDB MCP',
      add_timeline_event: 'CockroachDB MCP',
      consult_cockroachdb_skill: 'Agent Skills',
      list_cockroachdb_skills: 'Agent Skills',
    }
    return categories[toolName] || 'Strands Agent'
  }

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isProcessing) return

    // Enrich message with location context for report mode
    let enrichedMsg = msg
    if (mode === 'report' && !text) {
      const loc = locCity ? `${locCity}, ${locState}` : locState
      if (loc && !msg.toLowerCase().includes(loc.toLowerCase())) {
        enrichedMsg = `[Location: ${loc}, India] [Category: ${category}] ${msg}`
      }
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)
    setError(null)
    setShowConfirmation(false)
    setExecutionSteps([
      { id: 'agent-start', label: 'Agent Processing', tool: 'Strands Agent', status: 'running' },
    ])

    try {
      const result = await sendMessage(enrichedMsg, conversationId)
      setConversationId(result.conversation_id)

      const cleanResponse = result.response.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '')
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponse,
      }
      setMessages(prev => [...prev, assistantMsg])

      if (result.conversation_id) {
        const actions = await getAgentActions(result.conversation_id)
        setAgentActions(actions.agent_actions)
      }

      // Show confirmation for report mode on first message
      if (mode === 'report' && messages.length === 0) {
        // Also persist the citizen report in the reports table
        try {
          await submitReport(msg)
        } catch {
          // Non-blocking — agent already processed the message
        }
        setReportResult({
          conversationId: result.conversation_id,
          response: cleanResponse,
          agentActions: result.agent_actions || [],
          durationMs: result.duration_ms,
        })
        setShowConfirmation(true)
      }

      // Update execution steps to show completion
      setExecutionSteps(prev => prev.map(s =>
        s.id === 'agent-start' ? { ...s, status: 'success', label: 'Agent Processing Complete' } : s
      ))
    } catch (err: any) {
      const errorMsg = err?.message || 'Agent service temporarily unavailable. Please try again.'
      setError(errorMsg)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
      }])
      setExecutionSteps(prev => prev.map(s =>
        s.status === 'running' ? { ...s, status: 'error' } : s
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
      if (lastUserMsg) {
        setMessages(prev => prev.filter(m => m.id !== lastUserMsg.id))
        handleSend(lastUserMsg.content)
      }
    }
  }

  const handleNewReport = () => {
    setShowConfirmation(false)
    setReportResult(null)
    setMessages([])
    setAgentActions([])
    setExecutionSteps([])
    setConversationId(undefined)
    setError(null)
  }

  const modes: { key: Mode; icon: any; label: string }[] = [
    { key: 'report', icon: MessageSquare, label: 'Report' },
    { key: 'explore', icon: Search, label: 'Explore' },
    { key: 'opportunities', icon: Briefcase, label: 'Opportunities' },
  ]

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 lg:px-6 py-3 bg-white">
          <div className="mb-1">
            <BackButton to="/" label="← Back to Dashboard" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">CJP Civic Agent</h1>
          <p className="text-xs text-gray-600">Your AI assistant for understanding and acting on civic issues</p>
          {/* Mode Tabs */}
          <div className="flex gap-1 mt-2">
            {modes.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); if (key !== mode) handleNewReport() }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === key
                    ? 'bg-civic-100 text-civic-800 border border-civic-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific controls */}
        {mode === 'report' && messages.length === 0 && !showConfirmation && (
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-white space-y-3">
            <p className="text-xs font-semibold text-gray-700">Configure your report context:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-civic-500"
                >
                  {CIVIC_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <IndiaLocationSelector
                state={locState}
                city={locCity}
                onStateChange={setLocState}
                onCityChange={setLocCity}
                compact
                showLabel
              />
            </div>
          </div>
        )}

        {/* Execution Timeline */}
        {isProcessing && executionSteps.length > 0 && (
          <div className="px-4 lg:px-6 py-3 border-b border-gray-200 bg-blue-50">
            <p className="text-xs font-bold text-blue-800 mb-2">Agent Execution:</p>
            <div className="space-y-1.5">
              {executionSteps.map(step => (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  {step.status === 'running' && <Loader2 size={12} className="animate-spin text-blue-600" />}
                  {step.status === 'success' && <CheckCircle size={12} className="text-green-600" />}
                  {step.status === 'error' && <XCircle size={12} className="text-red-600" />}
                  {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-gray-300" />}
                  <span className={`font-medium ${step.status === 'error' ? 'text-red-700' : 'text-gray-800'}`}>{step.label}</span>
                  <span className="text-gray-500">— {step.tool}</span>
                  {step.duration && <span className="text-gray-400 ml-auto">{step.duration}ms</span>}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 size={12} className="animate-spin text-civic-600" />
                  <span className="text-civic-700 font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Screen */}
        {showConfirmation && reportResult && (
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="max-w-2xl mx-auto">
              {/* Success Banner */}
              <div className="card-solid bg-green-50 border-green-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle size={24} className="text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-green-900">Civic concern submitted</h2>
                    <p className="text-sm text-green-700">Your report has been processed and stored in CockroachDB</p>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="card mb-4">
                <h3 className="font-bold text-gray-900 mb-3">What CJP Did</h3>
                <div className="space-y-2">
                  {executionSteps.filter(s => s.status === 'success').map(step => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-gray-800">{step.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{step.tool}</span>
                      {step.duration && <span className="text-xs text-gray-400 ml-auto">{step.duration}ms</span>}
                    </div>
                  ))}
                  {executionSteps.filter(s => s.status === 'success').length === 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-gray-800">Agent analyzed and processed your report</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Conversation ID: <span className="font-mono text-gray-700">{reportResult.conversationId.slice(0, 8)}...</span>
                    {' '}· Processing time: <span className="font-mono text-gray-700">{reportResult.durationMs}ms</span>
                  </p>
                </div>
              </div>

              {/* Agent Response */}
              <div className="card mb-4">
                <h3 className="font-bold text-gray-900 mb-2">Agent Response</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{reportResult.response}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link to="/issues" className="btn-primary text-sm flex items-center gap-2">
                  <AlertCircle size={14} />
                  View Civic Issues
                </Link>
                <Link to="/activity" className="btn-secondary text-sm flex items-center gap-2">
                  <Activity size={14} />
                  View Agent Activity
                </Link>
                <button onClick={handleNewReport} className="btn-secondary text-sm flex items-center gap-2">
                  <FileText size={14} />
                  Submit Another Report
                </button>
                <Link to="/" className="btn-secondary text-sm flex items-center gap-2">
                  <ArrowRight size={14} />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Messages (only show when not in confirmation) */}
        {!showConfirmation && (
          <>
            <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 lg:py-16">
                  <Bot size={44} className="mx-auto text-civic-400 mb-4" />
                  <h2 className="text-lg font-bold text-gray-800">
                    {mode === 'report' && 'Report a Civic Concern'}
                    {mode === 'explore' && 'Explore Civic Issues'}
                    {mode === 'opportunities' && 'Find Opportunities'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                    {mode === 'report' && 'Describe your concern and the agent will analyze, classify, and connect it to related issues in CockroachDB.'}
                    {mode === 'explore' && 'Ask about existing issues, check if something has been reported, or retrieve context from persistent memory.'}
                    {mode === 'opportunities' && 'Describe your skills and preferences to find relevant jobs and internships via vector search.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {mode === 'report' && [
                      "I reported a broken streetlight near Thanjavur Railway Station.",
                      "There aren't enough technology jobs for graduates in my area.",
                      "Public transport connectivity is poor in my district.",
                    ].map(s => (
                      <button key={s} onClick={() => setInput(s)} className="text-xs bg-civic-50 text-civic-800 px-3 py-2 rounded-lg hover:bg-civic-100 transition-colors text-left max-w-xs border border-civic-200">
                        {s}
                      </button>
                    ))}
                    {mode === 'explore' && [
                      "What civic issue did I report earlier near Thanjavur Railway Station?",
                      "Find related reports about employment in Tamil Nadu.",
                      "Show all open issues and their status.",
                    ].map(s => (
                      <button key={s} onClick={() => setInput(s)} className="text-xs bg-blue-50 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-left max-w-xs border border-blue-200">
                        {s}
                      </button>
                    ))}
                    {mode === 'opportunities' && [
                      "Find entry-level Python and AWS jobs for a recent graduate.",
                      "What internships are available for cloud computing skills?",
                      "Remote DevOps roles for freshers.",
                    ].map(s => (
                      <button key={s} onClick={() => setInput(s)} className="text-xs bg-green-50 text-green-800 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-left max-w-xs border border-green-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-civic-700" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    msg.role === 'user' ? 'bg-civic-600 text-white shadow-sm' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-gray-700" />
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center">
                    <Bot size={16} className="text-civic-700" />
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-civic-600" />
                      <span className="text-sm text-gray-700 font-medium">Agent is processing...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error with Retry */}
              {error && !isProcessing && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle size={18} className="text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Processing failed</p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                  <button onClick={handleRetry} className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 lg:p-4 bg-white">
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    mode === 'report' ? 'Describe your civic concern...' :
                    mode === 'explore' ? 'Ask about an issue or retrieve from memory...' :
                    'Describe skills and preferences...'
                  }
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent bg-white"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Agent Activity Sidebar — hidden on mobile */}
      <div className="hidden lg:block w-72 xl:w-80 border-l border-gray-200 bg-gray-900">
        <AgentActivityPanel actions={agentActions} isProcessing={isProcessing} />
      </div>
    </div>
  )
}
