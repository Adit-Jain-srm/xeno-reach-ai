import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchCampaign, fetchCampaignStats, fetchCampaignComms, launchCampaign } from '../services/api'
import { useCampaignStatsRealtime } from '../hooks/useRealtime'
import { ArrowLeft, Rocket, Send, CheckCircle, Eye, MousePointer, XCircle, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [launching, setLaunching] = useState(false)

  const { data: campaign, refetch: refetchCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(id!),
    enabled: !!id,
  })

  const { data: initialStats } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => fetchCampaignStats(id!),
    enabled: !!id,
    refetchInterval: campaign?.status === 'running' ? 3000 : false,
  })

  const { data: comms } = useQuery({
    queryKey: ['campaign-comms', id],
    queryFn: () => fetchCampaignComms(id!, { page_size: 30 }),
    enabled: !!id,
    refetchInterval: campaign?.status === 'running' ? 5000 : false,
  })

  // Realtime stats subscription for live campaigns
  const realtimeStats = useCampaignStatsRealtime(campaign?.status === 'running' ? id : undefined)
  const stats = realtimeStats || initialStats

  const handleLaunch = async () => {
    if (!id) return
    setLaunching(true)
    try {
      await launchCampaign(id)
      refetchCampaign()
    } catch (err) {
      console.error('Launch failed:', err)
    } finally {
      setLaunching(false)
    }
  }

  const funnelStages = [
    { label: 'Sent', value: stats?.total_sent || 0, icon: Send, color: 'from-blue-500 to-blue-600' },
    { label: 'Delivered', value: stats?.total_delivered || 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Opened', value: stats?.total_opened || 0, icon: Eye, color: 'from-amber-500 to-amber-600' },
    { label: 'Read', value: stats?.total_read || 0, icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { label: 'Clicked', value: stats?.total_clicked || 0, icon: MousePointer, color: 'from-pink-500 to-pink-600' },
    { label: 'Failed', value: stats?.total_failed || 0, icon: XCircle, color: 'from-red-500 to-red-600' },
  ]

  const maxVal = Math.max(...funnelStages.map(s => s.value), 1)

  const statusConfig: Record<string, { bg: string; text: string }> = {
    running: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  }

  const commStatusIcon: Record<string, string> = {
    queued: '⏳', sent: '📤', delivered: '✅', read: '👁️', clicked: '🔗', failed: '❌', undelivered: '⚠️',
  }

  if (!campaign) return <div className="p-8 text-[var(--text-muted)]">Loading...</div>

  const sc = statusConfig[campaign.status] || statusConfig.draft

  return (
    <div className="p-8">
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
              {campaign.status === 'running' && <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 animate-pulse" />}
              {campaign.status}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-1">{campaign.goal}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
            <span>📱 {campaign.channels?.join(', ')}</span>
            <span>👥 {campaign.audience_count?.toLocaleString()} recipients</span>
            {campaign.ai_confidence_score && <span>🎯 {Math.round(campaign.ai_confidence_score * 100)}% confidence</span>}
          </div>
        </div>
        {campaign.status === 'draft' && (
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Rocket size={16} />
            {launching ? 'Launching...' : 'Launch Campaign'}
          </button>
        )}
      </div>

      {/* Delivery Funnel — Live Pulse */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold">Delivery Funnel</h2>
          {campaign.status === 'running' && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {funnelStages.map((stage, i) => {
            const Icon = stage.icon
            const pct = stats?.total_sent > 0 ? Math.round((stage.value / stats.total_sent) * 100) : 0
            return (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-2`}>
                  <Icon size={20} className="text-white" />
                </div>
                <motion.p
                  key={stage.value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-xl font-bold"
                >
                  {stage.value.toLocaleString()}
                </motion.p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stage.label}</p>
                <div className="w-full h-1.5 bg-[var(--bg)] rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.value / maxVal) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                {stats?.total_sent > 0 && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">{pct}%</p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Rate Summary */}
        {stats && stats.total_sent > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[var(--border)]">
            <div className="text-center">
              <p className="text-lg font-semibold text-emerald-400">{stats.delivery_rate || 0}%</p>
              <p className="text-xs text-[var(--text-muted)]">Delivery Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-amber-400">{stats.open_rate || 0}%</p>
              <p className="text-xs text-[var(--text-muted)]">Open Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-pink-400">{stats.click_rate || 0}%</p>
              <p className="text-xs text-[var(--text-muted)]">Click Rate</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Reasoning */}
      {campaign.ai_reasoning && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold mb-2 text-[var(--primary)]">🤖 AI Reasoning</h3>
          <p className="text-sm text-[var(--text-muted)]">{campaign.ai_reasoning}</p>
        </div>
      )}

      {/* Communications Log */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Communications</h2>
          <span className="text-xs text-[var(--text-muted)]">{comms?.total || 0} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2.5 px-3 text-[var(--text-muted)] font-medium text-xs">Customer</th>
                <th className="text-left py-2.5 px-3 text-[var(--text-muted)] font-medium text-xs">Channel</th>
                <th className="text-left py-2.5 px-3 text-[var(--text-muted)] font-medium text-xs">Status</th>
                <th className="text-left py-2.5 px-3 text-[var(--text-muted)] font-medium text-xs">Message</th>
              </tr>
            </thead>
            <tbody>
              {comms?.data?.map((comm: any) => (
                <tr key={comm.id} className="border-b border-[var(--border)]/30 hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-2.5 px-3 font-medium">{comm.customers?.name || '—'}</td>
                  <td className="py-2.5 px-3 capitalize text-xs">{comm.channel}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-sm">{commStatusIcon[comm.current_status] || '?'} {comm.current_status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[var(--text-muted)] max-w-xs truncate">{comm.message_content}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!comms?.data || comms.data.length === 0) && (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">No communications yet. Launch the campaign to start sending.</p>
          )}
        </div>
      </div>
    </div>
  )
}
