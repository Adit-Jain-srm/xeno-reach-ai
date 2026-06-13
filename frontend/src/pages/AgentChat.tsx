import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Zap, Loader2, CheckCircle2, Rocket } from 'lucide-react'
import { sendAgentMessage } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn'

interface Msg { role: 'user' | 'assistant'; content: string; tools?: any[]; campaign?: any; ts: string }

export default function AgentChat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sid, setSid] = useState<string>()
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nav = useNavigate()

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  useEffect(() => { inputRef.current?.focus() }, [])

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMsgs(p => [...p, { role: 'user', content: text, ts: new Date().toISOString() }])
    setLoading(true)
    try {
      const r = await sendAgentMessage(text, sid)
      if (r.session_id) setSid(r.session_id)
      setMsgs(p => [...p, { role: 'assistant', content: r.message, tools: r.tool_calls, campaign: r.campaign_plan, ts: new Date().toISOString() }])
    } catch (e: any) {
      setMsgs(p => [...p, { role: 'assistant', content: `Error: ${e.response?.data?.message || e.message}`, ts: new Date().toISOString() }])
    } finally { setLoading(false) }
  }, [input, loading, sid])

  const prompts = [
    "Win back customers inactive for 30+ days",
    "Launch cold brew campaign to gold tier in Mumbai",
    "Send loyalty rewards to top 100 customers",
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0">
        <Bot size={14} className="text-accent mr-2" />
        <h1 className="text-md font-semibold text-txt-0">AI Agent</h1>
        <span className="badge bg-accent/10 text-accent ml-2">GPT-4o</span>
        <span className="text-2xs text-txt-4 ml-auto">Context-aware · Function calling · Self-correction</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {msgs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 rounded-lg bg-bg-3 border border-border flex items-center justify-center mb-4">
              <Bot size={18} className="text-accent" />
            </div>
            <p className="text-md font-medium text-txt-0 mb-1">Marketing Agent Ready</p>
            <p className="text-xs text-txt-3 mb-6 text-center max-w-md">Describe a campaign goal. I'll analyze your 10K customers, find the audience, draft messages, and execute.</p>
            <div className="space-y-2 w-full max-w-lg">
              {prompts.map(p => (
                <button key={p} onClick={() => setInput(p)} className="w-full text-left px-3 py-2 rounded-md text-sm text-txt-2 hover:text-txt-0 hover:bg-bg-2 border border-border-subtle hover:border-border transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-bg-3 border border-border-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={12} className="text-accent" />
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-lg px-3 py-2',
              m.role === 'user' ? 'bg-accent text-white' : 'panel-raised'
            )}>
              {/* Tool calls */}
              {m.tools && m.tools.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {m.tools.map((t: any, j: number) => (
                    <span key={j} className="inline-flex items-center gap-1 badge bg-bg-3 text-txt-2 border border-border-subtle">
                      <Zap size={8} className="text-accent" />{t.name}
                      <span className="text-txt-4">{t.duration_ms}ms</span>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {/* Campaign card */}
              {m.campaign && (
                <div className="mt-3 p-3 rounded-md bg-bg-3 border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Rocket size={12} className="text-accent" />
                    <span className="text-xs font-semibold text-txt-0">Campaign Ready</span>
                    <span className="badge bg-semantic-green/10 text-semantic-green ml-auto">
                      {m.campaign.ai_confidence_score ? `${Math.round(m.campaign.ai_confidence_score * 100)}%` : '85%'}
                    </span>
                  </div>
                  <div className="text-2xs text-txt-3 space-y-0.5">
                    <div><span className="text-txt-4">Name:</span> {m.campaign.name}</div>
                    <div><span className="text-txt-4">Audience:</span> <span className="data-value">{m.campaign.audience_count?.toLocaleString()}</span></div>
                    <div><span className="text-txt-4">Channels:</span> {m.campaign.channels?.join(', ')}</div>
                  </div>
                  <button onClick={() => nav(`/campaigns/${m.campaign.campaign_id || m.campaign.id}`)} className="w-full py-1.5 rounded bg-accent hover:bg-accent-dim text-white text-xs font-medium transition-colors">
                    View & Launch →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded bg-bg-3 border border-border-subtle flex items-center justify-center flex-shrink-0">
              <Loader2 size={12} className="text-accent animate-spin" />
            </div>
            <div className="panel-raised rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-txt-3">
                <span className="w-4 h-0.5 bg-accent rounded-full animate-pulse" />
                Processing...
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Describe a campaign goal..."
            className="flex-1 px-3 py-2 rounded-md bg-bg-2 border border-border-subtle text-sm text-txt-0 placeholder:text-txt-4 focus:outline-none focus:border-accent/50 transition-colors"
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="px-3 py-2 rounded-md bg-accent hover:bg-accent-dim disabled:opacity-30 text-white transition-colors">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
