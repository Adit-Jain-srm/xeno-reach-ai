import { useQuery } from '@tanstack/react-query'
import { fetchCustomers } from '../services/api'
import { useState } from 'react'
import { Search, ChevronRight, User, ShoppingBag, TrendingUp, MessageSquare, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/cn'
import { Link } from 'react-router-dom'
import { Modal, ModalActions, Button, useToast } from '../components/ui'
import { api } from '../services/api'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tier, setTier] = useState('')
  const [city, setCity] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  const { data } = useQuery({
    queryKey: ['customers', page, search, tier, city],
    queryFn: () => fetchCustomers({ page, page_size: 20, search: search || undefined, loyalty_tier: tier || undefined, city: city || undefined }),
  })

  const tierInfo: Record<string, { color: string; label: string; desc: string }> = {
    platinum: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Platinum', desc: '15+ orders, top spender' },
    gold: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Gold', desc: '8-15 orders, loyal customer' },
    silver: { color: 'bg-gray-400/10 text-gray-400 border-gray-400/20', label: 'Silver', desc: '4-8 orders, growing engagement' },
    bronze: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Bronze', desc: '1-3 orders, new customer' },
  }

  return (
    <div className="h-full flex">
      {/* Main Table */}
      <div className="flex-1 flex flex-col">
        <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0 gap-3">
          <h1 className="text-md font-semibold text-txt-0">Customers</h1>
          <span className="text-2xs text-txt-4 font-mono">{data?.total?.toLocaleString() || '—'}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-2xs text-txt-2 hover:text-txt-0 hover:border-accent/30 transition-colors">
              <Upload size={11} /> Import
            </button>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-4" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email..." className="pl-7 pr-3 py-1.5 w-52 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 placeholder:text-txt-4 focus:outline-none focus:border-accent/50 transition-colors" />
            </div>
            <select value={tier} onChange={e => { setTier(e.target.value); setPage(1) }} className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-1 focus:outline-none cursor-pointer">
              <option value="">All Tiers</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
            <select value={city} onChange={e => { setCity(e.target.value); setPage(1) }} className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-1 focus:outline-none cursor-pointer">
              <option value="">All Cities</option>
              {['Mumbai','Delhi','Bangalore','Pune','Hyderabad','Chennai'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-1 border-b border-border-subtle z-10">
              <tr className="text-2xs text-txt-4 font-medium tracking-wider">
                <th className="text-left px-5 py-2">CUSTOMER</th>
                <th className="text-left px-3 py-2">CITY</th>
                <th className="text-left px-3 py-2">TIER</th>
                <th className="text-right px-3 py-2">ORDERS</th>
                <th className="text-right px-3 py-2">LIFETIME VALUE</th>
                <th className="text-right px-3 py-2">ENGAGEMENT</th>
                <th className="text-center px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data?.data?.map((c: any) => {
                const t = tierInfo[c.loyalty_tier] || tierInfo.bronze
                const engPct = Math.round(Number(c.engagement_score) * 100)
                const engColor = engPct >= 70 ? 'bg-semantic-green' : engPct >= 40 ? 'bg-semantic-amber' : 'bg-semantic-red'
                return (
                  <tr key={c.id} onClick={() => setSelected(c)} className={cn('hover:bg-bg-2 transition-colors cursor-pointer group', selected?.id === c.id && 'bg-bg-2')}>
                    <td className="px-5 py-2.5">
                      <Link to={`/customers/${c.id}`} onClick={e => e.stopPropagation()} className="text-txt-0 font-medium group-hover:text-accent transition-colors">{c.name}</Link>
                      <div className="text-2xs text-txt-4">{c.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-txt-2 text-xs">{c.city}</td>
                    <td className="px-3 py-2.5">
                      <span className={`badge border ${t.color}`} title={t.desc}>{t.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-txt-1">{c.total_orders}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-txt-1">₹{Number(c.total_spent).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-2" title={`Engagement score: ${engPct}% — ${engPct >= 70 ? 'Highly engaged' : engPct >= 40 ? 'Moderately engaged' : 'At risk of churn'}`}>
                        <div className="w-14 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${engPct}%` }} transition={{ duration: 0.6 }} className={`h-full ${engColor} rounded-full`} />
                        </div>
                        <span className="font-mono text-2xs text-txt-3 w-6">{engPct}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <ChevronRight size={12} className="text-txt-4 group-hover:text-accent transition-colors" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="h-10 flex items-center justify-between px-5 border-t border-border-subtle text-2xs text-txt-4">
            <span>Page {page} of {data.total_pages} · {data.total.toLocaleString()} customers</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 rounded bg-bg-2 border border-border-subtle disabled:opacity-30 hover:bg-bg-3 transition-colors">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages} className="px-2.5 py-1 rounded bg-bg-2 border border-border-subtle disabled:opacity-30 hover:bg-bg-3 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Panel (Slide-over) */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="h-full border-l border-border-subtle bg-bg-1 overflow-y-auto flex-shrink-0">
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-md font-semibold text-txt-0">{selected.name}</h2>
                  <p className="text-2xs text-txt-4">{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-txt-4 hover:text-txt-1 text-lg">×</button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="panel rounded-lg p-3 text-center">
                  <ShoppingBag size={14} className="mx-auto text-txt-4 mb-1" />
                  <div className="font-mono text-lg text-txt-0">{selected.total_orders}</div>
                  <div className="text-2xs text-txt-4">Total Orders</div>
                </div>
                <div className="panel rounded-lg p-3 text-center">
                  <TrendingUp size={14} className="mx-auto text-txt-4 mb-1" />
                  <div className="font-mono text-lg text-txt-0">₹{Number(selected.total_spent).toLocaleString()}</div>
                  <div className="text-2xs text-txt-4">Lifetime Value</div>
                </div>
              </div>

              {/* Engagement Gauge */}
              <div className="panel rounded-lg p-3">
                <div className="text-2xs text-txt-4 font-medium mb-2">ENGAGEMENT SCORE</div>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 rotate-[-90deg]" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-bg-3" />
                      <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" strokeLinecap="round"
                        className={Number(selected.engagement_score) >= 0.7 ? 'text-semantic-green' : Number(selected.engagement_score) >= 0.4 ? 'text-semantic-amber' : 'text-semantic-red'}
                        strokeDasharray={`${Number(selected.engagement_score) * 176} 176`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-txt-0">
                      {Math.round(Number(selected.engagement_score) * 100)}
                    </span>
                  </div>
                  <div className="text-xs text-txt-2">
                    {Number(selected.engagement_score) >= 0.7 ? '🟢 Highly engaged — likely to respond to campaigns' :
                     Number(selected.engagement_score) >= 0.4 ? '🟡 Moderate — may need incentive to re-engage' :
                     '🔴 At risk — consider win-back campaign'}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="panel rounded-lg p-3 space-y-2">
                <div className="text-2xs text-txt-4 font-medium mb-2">PROFILE</div>
                {[
                  { label: 'City', value: selected.city },
                  { label: 'Loyalty Tier', value: selected.loyalty_tier, capitalize: true },
                  { label: 'Preferred Channel', value: selected.preferred_channel, capitalize: true },
                  { label: 'Avg Order', value: `₹${Number(selected.avg_order_value).toLocaleString()}` },
                  { label: 'Last Order', value: selected.last_purchase_at ? new Date(selected.last_purchase_at).toLocaleDateString() : 'Never' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-txt-4">{row.label}</span>
                    <span className={cn('text-txt-1 font-medium', row.capitalize && 'capitalize')}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* AI Prediction */}
              <div className="panel rounded-lg p-3 border-l-2 border-l-accent">
                <div className="text-2xs text-txt-4 font-medium mb-1">AI PREDICTION</div>
                <p className="text-xs text-txt-1">
                  {Number(selected.engagement_score) < 0.3
                    ? `${selected.name.split(' ')[0]} is likely to churn within 7 days. Recommend immediate personalized offer via ${selected.preferred_channel}.`
                    : Number(selected.engagement_score) > 0.7
                    ? `${selected.name.split(' ')[0]} is a high-value customer ready for upsell. Consider premium product recommendations.`
                    : `${selected.name.split(' ')[0]} shows moderate engagement. A loyalty reward could increase visit frequency by 20%.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Data" description="Bulk import customers or orders" size="lg">
        <ImportModalContent onClose={() => setShowImport(false)} toast={toast} />
      </Modal>
    </div>
  )
}

function ImportModalContent({ onClose, toast }: { onClose: () => void; toast: any }) {
  const [tab, setTab] = useState<'customers' | 'orders'>('customers')
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)
    try {
      const parsed = JSON.parse(importJson)
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array')
      const endpoint = tab === 'customers' ? '/customers/bulk' : '/orders/bulk'
      const { data: result } = await api.post(endpoint, parsed)
      toast('success', `${tab === 'customers' ? 'Customers' : 'Orders'} imported`, `${result.inserted || parsed.length} records added`)
      onClose()
    } catch (e: any) {
      toast('error', 'Import failed', e.message?.includes('JSON') ? 'Invalid JSON format' : e.response?.data?.error || e.message)
    } finally { setImporting(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-0.5 bg-bg-2 rounded-lg w-fit">
        <button onClick={() => setTab('customers')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', tab === 'customers' ? 'bg-bg-1 text-txt-0 shadow-sm' : 'text-txt-2')}>
          Customers
        </button>
        <button onClick={() => setTab('orders')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', tab === 'orders' ? 'bg-bg-1 text-txt-0 shadow-sm' : 'text-txt-2')}>
          Orders
        </button>
      </div>
      <textarea
        value={importJson}
        onChange={e => setImportJson(e.target.value)}
        placeholder={tab === 'customers'
          ? `[{"name":"Priya Sharma","email":"priya@example.com","phone":"+919876543210","city":"Mumbai","loyalty_tier":"gold","total_orders":12,"total_spent":8500}]`
          : `[{"customer_id":"uuid-here","items":[{"name":"Cold Brew","category":"coffee","quantity":1,"price":350}],"total_amount":350,"store_location":"Mumbai Central","order_date":"2026-06-01"}]`
        }
        className="w-full h-40 px-3 py-2 rounded-md bg-bg-2 border border-border text-xs text-txt-0 placeholder:text-txt-3 focus:outline-none focus:border-accent/50 font-mono resize-none"
      />
      <p className="text-xs text-txt-2">
        {tab === 'customers'
          ? 'Required: name. Optional: email, phone, city, loyalty_tier, total_orders, total_spent, preferred_channel, favorite_items'
          : 'Required: customer_id, items, total_amount. Optional: store_location, order_date, payment_method'
        }
      </p>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={importing || !importJson.trim()} onClick={handleImport}>
          <Upload size={11} /> {importing ? 'Importing...' : `Import ${tab}`}
        </Button>
      </ModalActions>
    </div>
  )
}
