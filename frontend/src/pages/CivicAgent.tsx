import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, MessageSquare, Search, Briefcase, MapPin } from 'lucide-react'
import AgentActivityPanel from '../components/AgentActivityPanel'
import IndiaLocationSelector from '../components/IndiaLocationSelector'
import { CIVIC_CATEGORIES } from '../data/indiaLocations'
import { sendMessage, getAgentActions } from '../services/api'

type Mode = 'report' | 'explore' | 'opportunities'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
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
  const [category, setCategory] = useState('Employment')
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

    try {
      const result = await sendMessage(enrichedMsg, conversationId)
      setConversationId(result.conversation_id)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, ''),
      }
      setMessages(prev => [...prev, assistantMsg])
      if (result.conversation_id) {
        const actions = await getAgentActions(result.conversation_id)
        setAgentActions(actions.agent_actions)
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Agent service temporarily unavailable. Please try again.',
      }])
    } finally {
      setIsProcessing(false)
    }
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
        <div className="border-b px-4 lg:px-6 py-3">
          <h1 className="text-lg font-semibold">CJP Civic Agent</h1>
          <p className="text-xs text-gray-500">Your AI assistant for understanding and acting on civic issues</p>
          {/* Mode Tabs */}
          <div className="flex gap-1 mt-2">
            {modes.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === key
                    ? 'bg-civic-100 text-civic-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific controls */}
        {mode === 'report' && messages.length === 0 && (
          <div className="px-4 lg:px-6 py-3 border-b bg-gray-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
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

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 lg:py-16">
              <Bot size={44} className="mx-auto text-civic-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700">
                {mode === 'report' && 'Report a Civic Concern'}
                {mode === 'explore' && 'Explore Civic Issues'}
                {mode === 'opportunities' && 'Find Opportunities'}
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                {mode === 'report' && 'Describe your concern and the agent will analyze, classify, and connect it to related issues.'}
                {mode === 'explore' && 'Ask about existing issues, check if something has been reported, or explore the civic landscape.'}
                {mode === 'opportunities' && 'Describe your skills and preferences to find relevant jobs and internships.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {mode === 'report' && [
                  "There aren't enough technology jobs for graduates in my area.",
                  "Public transport connectivity is poor in my district.",
                  "Engineering colleges lack industry partnerships.",
                ].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs bg-civic-50 text-civic-700 px-3 py-2 rounded-lg hover:bg-civic-100 transition-colors text-left max-w-xs">
                    {s}
                  </button>
                ))}
                {mode === 'explore' && [
                  "Has this issue already been reported?",
                  "Find related reports about employment in Tamil Nadu.",
                  "Show issue history and timeline.",
                ].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-left max-w-xs">
                    {s}
                  </button>
                ))}
                {mode === 'opportunities' && [
                  "Find entry-level Python and AWS jobs for a recent graduate.",
                  "What internships are available for cloud computing skills?",
                  "Remote DevOps roles for freshers.",
                ].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-left max-w-xs">
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
                msg.role === 'user' ? 'bg-civic-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center">
                <Bot size={16} className="text-civic-700" />
              </div>
              <div className="bg-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-civic-600" />
                  <span className="text-sm text-gray-500">Agent is processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 lg:p-4">
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                mode === 'report' ? 'Describe your civic concern...' :
                mode === 'explore' ? 'Ask about an issue...' :
                'Describe skills and preferences...'
              }
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent"
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
      </div>

      {/* Agent Activity Sidebar — hidden on mobile */}
      <div className="hidden lg:block w-72 xl:w-80 border-l bg-gray-900">
        <AgentActivityPanel actions={agentActions} isProcessing={isProcessing} />
      </div>
    </div>
  )
}
