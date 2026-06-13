import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchCampaigns, fetchChannelPerformance } from '../services/api'
import { TrendingUp, ArrowUpRight, Activity, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { data: ov } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: camps } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({ page_size: 8 }) })
  const { data: channels } = useQuery({ queryKey: ['channels'], queryFn: fetchChannelPerformance })

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-semibold text-txt-0">Overview</h1>
          <span className="badge bg-semantic-green/10 text-semantic-green">Live</span>
        </div>
        <Link to="/agent" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-dim transition-colors">
          <Zap size={11} /> New Campaign
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Top metrics strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-3">
          {[
            { label: 'CUSTOMERS', value: ov?.total_customers, fmt: (v: number) => v?.toLocaleString() },
            { label: 'CAMPAIGNS', value: ov?.total_campaigns },
            { label: 'DELIVERY RATE', value: ov?.overall_delivery_rate, fmt: (v: number) => `${v}%` },
            { label: 'MESSAGES SENT', value: ov?.aggregate?.sent, fmt: (v: number) => v?.toLocaleString() },
          ].map(({ label, value, fmt }) => (
            <div key={label} className="panel rounded-lg p-3">
              <div className="text-2xs text-txt-4 font-medium tracking-wider mb-1">{label}</div>
              <div className="data-value text-xl text-txt-0">{value ? (fmt ? fmt(value) : value) : '—'}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {/* Campaigns list — compact */}
          <div className="col-span-2 panel rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-medium text-txt-2">Recent Campaigns</span>
              <Link to="/campaigns" className="text-2xs text-accent hover:text-accent-light">View all →</Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {camps?.data?.map((c: any) => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="flex items-center px-3 py-2 hover:bg-bg-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-txt-0 truncate">{c.name}</div>
                    <div className="text-2xs text-txt-4 mt-0.5">{c.channels?.join(' · ')} · {c.audience_count?.toLocaleString()}</div>
                  </div>
                  <span className={`badge ${
                    c.status === 'completed' ? 'bg-semantic-green/10 text-semantic-green' :
                    c.status === 'running' ? 'bg-semantic-blue/10 text-semantic-blue' :
                    c.status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' :
                    'bg-bg-3 text-txt-4'
                  }`}>{c.status}</span>
                </Link>
              ))}
              {!camps?.data?.length && (
                <div className="px-3 py-6 text-center text-txt-4 text-xs">No campaigns yet</div>
              )}
            </div>
          </div>

          {/* Channel performance */}
          <div className="panel rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border-subtle">
              <span className="text-xs font-medium text-txt-2">Channel Performance</span>
            </div>
            <div className="p-3 space-y-3">
              {(channels || []).map((ch: any) => (
                <div key={ch.channel} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-txt-1 capitalize">{ch.channel}</span>
                    <span className="data-value text-xs text-txt-0">{ch.delivery_rate}%</span>
                  </div>
                  <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${ch.delivery_rate}%` }} />
                  </div>
                </div>
              ))}
              {!channels?.length && (
                <div className="text-center text-txt-4 text-2xs py-4">No data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight — compact */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel rounded-lg p-3 flex items-start gap-3 border-l-2 border-accent">
          <Activity size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-txt-1">
              <span className="text-txt-0 font-medium">312 gold-tier customers</span> show declining frequency. Win-back campaign → est. <span className="data-value text-semantic-green">₹4.2L</span> recovery.
            </p>
            <Link to="/agent" className="text-2xs text-accent hover:text-accent-light mt-1 inline-flex items-center gap-1">
              Plan with AI <ArrowUpRight size={10} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
