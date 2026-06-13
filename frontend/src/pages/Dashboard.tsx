import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchCampaigns, fetchChannelPerformance } from '../services/api'
import { TrendingUp, ArrowUpRight, Activity, Zap, Users, Megaphone, Send, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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

export default function Dashboard() {
  const { data: ov, isLoading } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: camps } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({ page_size: 8 }) })
  const { data: channels } = useQuery({ queryKey: ['channels'], queryFn: fetchChannelPerformance })

  const metrics = [
    { label: 'Total Customers', value: ov?.total_customers || 0, icon: Users, gradient: 'from-blue-500 to-cyan-400' },
    { label: 'Campaigns Run', value: ov?.total_campaigns || 0, icon: Megaphone, gradient: 'from-purple-500 to-pink-400' },
    { label: 'Messages Sent', value: ov?.aggregate?.sent || 0, icon: Send, gradient: 'from-emerald-500 to-teal-400' },
    { label: 'Delivery Rate', value: ov?.overall_delivery_rate || 0, suffix: '%', icon: Target, gradient: 'from-amber-500 to-orange-400' },
  ]

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-semibold text-txt-0">Dashboard</h1>
          <span className="badge bg-semantic-green/10 text-semantic-green">Live</span>
        </div>
        <Link to="/agent" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-accent/20 transition-all duration-200 hover:-translate-y-px">
          <Zap size={12} /> New Campaign with AI
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Metrics */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-3">
          {metrics.map(({ label, value, suffix, icon: Icon, gradient }) => (
            <motion.div key={label} variants={fadeUp} className="panel rounded-xl p-4 hover:border-border transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs text-txt-4 font-medium uppercase tracking-wider">{label}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200`}>
                  <Icon size={14} className="text-white" />
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-txt-0">
                {isLoading ? <div className="w-16 h-6 bg-bg-3 rounded animate-pulse" /> : <AnimNum value={value} suffix={suffix} />}
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

        {/* AI Insight */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="panel rounded-xl p-4 border-l-[3px] border-l-accent">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/20">
              <Activity size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-txt-1 leading-relaxed">
                <span className="font-semibold text-txt-0">312 gold-tier customers</span> show declining visit frequency.
                Win-back campaign with personalized offers could recover <span className="font-mono font-semibold text-semantic-green">₹4.2L</span>/month.
              </p>
              <Link to="/agent" className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:text-accent-light font-medium transition-colors">
                Plan this campaign <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
