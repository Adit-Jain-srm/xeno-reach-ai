import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Zap, Loader2, Rocket, ChevronDown, ChevronRight, Sparkles, Plus, MessageSquare, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import { fetchAgentSessions } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '../components/ui'

interface ToolCallInfo {
  name: string
  arguments?: any
  result?: any
  duration_ms?: number
  status: 'running' | 'done'
}

interface StreamingState {
  tokens: string
  tools: ToolCallInfo[]
  statusStep: string
  campaignData: any | null
  confidenceScore: number | null
  isStreaming: boolean
}

interface Msg {
  role: 'user' | 'assistant'
  content: string
  tools?: ToolCallInfo[]
  campaign?: any
  confidence?: number
  ts: string
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  query_customers: 'Searching customer database',
  create_campaign: 'Creating campaign plan',
  get_segment_count: 'Counting matching audience',
  analyze_engagement: 'Analyzing engagement patterns',
  estimate_performance: 'Estimating delivery metrics',
  get_campaign_history: 'Reviewing past campaigns',
  recommend_channel: 'Selecting optimal channel',
  personalize_message: 'Crafting personalized message',
}

export default function AgentChat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sid, setSid] = useState<string>()
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set())
  const [streaming, setStreaming] = useState<StreamingState>({
    tokens: '', tools: [], statusStep: '', campaignData: null, confidenceScore: null, isStreaming: false
  })
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nav = useNavigate()

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['agent-sessions'],
    queryFn: fetchAgentSessions,
  })

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, streaming.tokens, streaming.tools.length])
  useEffect(() => { inputRef.current?.focus() }, [])

  const startNewSession = () => { setSid(undefined); setMsgs([]); setExpandedTools(new Set()) }

  const loadSession = async (sessionId: string) => {
    setSid(sessionId)
    try {
      const { data } = await import('../services/api').then(m => m.api.get(`/agent/sessions/${sessionId}`))
      if (data?.messages) {
        setMsgs(data.messages.map((m: any) => ({
          role: m.role, content: m.content, ts: m.timestamp || new Date().toISOString(),
        })))
      }
    } catch { /* ignore */ }
  }

  const sendStreaming = useCallback(async () => {
    if (!input.trim() || streaming.isStreaming) return
    const text = input.trim()
    setInput('')
    setMsgs(p => [...p, { role: 'user', content: text, ts: new Date().toISOString() }])
    setStreaming({ tokens: '', tools: [], statusStep: 'Connecting...', campaignData: null, confidenceScore: null, isStreaming: true })

    const API_URL = import.meta.env.VITE_API_URL || '/api'

    try {
      const response = await fetch(`${API_URL}/agent/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sid }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let buffer = ''
      let accumulatedTokens = ''
      const accumulatedTools: ToolCallInfo[] = []
      let campaignData: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw)

            switch (event.type) {
              case 'status':
                setStreaming(s => ({ ...s, statusStep: event.data.step }))
                break
              case 'tool_start':
                accumulatedTools.push({ name: event.data.name, arguments: event.data.arguments, status: 'running' })
                setStreaming(s => ({ ...s, tools: [...accumulatedTools], statusStep: TOOL_DESCRIPTIONS[event.data.name] || `Running ${event.data.name}...` }))
                break
              case 'tool_end': {
                const idx = accumulatedTools.findIndex(t => t.name === event.data.name && t.status === 'running')
                if (idx >= 0) {
                  accumulatedTools[idx] = { ...accumulatedTools[idx], result: event.data.result, duration_ms: event.data.duration_ms, status: 'done' }
                }
                setStreaming(s => ({ ...s, tools: [...accumulatedTools] }))
                break
              }
              case 'campaign_created':
                campaignData = event.data
                setStreaming(s => ({ ...s, campaignData: event.data }))
                break
              case 'stream_start':
                setStreaming(s => ({ ...s, statusStep: '' }))
                break
              case 'token':
                accumulatedTokens += event.data.content
                setStreaming(s => ({ ...s, tokens: accumulatedTokens }))
                break
              case 'stream_end':
                break
              case 'done':
                break
              case 'end':
                if (event.data?.session_id && !sid) {
                  setSid(event.data.session_id)
                }
                break
            }
          } catch { /* skip malformed JSON */ }
        }
      }

      // Finalize: move streaming state into messages
      setMsgs(p => [...p, {
        role: 'assistant',
        content: accumulatedTokens,
        tools: accumulatedTools.length > 0 ? accumulatedTools : undefined,
        campaign: campaignData,
        ts: new Date().toISOString(),
      }])
      setStreaming({ tokens: '', tools: [], statusStep: '', campaignData: null, confidenceScore: null, isStreaming: false })
      refetchSessions()
    } catch (e: any) {
      setMsgs(p => [...p, { role: 'assistant', content: `Error: ${e.message}`, ts: new Date().toISOString() }])
      setStreaming({ tokens: '', tools: [], statusStep: '', campaignData: null, confidenceScore: null, isStreaming: false })
    }
  }, [input, streaming.isStreaming, sid, refetchSessions])

  const toggleTools = (idx: number) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const prompts = [
    { text: "Win back customers inactive for 30+ days", icon: "🔄", mode: "execute" },
    { text: "What campaign should I run this week?", icon: "🧠", mode: "think" },
    { text: "Send loyalty rewards to top 100 spenders", icon: "🎁", mode: "execute" },
    { text: "Compare channels — which works best for us?", icon: "📊", mode: "think" },
    { text: "Launch cold brew promo to gold tier Mumbai", icon: "☕", mode: "execute" },
    { text: "Help me decide: retention vs acquisition", icon: "💡", mode: "think" },
  ]

  return (
    <div className="h-full flex">
      {/* Session Sidebar */}
      <div className="w-[220px] h-full border-r border-border-subtle flex flex-col flex-shrink-0 bg-bg-1">
        <div className="h-12 flex items-center justify-between px-3 border-b border-border-subtle">
          <span className="text-xs font-semibold text-txt-2">Sessions</span>
          <button onClick={startNewSession} className="p-1.5 rounded-md hover:bg-bg-3 text-txt-3 hover:text-accent transition-colors" title="New chat">
            <Plus size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5">
          {sessions?.map((s: any) => (
            <button key={s.id} onClick={() => loadSession(s.id)} className={cn(
              'w-full text-left px-3 py-2 text-xs transition-colors truncate',
              sid === s.id ? 'bg-bg-3 text-txt-0' : 'text-txt-3 hover:bg-bg-2 hover:text-txt-1'
            )}>
              <div className="flex items-center gap-2">
                <MessageSquare size={11} className={sid === s.id ? 'text-accent' : 'text-txt-4'} />
                <span className="truncate flex-1">{s.preview || 'New conversation'}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-2xs text-txt-4 pl-5">
                <Clock size={8} />
                {new Date(s.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
          {!sessions?.length && (
            <div className="px-3 py-4 text-2xs text-txt-4 text-center">No sessions yet</div>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0 gap-3">
          <div className="w-6 h-6 rounded-md bg-carbon flex items-center justify-center">
            <Bot size={12} className="text-white" />
          </div>
          <h1 className="text-md font-semibold text-txt-0">AI Marketing Agent</h1>
          <Badge variant="accent">GPT-4o</Badge>
          <div className="ml-auto flex items-center gap-2 text-2xs text-txt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-green animate-pulse" />
            Thinks · Decides · Executes · 8 tools
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <AnimatePresence>
            {msgs.length === 0 && !streaming.isStreaming && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 rounded-2xl bg-signal/10 border border-signal/20 flex items-center justify-center mb-5">
                <Sparkles size={24} className="text-signal" />
                </div>
              <p className="text-lg font-semibold text-txt-0 mb-1">Think, decide, or execute.</p>
              <p className="text-sm text-txt-3 mb-8 text-center max-w-lg">
                Ask me to analyze your data, compare strategies, or just give me a goal and I'll execute the full campaign — audience, message, channel, delivery.
              </p>
              <div className="grid grid-cols-3 gap-2 w-full max-w-2xl">
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
                <div className="w-7 h-7 rounded-lg bg-carbon flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={cn(
                'max-w-[78%] rounded-xl px-4 py-3',
                m.role === 'user' ? 'bg-carbon text-white' : 'bg-bg-1 border border-border'
              )}>
                {/* Tool calls */}
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
                          {m.tools.map((t, j) => (
                            <div key={j} className="flex items-center gap-2 text-2xs bg-bg-3 rounded-md px-2.5 py-1.5 border border-border-subtle">
                              <CheckCircle2 size={10} className="text-semantic-green" />
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
                      <span className="text-sm font-semibold text-txt-0">Campaign Ready</span>
                      {m.confidence && (
                        <Badge variant="success" animated className="ml-auto">
                          {Math.round(m.confidence)}% confidence
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 text-xs text-txt-2 mb-3">
                      <div className="flex justify-between"><span className="text-txt-4">Name</span><span className="text-txt-0 font-medium">{m.campaign.name}</span></div>
                      <div className="flex justify-between"><span className="text-txt-4">Audience</span><span className="font-mono text-txt-0">{m.campaign.audience_count?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-txt-4">Channels</span><span className="capitalize">{m.campaign.channels?.join(', ')}</span></div>
                    </div>
                    <button onClick={() => nav(`/campaigns/${m.campaign.id}`)} className="w-full py-2.5 rounded-xl bg-carbon text-white text-sm font-medium hover:bg-graphite transition-all flex items-center justify-center gap-1.5">
                      View & Launch <ArrowRight size={12} />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Live streaming state */}
          {streaming.isStreaming && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-carbon flex items-center justify-center flex-shrink-0 mt-0.5">
                <Loader2 size={13} className="text-white animate-spin" />
              </div>
              <div className="max-w-[78%] rounded-xl px-4 py-3 bg-bg-2 border border-border-subtle space-y-3">
                {/* Status step */}
                {streaming.statusStep && !streaming.tokens && (
                  <div className="flex items-center gap-2 text-xs text-txt-3">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>{streaming.statusStep}</span>
                  </div>
                )}

                {/* Live tool call cards */}
                {streaming.tools.length > 0 && (
                  <div className="space-y-1.5">
                    {streaming.tools.map((t, i) => (
                      <motion.div
                        key={`${t.name}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'flex items-center gap-2 text-2xs rounded-md px-2.5 py-2 border',
                          t.status === 'running'
                            ? 'bg-accent/5 border-accent/20'
                            : 'bg-bg-3 border-border-subtle'
                        )}
                      >
                        {t.status === 'running' ? (
                          <Loader2 size={10} className="text-accent animate-spin" />
                        ) : (
                          <CheckCircle2 size={10} className="text-semantic-green" />
                        )}
                        <span className="font-mono font-medium text-accent">{t.name}</span>
                        <span className="text-txt-4 truncate flex-1">
                          {t.status === 'running'
                            ? TOOL_DESCRIPTIONS[t.name] || 'Processing...'
                            : t.result?.count !== undefined
                              ? `→ ${t.result.count.toLocaleString()} results`
                              : t.result?.id
                                ? `→ Created`
                                : '→ Done'
                          }
                        </span>
                        {t.duration_ms !== undefined && (
                          <span className="text-txt-4 font-mono ml-auto">{t.duration_ms}ms</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Streaming tokens with cursor */}
                {streaming.tokens && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-txt-1">
                    {streaming.tokens}
                    <span className="inline-block w-[2px] h-[14px] bg-accent animate-pulse ml-0.5 align-middle" />
                  </p>
                )}

                {/* Live campaign card */}
                {streaming.campaignData && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-lg bg-bg-3 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket size={12} className="text-accent" />
                      <span className="text-xs font-semibold text-txt-0">Campaign Created</span>
                      <Badge variant="success" animated className="ml-auto">Ready</Badge>
                    </div>
                    <div className="space-y-1 text-2xs text-txt-2">
                      <div className="flex justify-between"><span className="text-txt-4">Name</span><span className="text-txt-0">{streaming.campaignData.name}</span></div>
                      <div className="flex justify-between"><span className="text-txt-4">Audience</span><span className="font-mono">{streaming.campaignData.audience_count?.toLocaleString()}</span></div>
                    </div>
                  </motion.div>
                )}
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
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendStreaming()}
              placeholder="Describe a campaign goal..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-bg-2 border border-border-subtle text-sm text-txt-0 placeholder:text-txt-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
              disabled={streaming.isStreaming}
            />
            <button onClick={sendStreaming} disabled={streaming.isStreaming || !input.trim()} className="px-4 py-2.5 rounded-xl bg-carbon hover:bg-graphite disabled:opacity-30 text-white transition-all disabled:hover:translate-y-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
