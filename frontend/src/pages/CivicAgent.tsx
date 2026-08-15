import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import AgentActivityPanel from '../components/AgentActivityPanel'
import { sendMessage, getAgentActions } from '../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function CivicAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [agentActions, setAgentActions] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll agent actions during processing
  useEffect(() => {
    if (!conversationId) return
    const interval = setInterval(() => {
      getAgentActions(conversationId)
        .then((res) => setAgentActions(res.agent_actions))
        .catch(() => {})
    }, 2000)
    return () => clearInterval(interval)
  }, [conversationId])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)

    try {
      const result = await sendMessage(userMsg.content, conversationId)
      setConversationId(result.conversation_id)

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Refresh agent actions
      if (result.conversation_id) {
        const actions = await getAgentActions(result.conversation_id)
        setAgentActions(actions.agent_actions)
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process request. Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Civic Agent</h1>
          <p className="text-sm text-gray-500">
            Report civic concerns, ask about issues, or find opportunities
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Bot size={48} className="mx-auto text-civic-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700">
                CJP Civic Agent
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                I can help you report civic concerns, track issues, find related
                problems, and discover job opportunities. Your reports become
                persistent civic memory.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "There aren't enough technology jobs for graduates in my area.",
                  'Continue with the issue we discussed yesterday.',
                  'Can you help find opportunities for Python developers?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs bg-civic-50 text-civic-700 px-3 py-2 rounded-lg hover:bg-civic-100 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-civic-700" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-civic-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
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
                  <span className="text-sm text-gray-500">
                    Agent is processing...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Report a civic concern or ask about an issue..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Agent Activity Sidebar */}
      <div className="w-80 border-l bg-gray-900 p-0">
        <AgentActivityPanel
          actions={agentActions}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  )
}
