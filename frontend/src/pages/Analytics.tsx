import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchChannelPerformance, fetchCampaigns } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight } from 'lucide-react'

export default function Analytics() {
  const { data: ov } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: channels } = useQuery({ queryKey: ['channels'], queryFn: fetchChannelPerformance })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns-all'], queryFn: () => fetchCampaigns({ page_size: 10 }) })

  const chartData = channels?.map((c: any) => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    delivery: c.delivery_rate,
    read: c.read_rate,
    click: c.click_rate,
  })) || []

  const campPerf = campaigns?.data?.filter((c: any) => c.campaign_stats?.[0]).map((c: any) => ({
    name: c.name.length > 25 ? c.name.slice(0, 25) + '...' : c.name,
    delivery: c.campaign_stats[0].delivery_rate || 0,
    open: c.campaign_stats[0].open_rate || 0,
  })) || []

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-md font-semibold text-txt-0">Analytics</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'TOTAL REACH', value: ov?.aggregate?.sent?.toLocaleString() || '0' },
            { label: 'DELIVERY RATE', value: `${ov?.overall_delivery_rate || 0}%` },
            { label: 'OPEN RATE', value: `${ov?.overall_open_rate || 0}%` },
            { label: 'CLICK RATE', value: `${ov?.overall_click_rate || 0}%` },
          ].map(m => (
            <div key={m.label} className="panel rounded-lg p-3">
              <div className="text-2xs text-txt-4 font-medium tracking-wider">{m.label}</div>
              <div className="data-value text-xl text-txt-0 mt-1">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Channel Performance */}
          <div className="panel rounded-lg p-4">
            <div className="text-xs font-medium text-txt-2 mb-3">Channel Performance (%)</div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="delivery" fill="#22c55e" radius={[3, 3, 0, 0]} name="Delivery" />
                  <Bar dataKey="read" fill="#6366f1" radius={[3, 3, 0, 0]} name="Read" />
                  <Bar dataKey="click" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Click" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[200px] flex items-center justify-center text-txt-4 text-xs">No data</div>}
          </div>

          {/* Campaign Comparison */}
          <div className="panel rounded-lg p-4">
            <div className="text-xs font-medium text-txt-2 mb-3">Campaign Comparison</div>
            {campPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={campPerf} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="delivery" fill="#22c55e" radius={[0, 3, 3, 0]} name="Delivery %" />
                  <Bar dataKey="open" fill="#6366f1" radius={[0, 3, 3, 0]} name="Open %" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[200px] flex items-center justify-center text-txt-4 text-xs">Run campaigns to see data</div>}
          </div>
        </div>

        {/* AI Insight */}
        <div className="panel rounded-lg p-3 flex items-start gap-3 border-l-2 border-accent">
          <Activity size={13} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-txt-1">
              WhatsApp outperforms all channels at <span className="data-value text-semantic-green">{channels?.[0]?.delivery_rate || 95}%</span> delivery.
              Shift high-intent segments to WhatsApp; use Email for detailed content to gold/platinum tiers.
            </p>
            <Link to="/agent" className="text-2xs text-accent hover:text-accent-light mt-1.5 inline-flex items-center gap-1">
              Plan optimized campaign <ArrowUpRight size={10} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
