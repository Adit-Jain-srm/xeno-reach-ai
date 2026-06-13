import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchCampaigns } from '../services/api'
import { Users, Megaphone, Send, TrendingUp, Bot, ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value

  useEffect(() => {
    const duration = 1200
    const start = Date.now()
    const step = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.floor(numValue * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [numValue])

  return <>{display.toLocaleString()}{suffix}</>
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }

export default function Dashboard() {
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({ page_size: 5 }) })

  const metrics = [
    { label: 'Total Customers', value: overview?.total_customers || 0, icon: Users, color: 'from-blue-500 to-cyan-400' },
    { label: 'Active Campaigns', value: overview?.total_campaigns || 0, icon: Megaphone, color: 'from-violet-500 to-purple-400' },
    { label: 'Messages Sent', value: overview?.aggregate?.sent || 0, icon: Send, color: 'from-emerald-500 to-green-400' },
    { label: 'Delivery Rate', value: overview?.overall_delivery_rate || 0, suffix: '%', icon: TrendingUp, color: 'from-amber-500 to-orange-400' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-txt-secondary text-sm mt-1">Your BrewPulse marketing command center</p>
        </div>
        <Link to="/agent" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 hover:-translate-y-0.5">
          <Bot size={16} />
          Ask AI Agent
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map(({ label, value, suffix, icon: Icon, color }) => (
          <motion.div key={label} variants={item} className="glass rounded-xl p-5 hover:border-white/[0.12] transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-txt-muted text-xs font-medium uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                <Icon size={15} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              <AnimatedNumber value={value} suffix={suffix} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {campaigns?.data?.map((c: any) => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="block glass rounded-xl p-4 hover:border-white/[0.12] transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm group-hover:text-white transition-colors">{c.name}</h3>
                    <p className="text-xs text-txt-muted mt-1">{c.channels?.join(', ')} · {c.audience_count?.toLocaleString()} recipients</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    c.status === 'completed' ? 'bg-success/10 text-success' :
                    c.status === 'running' ? 'bg-info/10 text-info' :
                    c.status === 'failed' ? 'bg-error/10 text-error' :
                    'bg-white/5 text-txt-muted'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))}
            {!campaigns?.data?.length && (
              <div className="glass rounded-xl p-8 text-center">
                <Megaphone size={32} className="mx-auto text-txt-muted mb-3 opacity-40" />
                <p className="text-txt-muted text-sm">No campaigns yet</p>
                <Link to="/agent" className="text-accent text-xs mt-2 inline-block hover:underline">Create with AI →</Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Suggestion */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-lg font-semibold mb-4">AI Insight</h2>
          <div className="gradient-border rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm leading-relaxed text-txt-secondary">
                  <strong className="text-txt-primary">312 gold-tier customers</strong> show declining visit frequency. A personalized win-back campaign could recover <strong className="text-success">₹4.2L</strong> in monthly revenue.
                </p>
                <Link to="/agent" className="inline-flex items-center gap-1 mt-3 text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                  Let AI plan this
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
