import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchChannelPerformance, fetchCampaigns } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Send, Target, Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Analytics() {
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: channels } = useQuery({ queryKey: ['channel-performance'], queryFn: fetchChannelPerformance })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns-recent'], queryFn: () => fetchCampaigns({ page_size: 10 }) })

  const CHANNEL_COLORS: Record<string, string> = {
    whatsapp: '#22c55e',
    sms: '#3b82f6',
    email: '#a855f7',
    rcs: '#f59e0b',
  }

  const channelChartData = channels?.map((c: any) => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    delivery: c.delivery_rate,
    read: c.read_rate,
    click: c.click_rate,
    total: c.total,
  })) || []

  const pieData = channels?.map((c: any) => ({
    name: c.channel,
    value: c.total,
    color: CHANNEL_COLORS[c.channel] || '#6366f1',
  })) || []

  const campaignPerformance = campaigns?.data?.filter((c: any) => c.campaign_stats?.[0])
    .map((c: any) => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name,
      delivery: c.campaign_stats[0].delivery_rate || 0,
      open: c.campaign_stats[0].open_rate || 0,
      click: c.campaign_stats[0].click_rate || 0,
    })) || []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Campaign and channel performance insights</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reach', value: overview?.aggregate?.sent?.toLocaleString() || '0', icon: Send, color: 'text-blue-400', sub: 'messages sent' },
          { label: 'Delivery Rate', value: `${overview?.overall_delivery_rate || 0}%`, icon: Target, color: 'text-emerald-400', sub: 'avg across campaigns' },
          { label: 'Engagement', value: `${overview?.overall_open_rate || 0}%`, icon: TrendingUp, color: 'text-amber-400', sub: 'open rate' },
          { label: 'Audience', value: overview?.total_customers?.toLocaleString() || '0', icon: Users, color: 'text-purple-400', sub: 'total customers' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Channel Performance Bar Chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Channel Performance (%)</h2>
          {channelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Bar dataKey="delivery" fill="#22c55e" name="Delivery %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="read" fill="#a855f7" name="Read %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="click" fill="#f59e0b" name="Click %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[var(--text-muted)] text-sm">No channel data yet</div>
          )}
        </div>

        {/* Message Volume by Channel */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Message Volume by Channel</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="capitalize">{entry.name}</span>
                    <span className="text-[var(--text-muted)] ml-auto">{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--text-muted)] text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Campaign Performance Comparison */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Campaign Performance Comparison</h2>
        {campaignPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={150} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="delivery" fill="#22c55e" name="Delivery %" radius={[0, 4, 4, 0]} />
              <Bar dataKey="open" fill="#a855f7" name="Open %" radius={[0, 4, 4, 0]} />
              <Bar dataKey="click" fill="#f59e0b" name="Click %" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-[var(--text-muted)] text-sm">Complete some campaigns to see performance data</div>
        )}
      </div>

      {/* AI Suggestion */}
      <div className="bg-gradient-to-r from-[var(--primary)]/5 to-purple-500/5 border border-[var(--primary)]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
            <Bot size={20} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">AI Insight</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Based on your campaign data, WhatsApp consistently outperforms other channels with {channels?.[0]?.delivery_rate || 95}% delivery rate.
              Consider shifting more campaigns to WhatsApp for high-intent segments, and use Email for longer-form content to gold/platinum tier customers.
            </p>
            <Link to="/agent" className="inline-block mt-3 text-sm text-[var(--primary)] hover:underline font-medium">
              Ask AI to plan an optimized campaign →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
