import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchCustomer, fetchCustomerTimeline } from '../services/api'
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, TrendingDown, TrendingUp, Zap, Coffee, Calendar, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge, Tooltip } from '../components/ui'
import { cn } from '../lib/cn'

const TIER_CONFIG: Record<string, { color: string; label: string; desc: string }> = {
  platinum: { color: 'bg-purple-500/10 text-purple-400 border-purple-400/20', label: 'Platinum', desc: 'Top 5% by spend — VIP treatment' },
  gold: { color: 'bg-semantic-amber/10 text-semantic-amber border-semantic-amber/20', label: 'Gold', desc: 'Top 15% — high engagement, frequent buyer' },
  silver: { color: 'bg-txt-3/10 text-txt-2 border-txt-3/20', label: 'Silver', desc: 'Regular customer, moderate spend' },
  bronze: { color: 'bg-orange-500/10 text-orange-400 border-orange-400/20', label: 'Bronze', desc: 'New or low-frequency customer' },
}

function EngagementGauge({ score }: { score: number }) {
  const r = 32
  const c = 2 * Math.PI * r
  const color = score >= 70 ? 'stroke-semantic-green' : score >= 40 ? 'stroke-semantic-amber' : 'stroke-semantic-red'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={80} height={80} className="rotate-[-90deg]">
        <circle cx={40} cy={40} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-bg-3" />
        <motion.circle
          cx={40} cy={40} r={r} fill="none" strokeWidth={5}
          className={color} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(score / 100) * c} ${c}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-lg font-bold text-txt-0">{score}</div>
        <div className="text-2xs text-txt-4">Score</div>
      </div>
    </div>
  )
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const { data: customer, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => fetchCustomer(id!), enabled: !!id })
  const { data: timeline } = useQuery({ queryKey: ['customer-timeline', id], queryFn: () => fetchCustomerTimeline(id!), enabled: !!id })

  if (isLoading || !customer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-txt-4">Loading customer...</div>
      </div>
    )
  }

  const tier = TIER_CONFIG[customer.loyalty_tier] || TIER_CONFIG.bronze
  const churnRisk = customer.days_since_last_order && customer.days_since_last_order > 30 ? 'High' : customer.days_since_last_order > 14 ? 'Medium' : 'Low'
  const churnColor = churnRisk === 'High' ? 'text-semantic-red' : churnRisk === 'Medium' ? 'text-semantic-amber' : 'text-semantic-green'

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center gap-3 px-5 border-b border-border-subtle flex-shrink-0">
        <Link to="/customers" className="text-txt-4 hover:text-txt-2 transition-colors"><ArrowLeft size={14} /></Link>
        <h1 className="text-md font-semibold text-txt-0">{customer.name}</h1>
        <Tooltip content={tier.desc}>
          <span className={cn('badge border', tier.color)}>{tier.label}</span>
        </Tooltip>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel rounded-lg p-4">
          <div className="flex items-start gap-5">
            <EngagementGauge score={customer.engagement_score || 0} />
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-bold text-txt-0">{customer.name}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-txt-3">
                {customer.email && <span className="flex items-center gap-1"><Mail size={11} />{customer.email}</span>}
                {customer.phone && <span className="flex items-center gap-1"><Phone size={11} />{customer.phone}</span>}
                {customer.city && <span className="flex items-center gap-1"><MapPin size={11} />{customer.city}</span>}
              </div>
              <div className="flex gap-4 pt-2">
                <div className="text-center">
                  <div className="font-mono text-md font-bold text-txt-0">{customer.total_orders}</div>
                  <div className="text-2xs text-txt-4">Orders</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-md font-bold text-txt-0">₹{(customer.total_spent || 0).toLocaleString()}</div>
                  <div className="text-2xs text-txt-4">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-md font-bold text-txt-0">₹{Math.round(customer.avg_order_value || 0)}</div>
                  <div className="text-2xs text-txt-4">Avg Order</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-md font-bold text-txt-0 capitalize">{customer.preferred_channel}</div>
                  <div className="text-2xs text-txt-4">Preferred</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {/* AI Predictions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-txt-1">
              <Zap size={12} className="text-accent" /> AI Predictions
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-3">Churn Risk</span>
                  <span className={cn('font-semibold', churnColor)}>{churnRisk}</span>
                </div>
                {customer.days_since_last_order && (
                  <p className="text-2xs text-txt-4 mt-0.5">Last order {customer.days_since_last_order} days ago</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-3">Upsell Readiness</span>
                  <span className="font-mono font-semibold text-txt-0">{Math.min(customer.engagement_score + 10, 100)}/100</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <p className="text-2xs text-txt-3 leading-relaxed">
                  <span className="text-accent font-medium">Next best action:</span>{' '}
                  {churnRisk === 'High'
                    ? `Send ${customer.preferred_channel} with 20% off on ${customer.favorite_items?.[0] || 'favorites'}`
                    : `Loyalty reward — free upgrade on next ${customer.favorite_items?.[0] || 'order'}`
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Favorite Items */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="panel rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-txt-1">
              <Coffee size={12} className="text-semantic-amber" /> Favorites
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(customer.favorite_items || []).map((item: string) => (
                <Badge key={item} variant="default">{item}</Badge>
              ))}
              {(!customer.favorite_items || customer.favorite_items.length === 0) && (
                <span className="text-2xs text-txt-4">No favorites tracked</span>
              )}
            </div>
            <div className="pt-2 border-t border-border-subtle text-2xs text-txt-4">
              <div className="flex items-center gap-1">
                <Calendar size={9} />
                First purchase: {customer.first_purchase_at ? new Date(customer.first_purchase_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-txt-1">
              <TrendingUp size={12} className="text-semantic-green" /> Engagement
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-txt-3">Score</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', customer.engagement_score >= 70 ? 'bg-semantic-green' : customer.engagement_score >= 40 ? 'bg-semantic-amber' : 'bg-semantic-red')}
                      initial={{ width: 0 }} animate={{ width: `${customer.engagement_score}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="font-mono text-txt-0 font-semibold">{customer.engagement_score}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-txt-3">Segments</span>
                <span className="font-mono text-txt-0">{customer.segment_tags?.length || 0}</span>
              </div>
              {customer.segment_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {customer.segment_tags.slice(0, 4).map((tag: string) => (
                    <Badge key={tag} variant="accent">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Order Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="panel rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-1">Order History</span>
            <span className="text-2xs text-txt-4 font-mono">{timeline?.orders?.length || customer.total_orders} orders</span>
          </div>
          <div className="divide-y divide-border-subtle max-h-[300px] overflow-y-auto">
            {(timeline?.orders || customer.orders || []).slice(0, 20).map((order: any, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center px-4 py-2.5 hover:bg-bg-2 transition-colors gap-3"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  order.total_amount > 500 ? 'bg-semantic-green' : order.total_amount > 200 ? 'bg-semantic-amber' : 'bg-txt-4'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-txt-1 truncate">
                    {order.items?.map((it: any) => it.name).join(', ') || 'Order'}
                  </div>
                  <div className="text-2xs text-txt-4">{order.store_location}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xs font-semibold text-txt-0">₹{order.total_amount}</div>
                  <div className="text-2xs text-txt-4">{new Date(order.order_date).toLocaleDateString()}</div>
                </div>
              </motion.div>
            ))}
            {(!timeline?.orders && !customer.orders) && (
              <div className="px-4 py-6 text-center text-2xs text-txt-4">
                <ShoppingBag size={16} className="mx-auto mb-1 opacity-40" />
                No order history available
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
