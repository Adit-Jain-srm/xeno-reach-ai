import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchChannelPerformance, fetchCampaigns } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Tooltip, Badge } from '../components/ui'

const CHANNEL_EXPLANATIONS: Record<string, string> = {
  whatsapp: 'High delivery due to direct device push. Best for time-sensitive offers.',
  sms: 'Reliable delivery but lower engagement. Best for transactional messages.',
  email: 'Lower delivery due to spam filters. Best for rich content and newsletters.',
  rcs: 'Rich messaging with read receipts. Limited device support currently.',
}

export default function Analytics() {
  const { data: ov } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: channels } = useQuery({ queryKey: ['channels'], queryFn: fetchChannelPerformance })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns-all'], queryFn: () => fetchCampaigns({ page_size: 10 }) })

  const chartData = channels?.map((c: any) => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    channel: c.channel,
    delivery: c.delivery_rate,
    read: c.read_rate,
    click: c.click_rate,
  })) || []

  const campPerf = campaigns?.data?.filter((c: any) => c.campaign_stats?.[0]).map((c: any) => ({
    name: c.name.length > 25 ? c.name.slice(0, 25) + '...' : c.name,
    delivery: c.campaign_stats[0].delivery_rate || 0,
    open: c.campaign_stats[0].open_rate || 0,
  })) || []

  const trendData = campaigns?.data?.filter((c: any) => c.campaign_stats?.[0] && c.started_at).map((c: any) => ({
    date: new Date(c.started_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    delivery: c.campaign_stats[0].delivery_rate || 0,
    open: c.campaign_stats[0].open_rate || 0,
  })).reverse() || []

  const insights = generateInsights(ov, channels, campaigns?.data)
  const overallTrend = trendData.length >= 2
    ? trendData[trendData.length - 1].delivery - trendData[0].delivery
    : 0

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0 gap-3">
        <h1 className="text-md font-semibold text-txt-0">Analytics</h1>
        {overallTrend !== 0 && (
          <Badge variant={overallTrend > 0 ? 'success' : 'error'} animated>
            {overallTrend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {overallTrend > 0 ? 'Improving' : 'Declining'}
          </Badge>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'TOTAL REACH', value: ov?.aggregate?.sent?.toLocaleString() || '0', tip: 'Total messages sent across all campaigns' },
            { label: 'DELIVERY RATE', value: `${ov?.overall_delivery_rate || 0}%`, tip: 'Percentage of messages reaching recipient devices' },
            { label: 'OPEN RATE', value: `${ov?.overall_open_rate || 0}%`, tip: 'Percentage of delivered messages that were opened' },
            { label: 'CLICK RATE', value: `${ov?.overall_click_rate || 0}%`, tip: 'Percentage of opened messages where CTA was clicked' },
          ].map(m => (
            <div key={m.label} className="panel rounded-lg p-3">
              <Tooltip content={m.tip} side="bottom">
                <div className="text-2xs text-txt-4 font-medium tracking-wider cursor-help border-b border-dashed border-txt-4/30 inline-block">{m.label}</div>
              </Tooltip>
              <div className="data-value text-xl text-txt-0 mt-1">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Channel Performance */}
          <div className="panel rounded-lg p-4">
            <div className="text-xs font-medium text-txt-2 mb-3">Channel Performance (%)</div>
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }} />
                    <Bar dataKey="delivery" fill="#22c55e" radius={[3, 3, 0, 0]} name="Delivery" />
                    <Bar dataKey="read" fill="#6366f1" radius={[3, 3, 0, 0]} name="Read" />
                    <Bar dataKey="click" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Click" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5 pt-3 border-t border-border-subtle">
                  {chartData.map((ch: any) => (
                    <div key={ch.channel} className="flex items-center gap-2 text-2xs text-txt-3">
                      <span className="capitalize font-medium text-txt-2 w-16">{ch.name}</span>
                      <span className="flex-1">{CHANNEL_EXPLANATIONS[ch.channel] || ''}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="h-[200px] flex items-center justify-center text-txt-4 text-xs">No data</div>}
          </div>

          {/* Trend Line (if 3+ campaigns) */}
          {trendData.length >= 3 ? (
            <div className="panel rounded-lg p-4">
              <div className="text-xs font-medium text-txt-2 mb-3">Campaign Performance Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }} />
                  <Line type="monotone" dataKey="delivery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} name="Delivery %" />
                  <Line type="monotone" dataKey="open" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} name="Open %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="panel rounded-lg p-4">
              <div className="text-xs font-medium text-txt-2 mb-3">Campaign Comparison</div>
              {campPerf.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={campPerf} layout="vertical" barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={130} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }} />
                    <Bar dataKey="delivery" fill="#22c55e" radius={[0, 3, 3, 0]} name="Delivery %" />
                    <Bar dataKey="open" fill="#6366f1" radius={[0, 3, 3, 0]} name="Open %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[200px] flex items-center justify-center text-txt-4 text-xs">Run campaigns to see data</div>}
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        <div className="panel rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-txt-1">
            <Activity size={12} className="text-accent" /> AI-Generated Insights
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 p-2.5 rounded-md bg-bg-2 border border-border-subtle"
              >
                <span className="text-accent text-sm mt-0.5">•</span>
                <p className="text-xs text-txt-2 leading-relaxed flex-1">{insight}</p>
              </motion.div>
            ))}
          </div>
          <Link to="/agent" className="text-2xs text-accent hover:text-accent-light inline-flex items-center gap-1">
            Plan optimized campaign <ArrowUpRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function generateInsights(overview: any, channels: any[], campaigns: any[]) {
  const insights: string[] = []

  if (channels?.length > 1) {
    const sorted = [...channels].sort((a, b) => b.delivery_rate - a.delivery_rate)
    insights.push(`${sorted[0].channel} leads with ${sorted[0].delivery_rate}% delivery rate — ${(sorted[0].delivery_rate / Math.max(sorted[sorted.length - 1].delivery_rate, 1)).toFixed(1)}x better than ${sorted[sorted.length - 1].channel}.`)
  }

  if (channels?.some((c: any) => c.read_rate > 0)) {
    const bestRead = [...(channels || [])].sort((a: any, b: any) => b.read_rate - a.read_rate)[0]
    if (bestRead) {
      insights.push(`${bestRead.channel} has the highest read rate at ${bestRead.read_rate}% — ideal for engagement-focused campaigns.`)
    }
  }

  if (overview?.total_customers) {
    const convRate = overview.overall_click_rate || 0
    insights.push(`Overall click-through rate is ${convRate}%. Industry average for F&B is 2-4%. ${convRate >= 3 ? 'Above average — strong CTA performance.' : 'Below average — consider stronger CTAs or personalized offers.'}`)
  }

  if (campaigns?.length >= 3) {
    const completed = campaigns.filter((c: any) => c.status === 'completed' && c.campaign_stats?.[0])
    if (completed.length >= 2) {
      const avgDelivery = completed.reduce((sum: number, c: any) => sum + (c.campaign_stats[0].delivery_rate || 0), 0) / completed.length
      insights.push(`Average delivery rate across ${completed.length} completed campaigns is ${Math.round(avgDelivery)}%. ${avgDelivery > 90 ? 'Excellent audience quality.' : 'Consider cleaning inactive contacts.'}`)
    }
  }

  return insights.length > 0 ? insights : ['Run more campaigns to generate data-driven insights.']
}
