import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchCampaign, fetchCampaignStats, fetchCampaignComms, launchCampaign } from '../services/api'
import { useCampaignStatsRealtime } from '../hooks/useRealtime'
import { ArrowLeft, Rocket } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [launching, setLaunching] = useState(false)

  const { data: campaign, refetch } = useQuery({ queryKey: ['campaign', id], queryFn: () => fetchCampaign(id!), enabled: !!id })
  const { data: stats } = useQuery({ queryKey: ['stats', id], queryFn: () => fetchCampaignStats(id!), enabled: !!id, refetchInterval: campaign?.status === 'running' ? 2000 : false })
  const { data: comms } = useQuery({ queryKey: ['comms', id], queryFn: () => fetchCampaignComms(id!, { page_size: 30 }), enabled: !!id, refetchInterval: campaign?.status === 'running' ? 4000 : false })

  const rt = useCampaignStatsRealtime(campaign?.status === 'running' ? id : undefined)
  const s = rt || stats

  const handleLaunch = async () => { setLaunching(true); try { await launchCampaign(id!); refetch() } finally { setLaunching(false) } }

  const funnel = [
    { label: 'SENT', value: s?.total_sent || 0, color: 'bg-semantic-blue' },
    { label: 'DELIVERED', value: s?.total_delivered || 0, color: 'bg-semantic-green' },
    { label: 'OPENED', value: s?.total_opened || 0, color: 'bg-semantic-amber' },
    { label: 'READ', value: s?.total_read || 0, color: 'bg-purple-500' },
    { label: 'CLICKED', value: s?.total_clicked || 0, color: 'bg-pink-500' },
    { label: 'FAILED', value: s?.total_failed || 0, color: 'bg-semantic-red' },
  ]
  const maxV = Math.max(...funnel.map(f => f.value), 1)

  if (!campaign) return <div className="p-5 text-txt-4 text-sm">Loading...</div>

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center gap-3 px-5 border-b border-border-subtle flex-shrink-0">
        <Link to="/campaigns" className="text-txt-4 hover:text-txt-2"><ArrowLeft size={14} /></Link>
        <h1 className="text-md font-semibold text-txt-0 truncate">{campaign.name}</h1>
        <span className={`badge ${campaign.status === 'running' ? 'bg-semantic-blue/10 text-semantic-blue' : campaign.status === 'completed' ? 'bg-semantic-green/10 text-semantic-green' : 'bg-bg-3 text-txt-4'}`}>{campaign.status}</span>
        {campaign.status === 'draft' && (
          <button onClick={handleLaunch} disabled={launching} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-dim disabled:opacity-50 transition-colors">
            <Rocket size={11} /> {launching ? 'Launching...' : 'Launch'}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Funnel */}
        <div className="panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-txt-2">Delivery Funnel</span>
            {campaign.status === 'running' && <span className="badge bg-semantic-blue/10 text-semantic-blue animate-pulse">Live</span>}
          </div>
          <div className="grid grid-cols-6 gap-3">
            {funnel.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="text-center">
                <div className="data-value text-lg text-txt-0">{f.value.toLocaleString()}</div>
                <div className="h-1.5 bg-bg-3 rounded-full mt-2 overflow-hidden">
                  <motion.div className={`h-full ${f.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${(f.value / maxV) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                </div>
                <div className="text-2xs text-txt-4 mt-1.5">{f.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Communications log */}
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-medium text-txt-2">Communications</span>
            <span className="text-2xs text-txt-4">{comms?.total || 0} total</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-2xs text-txt-4 border-b border-border-subtle">
              <th className="text-left px-3 py-1.5">CUSTOMER</th>
              <th className="text-left px-3 py-1.5">CHANNEL</th>
              <th className="text-left px-3 py-1.5">STATUS</th>
            </tr></thead>
            <tbody className="divide-y divide-border-subtle">
              {comms?.data?.map((c: any) => (
                <tr key={c.id} className="hover:bg-bg-2">
                  <td className="px-3 py-1.5 text-txt-1">{c.customers?.name || '—'}</td>
                  <td className="px-3 py-1.5 text-txt-3 capitalize">{c.channel}</td>
                  <td className="px-3 py-1.5"><span className={`badge ${c.current_status === 'delivered' || c.current_status === 'read' || c.current_status === 'clicked' ? 'bg-semantic-green/10 text-semantic-green' : c.current_status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' : 'bg-bg-3 text-txt-4'}`}>{c.current_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
