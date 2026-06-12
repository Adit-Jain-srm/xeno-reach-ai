import { useQuery } from '@tanstack/react-query'
import { fetchCampaigns } from '../services/api'
import { Link } from 'react-router-dom'
import { Megaphone, Plus } from 'lucide-react'

export default function Campaigns() {
  const { data, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({}) })

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400',
    running: 'bg-blue-500/10 text-blue-400',
    failed: 'bg-red-500/10 text-red-400',
    draft: 'bg-gray-500/10 text-gray-400',
    paused: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">All marketing campaigns</p>
        </div>
        <Link to="/agent" className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Create with AI
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--surface)] rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((campaign: any) => (
            <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--primary)]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Megaphone size={18} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {campaign.channels?.join(', ')} • {campaign.audience_count?.toLocaleString()} recipients
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {campaign.campaign_stats?.[0] && (
                    <div className="text-right text-xs text-[var(--text-muted)]">
                      <p>{campaign.campaign_stats[0].delivery_rate}% delivered</p>
                      <p>{campaign.campaign_stats[0].open_rate}% opened</p>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {!data?.data?.length && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
              <p>No campaigns yet. Ask the AI Agent to create one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
