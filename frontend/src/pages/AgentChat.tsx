import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Rocket } from 'lucide-react'
import { sendAgentMessage } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tool_calls?: any[]
  campaign_plan?: any
  timestamp: string
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }])
    setLoading(true)

    try {
      const response = await sendAgentMessage(userMessage, sessionId)
      if (response.session_id) setSessionId(response.session_id)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        tool_calls: response.tool_calls,
        campaign_plan: response.campaign_plan,
        timestamp: new Date().toISOString(),
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.response?.data?.message || err.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`)
  }

  const suggestions = [
    "Win back customers who haven't ordered in 30 days",
    "Launch our new cold brew to premium customers in Mumbai",
    "Send a loyalty reward to our most active customers this month",
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Bot size={18} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Marketing Agent</h1>
            <p className="text-xs text-[var(--text-muted)]">Describe a goal and I'll plan the campaign</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">What campaign shall we run?</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-md mb-6">
              Describe your marketing goal and I'll analyze your customer data, recommend channels, craft messages, and present a campaign plan.
            </p>
            <div className="space-y-2 w-full max-w-lg">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} className="w-full text-left px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm hover:border-[var(--primary)]/50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} className="text-[var(--primary)]" />
              </div>
            )}
            <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)]'} rounded-2xl px-4 py-3`}>
              {/* Tool calls visualization */}
              {msg.tool_calls && msg.tool_calls.length > 0 && (
                <div className="mb-3 space-y-2">
                  {msg.tool_calls.map((tc: any, j: number) => (
                    <div key={j} className="text-xs bg-[var(--bg)] rounded-lg px-3 py-2 border border-[var(--border)]">
                      <span className="text-[var(--primary)] font-medium">⚡ {tc.name}</span>
                      <span className="text-[var(--text-muted)] ml-2">{tc.duration_ms}ms</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Campaign Plan Card */}
              {msg.campaign_plan && (
                <div className="mt-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket size={16} className="text-[var(--primary)]" />
                    <span className="font-semibold text-sm">Campaign Ready</span>
                    <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                      Confidence: {msg.campaign_plan.confidence_score || 85}%
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[var(--text-muted)]">
                    <p><strong>Name:</strong> {msg.campaign_plan.name}</p>
                    <p><strong>Audience:</strong> {msg.campaign_plan.audience_count?.toLocaleString()} customers</p>
                    <p><strong>Channels:</strong> {msg.campaign_plan.channels?.join(', ')}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(msg.campaign_plan.campaign_id || msg.campaign_plan.id)}
                    className="mt-3 w-full py-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View & Launch Campaign →
                  </button>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-1">
                <User size={16} className="text-[var(--text-muted)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-[var(--primary)]" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                Analyzing your customer data...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Describe a marketing goal..."
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
