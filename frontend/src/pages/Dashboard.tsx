import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchCampaigns } from '../services/api'
import { Users, Megaphone, Send, TrendingUp, Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({ page_size: 5 }) })

  const metrics = [
    { label: 'Total Customers', value: overview?.total_customers?.toLocaleString() || '—', icon: Users, color: 'text-blue-400' },
    { label: 'Active Campaigns', value: overview?.total_campaigns || '—', icon: Megaphone, color: 'text-purple-400' },
    { label: 'Messages Sent', value: overview?.aggregate?.sent?.toLocaleString() || '—', icon: Send, color: 'text-green-400' },
    { label: 'Delivery Rate', value: overview?.overall_delivery_rate ? `${overview.overall_delivery_rate}%` : '—', icon: TrendingUp, color: 'text-amber-400' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">BrewPulse marketing overview</p>
        </div>
        <Link to="/agent" className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg text-sm font-medium transition-colors">
          <Bot size={16} />
          Ask AI Agent
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-sm">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {campaigns?.data?.map((c: any) => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{c.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{c.channels?.join(', ')} • {c.audience_count} recipients</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    c.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                    c.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))}
            {!campaigns?.data?.length && (
              <p className="text-[var(--text-muted)] text-sm">No campaigns yet. Ask the AI Agent to create one!</p>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm">Based on your data, <strong>312 gold-tier customers</strong> show declining visit frequency. A personalized win-back campaign could recover ₹4.2L in monthly revenue.</p>
                <Link to="/agent" className="inline-block mt-3 text-sm text-[var(--primary)] hover:underline">
                  Let AI plan this campaign →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
