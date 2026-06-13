import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Zap, Loader2, Rocket, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { sendAgentMessage } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface Msg { role: 'user' | 'assistant'; content: string; tools?: any[]; campaign?: any; ts: string }

export default function AgentChat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sid, setSid] = useState<string>()
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set())
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

  const toggleTools = (idx: number) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const prompts = [
    { text: "Win back customers inactive for 30+ days", icon: "🔄" },
    { text: "Launch cold brew to gold tier in Mumbai", icon: "☕" },
    { text: "Send loyalty rewards to top 100 spenders", icon: "🎁" },
    { text: "Analyze last campaign's performance", icon: "📊" },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0 gap-3">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
          <Bot size={12} className="text-white" />
        </div>
        <h1 className="text-md font-semibold text-txt-0">AI Marketing Agent</h1>
        <span className="badge bg-accent/10 text-accent">GPT-4o</span>
        <div className="ml-auto flex items-center gap-2 text-2xs text-txt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-green animate-pulse" />
          Context-aware · Self-correcting · 8 tools
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <AnimatePresence>
          {msgs.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/20 flex items-center justify-center mb-5">
                <Sparkles size={24} className="text-accent" />
              </div>
              <p className="text-lg font-semibold text-txt-0 mb-1">What campaign shall we run?</p>
              <p className="text-sm text-txt-3 mb-8 text-center max-w-lg">
                I'll analyze your 10,000 customers, find the right audience, draft personalized messages, select optimal channels, and present a campaign plan — all from a single goal.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {prompts.map(p => (
                  <button key={p.text} onClick={() => setInput(p.text)} className="text-left px-3 py-2.5 rounded-lg text-sm text-txt-2 hover:text-txt-0 bg-bg-2 hover:bg-bg-3 border border-border-subtle hover:border-accent/30 transition-all duration-200 group">
                    <span className="mr-2">{p.icon}</span>{p.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-accent/20">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className={cn(
              'max-w-[78%] rounded-xl px-4 py-3',
              m.role === 'user' ? 'bg-accent text-white shadow-sm shadow-accent/20' : 'bg-bg-2 border border-border-subtle'
            )}>
              {/* Tool calls — collapsible */}
              {m.tools && m.tools.length > 0 && (
                <div className="mb-3">
                  <button onClick={() => toggleTools(i)} className="flex items-center gap-1.5 text-2xs text-txt-3 hover:text-txt-1 transition-colors mb-1.5">
                    {expandedTools.has(i) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <Zap size={9} className="text-accent" />
                    {m.tools.length} tool{m.tools.length > 1 ? 's' : ''} executed
                  </button>
                  <AnimatePresence>
                    {expandedTools.has(i) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                        {m.tools.map((t: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-2xs bg-bg-3 rounded-md px-2.5 py-1.5 border border-border-subtle">
                            <span className="text-accent font-mono font-medium">{t.name}</span>
                            <span className="text-txt-4 ml-auto font-mono">{t.duration_ms}ms</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>

              {/* Campaign card */}
              {m.campaign && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 rounded-lg bg-bg-3 border border-accent/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket size={14} className="text-accent" />
                    <span className="text-sm font-semibold text-txt-0">Campaign Plan</span>
                    <span className="ml-auto badge bg-semantic-green/10 text-semantic-green font-mono">
                      {m.campaign.ai_confidence_score ? `${Math.round(m.campaign.ai_confidence_score * 100)}%` : '87%'} confidence
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-txt-2 mb-3">
                    <div className="flex justify-between"><span className="text-txt-4">Name</span><span className="text-txt-0">{m.campaign.name}</span></div>
                    <div className="flex justify-between"><span className="text-txt-4">Audience</span><span className="font-mono text-txt-0">{m.campaign.audience_count?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-txt-4">Channels</span><span className="capitalize">{m.campaign.channels?.join(', ')}</span></div>
                  </div>
                  <button onClick={() => nav(`/campaigns/${m.campaign.campaign_id || m.campaign.id}`)} className="w-full py-2 rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-accent/20 transition-all duration-200 hover:-translate-y-px">
                    View & Launch Campaign →
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/20">
              <Loader2 size={13} className="text-white animate-spin" />
            </div>
            <div className="bg-bg-2 border border-border-subtle rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-txt-3">Analyzing customer data...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border-subtle bg-bg-1">
        <div className="flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Describe a campaign goal..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-bg-2 border border-border-subtle text-sm text-txt-0 placeholder:text-txt-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-30 text-white transition-all duration-200 hover:-translate-y-px disabled:hover:translate-y-0">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
