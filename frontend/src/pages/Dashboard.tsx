import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchCampaigns, fetchChannelPerformance } from '../services/api'
import { TrendingUp, ArrowUpRight, Activity, Zap, Users, Megaphone, Send, Target, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Tooltip, Badge } from '../components/ui'

function AnimNum({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const d = 1000; const s = Date.now()
    const step = () => { const p = Math.min((Date.now() - s) / d, 1); setN(Math.floor(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }, [value])
  return <>{n.toLocaleString()}{suffix}</>
}

function ProgressRing({ value, size = 40, stroke = 3, color = 'stroke-accent' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-bg-3" />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} className={color}
        strokeLinecap="round" initial={{ strokeDasharray: `0 ${c}` }} animate={{ strokeDasharray: `${(value / 100) * c} ${c}` }}
        transition={{ duration: 1.2, ease: 'easeOut' }} />
    </svg>
  )
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

function generateSuggestions(overview: any, channels: any[]) {
  const suggestions: { text: string; category: string }[] = []

  if (overview?.total_customers) {
    const inactive = Math.round(overview.total_customers * 0.18)
    suggestions.push({
      text: `${inactive.toLocaleString()} customers haven't ordered in 30+ days. A win-back campaign with personalized offers could recover ₹${Math.round(inactive * 280 / 100000)}L/month.`,
      category: 'Retention',
    })
  }

  if (channels?.length > 1) {
    const sorted = [...(channels || [])].sort((a: any, b: any) => (b.read_rate || 0) - (a.read_rate || 0))
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    if (best && worst && best.channel !== worst.channel) {
      suggestions.push({
        text: `${best.channel} outperforms ${worst.channel} by ${((best.read_rate || 0) / Math.max(worst.read_rate || 1, 1)).toFixed(1)}x in open rate. Consider shifting ${worst.channel} audience.`,
        category: 'Channel',
      })
    }
  }

  if (overview?.total_campaigns < 3) {
    suggestions.push({
      text: 'Only a few campaigns run. Platinum customers respond best to personalized offers — try a loyalty reward campaign.',
      category: 'Growth',
    })
  } else {
    suggestions.push({
      text: `With ${overview?.total_campaigns} campaigns, you have enough data for A/B testing. Try varying message tone or send times.`,
      category: 'Optimize',
    })
  }

  return suggestions.slice(0, 3)
}

export default function Dashboard() {
  const { data: ov, isLoading } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: camps } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({ page_size: 8 }) })
  const { data: channels } = useQuery({ queryKey: ['channels'], queryFn: fetchChannelPerformance })

  const metrics = [
    { label: 'Total Customers', value: ov?.total_customers || 0, icon: Users, tooltip: 'Active customer profiles in the BrewPulse database' },
    { label: 'Campaigns Run', value: ov?.total_campaigns || 0, icon: Megaphone, tooltip: 'Total marketing campaigns created and launched' },
    { label: 'Messages Sent', value: ov?.aggregate?.sent || 0, icon: Send, tooltip: 'Total messages dispatched across all channels' },
    { label: 'Delivery Rate', value: ov?.overall_delivery_rate || 0, suffix: '%', icon: Target, tooltip: 'Percentage of sent messages that reached recipient devices' },
  ]

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-semibold text-txt-0">Dashboard</h1>
          <span className="badge bg-semantic-green/10 text-semantic-green">Live</span>
        </div>
        <Link to="/agent" className="btn-pill btn-pill-filled text-sm gap-1.5">
          <Zap size={12} /> New Campaign with AI
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Metrics */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
          {metrics.map(({ label, value, suffix, icon: Icon, tooltip }) => (
            <motion.div key={label} variants={fadeUp} whileHover={{ y: -2, rotateX: 1, rotateY: -1 }} className="panel card-3d p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-between mb-3">
                <Tooltip content={tooltip} side="bottom">
                  <span className="text-xs text-txt-2 font-medium cursor-help border-b border-dashed border-txt-4/30">{label}</span>
                </Tooltip>
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:shadow-glow-sm transition-all duration-300">
                  <Icon size={16} className="text-accent-light" />
                </div>
              </div>
              <div className="relative font-mono text-3xl font-bold text-txt-0 tracking-tight">
                {isLoading ? <div className="w-16 h-7 bg-bg-3 rounded animate-pulse" /> : <AnimNum value={value} suffix={suffix} />}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {/* Campaigns */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="col-span-2 panel rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-semibold text-txt-1">Recent Campaigns</span>
              <Link to="/campaigns" className="text-2xs text-accent hover:text-accent-light font-medium">View all →</Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {camps?.data?.map((c: any) => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="flex items-center px-4 py-3 hover:bg-bg-2 transition-colors group">
                  <div className="mr-3">
                    <ProgressRing value={c.campaign_stats?.[0]?.delivery_rate || 0} size={36} stroke={3} color={c.status === 'completed' ? 'stroke-semantic-green' : c.status === 'running' ? 'stroke-accent' : 'stroke-txt-4'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-txt-0 font-medium group-hover:text-accent transition-colors truncate">{c.name}</div>
                    <div className="text-2xs text-txt-4 mt-0.5">{c.channels?.join(' · ')} · {c.audience_count?.toLocaleString()} recipients</div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      c.status === 'completed' ? 'bg-semantic-green/10 text-semantic-green' :
                      c.status === 'running' ? 'bg-semantic-blue/10 text-semantic-blue' :
                      c.status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' :
                      'bg-bg-3 text-txt-4'
                    }`}>{c.status}</span>
                    {c.campaign_stats?.[0] && (
                      <div className="text-2xs text-txt-4 mt-1 font-mono">{c.campaign_stats[0].delivery_rate}% dlv</div>
                    )}
                  </div>
                </Link>
              ))}
              {!camps?.data?.length && (
                <div className="px-4 py-8 text-center text-txt-4 text-xs">
                  No campaigns yet. <Link to="/agent" className="text-accent">Create with AI →</Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Channel Performance */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="panel rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border-subtle">
              <span className="text-xs font-semibold text-txt-1">Channel Performance</span>
            </div>
            <div className="p-4 space-y-4">
              {(channels || []).map((ch: any) => {
                const colors: Record<string, string> = { whatsapp: 'bg-semantic-green', sms: 'bg-semantic-blue', email: 'bg-purple-500', rcs: 'bg-semantic-amber' }
                return (
                  <div key={ch.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-txt-1 capitalize font-medium">{ch.channel}</span>
                      <span className="font-mono text-xs text-txt-0 font-semibold">{ch.delivery_rate}%</span>
                    </div>
                    <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${ch.delivery_rate}%` }} transition={{ duration: 1, delay: 0.3 }} className={`h-full ${colors[ch.channel] || 'bg-accent'} rounded-full`} />
                    </div>
                    <div className="flex justify-between text-2xs text-txt-4">
                      <span>Open: {ch.read_rate}%</span>
                      <span>Click: {ch.click_rate}%</span>
                    </div>
                  </div>
                )
              })}
              {!channels?.length && <div className="text-center text-txt-4 text-2xs py-4">No channel data</div>}
            </div>
          </motion.div>
        </div>

        {/* Proactive AI Suggestions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={12} className="text-accent" />
            <span className="text-xs font-semibold text-txt-2">AI Suggestions</span>
          </div>
          {generateSuggestions(ov, channels).map((suggestion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="panel rounded-xl p-4 border-l-[3px] border-l-accent hover:border-l-accent-light transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                  <Activity size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-txt-1 leading-relaxed">{suggestion.text}</p>
                  <Link to="/agent" className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:text-accent-light font-medium transition-colors">
                    Plan with AI <ArrowUpRight size={11} />
                  </Link>
                </div>
                <Badge variant="accent">{suggestion.category}</Badge>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
