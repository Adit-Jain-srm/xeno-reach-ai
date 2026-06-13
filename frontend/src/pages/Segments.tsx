import { useQuery } from '@tanstack/react-query'
import { fetchSegments, createSegment, previewSegment } from '../services/api'
import { useState } from 'react'
import { Layers, Plus, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Segments() {
  const { data: segments, refetch } = useQuery({ queryKey: ['segments'], queryFn: fetchSegments })
  const [nlQuery, setNlQuery] = useState('')
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleNLSegment = async () => {
    if (!nlQuery.trim()) return
    setLoading(true)
    const filter = parseNLToFilter(nlQuery)
    try {
      const result = await previewSegment(filter)
      setPreview(result)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!nlQuery.trim() || !preview) return
    await createSegment({ name: nlQuery.slice(0, 50), description: nlQuery, filter_config: parseNLToFilter(nlQuery), natural_language_query: nlQuery })
    refetch(); setNlQuery(''); setPreview(null)
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-md font-semibold text-txt-0">Segments</h1>
        <span className="text-2xs text-txt-4 ml-3">{segments?.length || 0} saved</span>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* NL Builder */}
        <div className="panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} className="text-accent" />
            <span className="text-xs font-medium text-txt-2">Natural Language Builder</span>
          </div>
          <div className="flex gap-2">
            <input
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNLSegment()}
              placeholder="e.g., Gold tier in Mumbai who haven't ordered in 2 weeks"
              className="flex-1 px-3 py-2 rounded-md bg-bg-2 border border-border-subtle text-sm text-txt-0 placeholder:text-txt-4 focus:outline-none focus:border-accent/50"
            />
            <button onClick={handleNLSegment} disabled={loading} className="px-3 py-2 rounded-md bg-accent hover:bg-accent-dim text-white text-xs font-medium disabled:opacity-50 transition-colors">
              {loading ? '...' : 'Preview'}
            </button>
          </div>

          {preview && (
            <div className="mt-3 p-3 rounded-md bg-bg-2 border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-txt-0"><span className="data-value">{preview.count.toLocaleString()}</span> customers match</span>
                <button onClick={handleSave} className="flex items-center gap-1 px-2 py-1 rounded bg-semantic-green/10 text-semantic-green text-2xs font-medium hover:bg-semantic-green/20 transition-colors">
                  <Plus size={10} /> Save
                </button>
              </div>
              {preview.sample.length > 0 && (
                <div className="space-y-1">
                  {preview.sample.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-2xs text-txt-3">
                      <span>{c.name} · {c.city}</span>
                      <span className="data-value">₹{Number(c.total_spent).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Segments */}
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border-subtle">
            <span className="text-xs font-medium text-txt-2">Saved Segments</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {segments?.map((seg: any) => (
              <div key={seg.id} className="px-3 py-2.5 hover:bg-bg-2 transition-colors flex items-center gap-3">
                <Layers size={13} className="text-txt-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-txt-0 truncate">{seg.name}</div>
                  <div className="text-2xs text-txt-4 mt-0.5">{seg.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="data-value text-xs text-txt-2">{seg.customer_count.toLocaleString()}</span>
                  <Link to="/agent" className="text-2xs text-accent hover:text-accent-light">Campaign →</Link>
                </div>
              </div>
            ))}
            {!segments?.length && (
              <div className="px-3 py-8 text-center text-txt-4 text-xs">No segments. Use the builder above.</div>
            )}
          </div>
        </div>
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
  const daysMatch = q.match(/(\d+)\s*(days?|weeks?)/)
  if (daysMatch && (q.includes("haven't") || q.includes('inactive') || q.includes('not ordered'))) {
    let days = parseInt(daysMatch[1])
    if (daysMatch[2].startsWith('week')) days *= 7
    conditions.push({ field: 'last_purchase_at', operator: 'lt', value: new Date(Date.now() - days * 86400000).toISOString() })
  }
  const spentMatch = q.match(/(?:spent|spend).*?(\d+)/)
  if (spentMatch) conditions.push({ field: 'total_spent', operator: 'gt', value: parseInt(spentMatch[1]) })
  if (conditions.length === 0) conditions.push({ field: 'total_orders', operator: 'gte', value: 1 })
  return { conditions, logic: 'AND' as const }
}
