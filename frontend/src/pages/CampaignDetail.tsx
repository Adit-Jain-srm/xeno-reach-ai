import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchCampaign, fetchCampaignStats, fetchCampaignComms, launchCampaign } from '../services/api'
import { useCampaignStatsRealtime } from '../hooks/useRealtime'
import { ArrowLeft, Rocket, Info, TrendingUp, AlertTriangle, Users, MessageSquare, Radio } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn'
import { Modal, ModalActions, Button, Badge, useToast } from '../components/ui'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [launching, setLaunching] = useState(false)
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)
  const { toast } = useToast()

  const { data: campaign, refetch } = useQuery({ queryKey: ['campaign', id], queryFn: () => fetchCampaign(id!), enabled: !!id })
  const { data: stats } = useQuery({ queryKey: ['stats', id], queryFn: () => fetchCampaignStats(id!), enabled: !!id, refetchInterval: campaign?.status === 'running' ? 2000 : false })
  const { data: comms } = useQuery({ queryKey: ['comms', id], queryFn: () => fetchCampaignComms(id!, { page_size: 30 }), enabled: !!id, refetchInterval: campaign?.status === 'running' ? 4000 : false })

  const rt = useCampaignStatsRealtime(campaign?.status === 'running' ? id : undefined)
  const s = rt || stats

  const handleLaunch = async () => {
    setLaunching(true)
    setShowLaunchModal(false)
    try {
      await launchCampaign(id!)
      toast('success', 'Campaign launched!', `Sending to ${campaign.audience_count?.toLocaleString()} recipients...`)
      refetch()
    } catch (e: any) {
      toast('error', 'Launch failed', e.response?.data?.error || e.message)
    } finally {
      setLaunching(false)
    }
  }

  const funnel = [
    { key: 'sent', label: 'SENT', value: s?.total_sent || 0, color: 'bg-semantic-blue', desc: 'Messages dispatched to channel service' },
    { key: 'delivered', label: 'DELIVERED', value: s?.total_delivered || 0, color: 'bg-semantic-green', desc: 'Successfully reached recipient device' },
    { key: 'opened', label: 'OPENED', value: s?.total_opened || 0, color: 'bg-semantic-amber', desc: 'Recipient opened/viewed the message' },
    { key: 'read', label: 'READ', value: s?.total_read || 0, color: 'bg-purple-500', desc: 'Recipient read the full message content' },
    { key: 'clicked', label: 'CLICKED', value: s?.total_clicked || 0, color: 'bg-pink-500', desc: 'Recipient clicked the CTA link' },
    { key: 'failed', label: 'FAILED', value: s?.total_failed || 0, color: 'bg-semantic-red', desc: 'Delivery failed (invalid number, blocked, etc.)' },
  ]
  const maxV = Math.max(...funnel.map(f => f.value), 1)

  if (!campaign) return <div className="flex items-center justify-center h-full text-txt-4 text-sm">Loading campaign...</div>

  const dropOffInsight = s?.total_sent > 0 && s?.total_delivered > 0
    ? `${Math.round(((s.total_sent - s.total_delivered) / s.total_sent) * 100)}% drop between send and delivery — ${s.total_failed > s.total_sent * 0.1 ? 'high failure rate, check audience quality' : 'within normal range'}`
    : null

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center gap-3 px-5 border-b border-border-subtle flex-shrink-0">
        <Link to="/campaigns" className="text-txt-4 hover:text-txt-2 transition-colors"><ArrowLeft size={14} /></Link>
        <h1 className="text-md font-semibold text-txt-0 truncate">{campaign.name}</h1>
        <span className={`badge ${campaign.status === 'running' ? 'bg-semantic-blue/10 text-semantic-blue' : campaign.status === 'completed' ? 'bg-semantic-green/10 text-semantic-green' : campaign.status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' : 'bg-bg-3 text-txt-4'}`}>
          {campaign.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-semantic-blue animate-pulse mr-1 inline-block" />}
          {campaign.status}
        </span>
        {campaign.ai_confidence_score && (
          <span className="badge bg-accent/10 text-accent font-mono" title="AI confidence in this campaign's success">
            {Math.round(campaign.ai_confidence_score * 100)}% conf.
          </span>
        )}
        {campaign.status === 'draft' && (
          <button onClick={() => setShowLaunchModal(true)} disabled={launching} className="ml-auto btn-pill btn-pill-accent text-xs disabled:opacity-50">
            <Rocket size={12} /> {launching ? 'Launching...' : 'Launch Campaign'}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Campaign Meta */}
        <div className="flex gap-4 text-xs text-txt-3">
          <span>📱 {campaign.channels?.join(', ')}</span>
          <span>👥 {campaign.audience_count?.toLocaleString()} recipients</span>
          {campaign.started_at && <span>🕐 Started {new Date(campaign.started_at).toLocaleString()}</span>}
        </div>

        {/* AI Reasoning */}
        {campaign.ai_reasoning && (
          <div className="panel rounded-lg p-3 border-l-2 border-l-accent">
            <div className="flex items-center gap-1.5 text-2xs text-accent font-medium mb-1">
              <Info size={10} /> AI REASONING
            </div>
            <p className="text-xs text-txt-2">{campaign.ai_reasoning}</p>
          </div>
        )}

        {/* Delivery Funnel — Interactive */}
        <div className="panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-txt-1">Delivery Funnel</span>
            {campaign.status === 'running' && <span className="badge bg-semantic-blue/10 text-semantic-blue animate-pulse">Live</span>}
          </div>
          <div className="grid grid-cols-6 gap-3">
            {funnel.map((f, i) => (
              <motion.div key={f.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoveredStage(f.key)} onMouseLeave={() => setHoveredStage(null)}
                className={cn('text-center p-2 rounded-lg transition-colors cursor-default', hoveredStage === f.key && 'bg-bg-3')}>
                <motion.div key={f.value} className="font-mono text-xl font-bold text-txt-0"
                  initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                  {f.value.toLocaleString()}
                </motion.div>
                <div className="h-2 bg-bg-3 rounded-full mt-2 overflow-hidden">
                  <motion.div className={`h-full ${f.color} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${(f.value / maxV) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }} />
                </div>
                <div className="text-2xs text-txt-4 mt-1.5 font-medium">{f.label}</div>
                {s?.total_sent > 0 && (
                  <div className="text-2xs text-txt-4 font-mono">{Math.round((f.value / s.total_sent) * 100)}%</div>
                )}
                {/* Tooltip on hover */}
                {hoveredStage === f.key && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-2xs text-txt-3 leading-relaxed">
                    {f.desc}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* AI Drop-off insight */}
          {dropOffInsight && (
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-start gap-2">
              <TrendingUp size={12} className="text-accent mt-0.5 flex-shrink-0" />
              <p className="text-2xs text-txt-3">{dropOffInsight}</p>
            </div>
          )}
        </div>

        {/* Communications Log */}
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-1">Communications</span>
            <span className="text-2xs text-txt-4 font-mono">{comms?.total || 0} total</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-2xs text-txt-4 border-b border-border-subtle">
              <th className="text-left px-4 py-1.5">CUSTOMER</th>
              <th className="text-left px-3 py-1.5">CHANNEL</th>
              <th className="text-left px-3 py-1.5">STATUS</th>
              <th className="text-left px-3 py-1.5">MESSAGE PREVIEW</th>
            </tr></thead>
            <tbody className="divide-y divide-border-subtle">
              {comms?.data?.map((c: any) => (
                <tr key={c.id} className="hover:bg-bg-2 transition-colors">
                  <td className="px-4 py-2 text-txt-1 font-medium">{c.customers?.name || '—'}</td>
                  <td className="px-3 py-2 text-txt-3 capitalize text-xs">{c.channel}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${
                      ['delivered','read','clicked'].includes(c.current_status) ? 'bg-semantic-green/10 text-semantic-green' :
                      c.current_status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' :
                      c.current_status === 'sent' ? 'bg-semantic-blue/10 text-semantic-blue' :
                      'bg-bg-3 text-txt-4'
                    }`}>{c.current_status}</span>
                  </td>
                  <td className="px-3 py-2 text-2xs text-txt-4 max-w-[200px] truncate">{c.message_content}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!comms?.data || comms.data.length === 0) && (
            <div className="px-4 py-8 text-center">
              <AlertTriangle size={20} className="mx-auto text-txt-4 mb-2 opacity-40" />
              <p className="text-xs text-txt-4">{campaign.status === 'draft' ? 'Launch the campaign to start sending messages' : 'No communications yet'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Launch Confirmation Modal */}
      <Modal
        open={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        title="Launch Campaign"
        description="Review before sending"
        size="sm"
      >
        <div className="space-y-3">
          <div className="panel-raised rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Users size={12} className="text-txt-4" />
              <span className="text-txt-3">Audience</span>
              <span className="ml-auto font-mono text-txt-0 font-semibold">{campaign.audience_count?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Radio size={12} className="text-txt-4" />
              <span className="text-txt-3">Channels</span>
              <span className="ml-auto text-txt-0 capitalize">{campaign.channels?.join(', ')}</span>
            </div>
            {campaign.message_template?.body && (
              <div className="flex items-start gap-2 text-xs pt-1 border-t border-border-subtle">
                <MessageSquare size={12} className="text-txt-4 mt-0.5" />
                <span className="text-txt-3 truncate">{campaign.message_template.body.slice(0, 100)}...</span>
              </div>
            )}
          </div>

          {campaign.audience_count > 5000 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-semantic-amber/5 border border-semantic-amber/20">
              <AlertTriangle size={12} className="text-semantic-amber" />
              <span className="text-2xs text-semantic-amber">Large campaign — {campaign.audience_count.toLocaleString()} recipients</span>
            </div>
          )}

          <ModalActions>
            <Button variant="secondary" onClick={() => setShowLaunchModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLaunch} disabled={launching}>
              <Rocket size={11} /> {launching ? 'Launching...' : 'Launch Campaign'}
            </Button>
          </ModalActions>
        </div>
      </Modal>
    </div>
  )
}
