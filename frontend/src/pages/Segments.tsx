import { useQuery } from '@tanstack/react-query'
import { fetchSegments, createSegment, previewSegment } from '../services/api'
import { useState } from 'react'
import { Layers, Plus, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Segments() {
  const { data: segments, refetch } = useQuery({ queryKey: ['segments'], queryFn: fetchSegments })
  const [nlQuery, setNlQuery] = useState('')
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null)

  const handleNLSegment = async () => {
    if (!nlQuery.trim()) return
    // For now, parse basic NL into filter config (in production, AI would do this)
    const filter = parseNLToFilter(nlQuery)
    try {
      const result = await previewSegment(filter)
      setPreview(result)
    } catch (err) {
      console.error('Preview failed:', err)
    }
  }

  const handleSaveSegment = async () => {
    if (!nlQuery.trim() || !preview) return
    const filter = parseNLToFilter(nlQuery)
    await createSegment({
      name: nlQuery.slice(0, 50),
      description: nlQuery,
      filter_config: filter,
      natural_language_query: nlQuery,
    })
    refetch()
    setNlQuery('')
    setPreview(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Audience Segments</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Create and manage customer segments</p>
        </div>
      </div>

      {/* Natural Language Builder */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-[var(--primary)]" />
          <h2 className="font-semibold text-sm">Natural Language Segment Builder</h2>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={nlQuery}
            onChange={e => setNlQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNLSegment()}
            placeholder="e.g., Gold tier customers in Mumbai who haven't ordered in 2 weeks"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
          />
          <button onClick={handleNLSegment} className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg text-sm font-medium transition-colors">
            Preview
          </button>
        </div>

        {preview && (
          <div className="mt-4 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm"><strong>{preview.count.toLocaleString()}</strong> customers match</p>
              <button onClick={handleSaveSegment} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium">
                <Plus size={12} /> Save Segment
              </button>
            </div>
            {preview.sample.length > 0 && (
              <div className="space-y-1">
                {preview.sample.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{c.name} • {c.city}</span>
                    <span>₹{Number(c.total_spent).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Segments */}
      <h2 className="text-lg font-semibold mb-4">Saved Segments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments?.map((seg: any) => (
          <div key={seg.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--primary)]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Layers size={16} className="text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{seg.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{seg.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Users size={12} />
                {seg.customer_count.toLocaleString()} customers
              </div>
              <Link to="/agent" className="text-xs text-[var(--primary)] hover:underline">
                Campaign →
              </Link>
            </div>
          </div>
        ))}
        {!segments?.length && (
          <div className="col-span-2 text-center py-12 text-[var(--text-muted)]">
            <Layers size={48} className="mx-auto mb-4 opacity-30" />
            <p>No segments yet. Use the builder above to create one!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function parseNLToFilter(query: string) {
  const conditions: any[] = []
  const q = query.toLowerCase()

  if (q.includes('gold')) conditions.push({ field: 'loyalty_tier', operator: 'eq', value: 'gold' })
  if (q.includes('platinum')) conditions.push({ field: 'loyalty_tier', operator: 'eq', value: 'platinum' })
  if (q.includes('silver')) conditions.push({ field: 'loyalty_tier', operator: 'eq', value: 'silver' })
  if (q.includes('mumbai')) conditions.push({ field: 'city', operator: 'eq', value: 'Mumbai' })
  if (q.includes('delhi')) conditions.push({ field: 'city', operator: 'eq', value: 'Delhi' })
  if (q.includes('bangalore')) conditions.push({ field: 'city', operator: 'eq', value: 'Bangalore' })
  if (q.includes('whatsapp')) conditions.push({ field: 'preferred_channel', operator: 'eq', value: 'whatsapp' })

  const inactiveDaysMatch = q.match(/(\d+)\s*(days?|weeks?)/);
  if (inactiveDaysMatch && (q.includes("haven't") || q.includes('inactive') || q.includes('not ordered'))) {
    let days = parseInt(inactiveDaysMatch[1]);
    if (inactiveDaysMatch[2].startsWith('week')) days *= 7;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    conditions.push({ field: 'last_purchase_at', operator: 'lt', value: cutoff });
  }

  const spentMatch = q.match(/(?:spent|spend).*?(\d+)/);
  if (spentMatch) {
    conditions.push({ field: 'total_spent', operator: 'gt', value: parseInt(spentMatch[1]) });
  }

  if (conditions.length === 0) {
    conditions.push({ field: 'total_orders', operator: 'gte', value: 1 });
  }

  return { conditions, logic: 'AND' as const };
}
