import { useQuery } from '@tanstack/react-query'
import { fetchSegments, createSegment, previewSegment } from '../services/api'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Layers, Plus, Sparkles, Users, X, Filter, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/cn'
import { Button, Badge, useToast } from '../components/ui'

interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string
}

const FIELDS = [
  { value: 'city', label: 'City', type: 'select', options: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'] },
  { value: 'loyalty_tier', label: 'Loyalty Tier', type: 'select', options: ['bronze', 'silver', 'gold', 'platinum'] },
  { value: 'total_spent', label: 'Total Spent (₹)', type: 'number' },
  { value: 'total_orders', label: 'Total Orders', type: 'number' },
  { value: 'engagement_score', label: 'Engagement Score', type: 'number' },
  { value: 'preferred_channel', label: 'Preferred Channel', type: 'select', options: ['whatsapp', 'sms', 'email', 'rcs'] },
  { value: 'days_since_last_order', label: 'Days Since Last Order', type: 'number' },
]

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  select: [{ value: 'eq', label: 'is' }, { value: 'neq', label: 'is not' }],
  number: [{ value: 'gt', label: '>' }, { value: 'gte', label: '≥' }, { value: 'lt', label: '<' }, { value: 'lte', label: '≤' }, { value: 'eq', label: '=' }],
}

export default function Segments() {
  const { data: segments, refetch } = useQuery({ queryKey: ['segments'], queryFn: fetchSegments })
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: crypto.randomUUID(), field: 'loyalty_tier', operator: 'eq', value: 'gold' },
  ])
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [activeTab, setActiveTab] = useState<'visual' | 'nl'>('visual')
  const [nlQuery, setNlQuery] = useState('')
  const { toast } = useToast()
  const nav = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const buildFilterConfig = useCallback(() => {
    const valid = conditions.filter(c => c.field && c.operator && c.value)
    if (valid.length === 0) return null
    return {
      conditions: valid.map(c => ({
        field: c.field,
        operator: c.operator,
        value: isNaN(Number(c.value)) ? c.value : Number(c.value),
      })),
      logic,
    }
  }, [conditions, logic])

  const fetchPreview = useCallback(async () => {
    const config = buildFilterConfig()
    if (!config) { setPreview(null); return }
    setPreviewLoading(true)
    try {
      const result = await previewSegment(config)
      setPreview(result)
    } catch { setPreview(null) }
    finally { setPreviewLoading(false) }
  }, [buildFilterConfig])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchPreview, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [conditions, logic, fetchPreview])

  const addCondition = () => {
    setConditions(prev => [...prev, { id: crypto.randomUUID(), field: 'total_orders', operator: 'gte', value: '1' }])
  }

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id))
  }

  const updateCondition = (id: string, key: keyof FilterCondition, value: string) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
  }

  const handleSave = async () => {
    const config = buildFilterConfig()
    if (!config || !saveName.trim()) return
    try {
      await createSegment({ name: saveName, filter_config: config })
      toast('success', 'Segment saved', `${preview?.count || 0} customers`)
      refetch(); setSaveName(''); setShowSave(false)
    } catch (e: any) {
      toast('error', 'Save failed', e.message)
    }
  }

  const handleNLSegment = async () => {
    if (!nlQuery.trim()) return
    setPreviewLoading(true)
    const filter = parseNLToFilter(nlQuery)
    try {
      const result = await previewSegment(filter)
      setPreview(result)
    } catch { /* ignore */ }
    finally { setPreviewLoading(false) }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-md font-semibold text-txt-0">Segments</h1>
        <span className="text-2xs text-txt-4 ml-3">{segments?.length || 0} saved</span>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Builder */}
        <div className="panel rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border-subtle">
            <button onClick={() => setActiveTab('visual')} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2', activeTab === 'visual' ? 'text-accent border-accent' : 'text-txt-3 hover:text-txt-1 border-transparent')}>
              <Filter size={11} /> Visual Builder
            </button>
            <button onClick={() => setActiveTab('nl')} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2', activeTab === 'nl' ? 'text-accent border-accent' : 'text-txt-3 hover:text-txt-1 border-transparent')}>
              <Sparkles size={11} /> Natural Language
            </button>
          </div>

          <div className="flex">
            {/* Filter Builder Panel */}
            <div className="flex-1 p-4 border-r border-border-subtle">
              {activeTab === 'visual' ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {conditions.map((cond, i) => {
                      const fieldDef = FIELDS.find(f => f.value === cond.field)
                      const ops = OPERATORS[fieldDef?.type || 'number']
                      return (
                        <motion.div
                          key={cond.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-2"
                        >
                          {i > 0 && (
                            <button onClick={() => setLogic(l => l === 'AND' ? 'OR' : 'AND')} className="w-10 text-center text-2xs font-mono font-bold text-accent hover:text-accent-light transition-colors">
                              {logic}
                            </button>
                          )}
                          {i === 0 && <span className="w-10 text-center text-2xs text-txt-4">Where</span>}
                          <select
                            value={cond.field}
                            onChange={e => updateCondition(cond.id, 'field', e.target.value)}
                            className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 focus:outline-none focus:border-accent/50"
                          >
                            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                          <select
                            value={cond.operator}
                            onChange={e => updateCondition(cond.id, 'operator', e.target.value)}
                            className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 focus:outline-none focus:border-accent/50"
                          >
                            {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          {fieldDef?.type === 'select' ? (
                            <select
                              value={cond.value}
                              onChange={e => updateCondition(cond.id, 'value', e.target.value)}
                              className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 focus:outline-none focus:border-accent/50 flex-1"
                            >
                              {fieldDef.options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={cond.value}
                              onChange={e => updateCondition(cond.id, 'value', e.target.value)}
                              className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 focus:outline-none focus:border-accent/50 w-20 font-mono"
                            />
                          )}
                          <button onClick={() => removeCondition(cond.id)} className="text-txt-4 hover:text-semantic-red transition-colors p-1 rounded hover:bg-semantic-red/10">
                            <X size={12} />
                          </button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={addCondition} className="flex items-center gap-1 text-2xs text-accent hover:text-accent-light font-medium transition-colors">
                      <Plus size={10} /> Add condition
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={nlQuery}
                    onChange={e => setNlQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNLSegment()}
                    placeholder="e.g., Gold tier in Mumbai who haven't ordered in 2 weeks"
                    className="w-full px-3 py-2 rounded-md bg-bg-2 border border-border-subtle text-sm text-txt-0 placeholder:text-txt-4 focus:outline-none focus:border-accent/50"
                  />
                  <Button variant="primary" onClick={handleNLSegment}>Preview</Button>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="w-[280px] p-4 flex-shrink-0">
              <div className="text-xs font-medium text-txt-2 mb-2">Audience Preview</div>
              {previewLoading ? (
                <div className="text-2xs text-txt-4 animate-pulse">Counting...</div>
              ) : preview ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-accent" />
                    <span className="font-mono text-lg font-bold text-txt-0">{preview.count.toLocaleString()}</span>
                    <span className="text-2xs text-txt-4">customers</span>
                  </div>
                  {preview.sample?.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border-subtle">
                      <div className="text-2xs text-txt-4 mb-1">Sample</div>
                      {preview.sample.slice(0, 5).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-2xs text-txt-3">
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono">₹{Number(c.total_spent).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {!showSave ? (
                      <>
                        <Button variant="secondary" onClick={() => setShowSave(true)} className="flex-1">
                          <Save size={10} /> Save
                        </Button>
                        <Button variant="primary" onClick={() => nav('/agent', { state: { segment: { filter: buildFilterConfig(), count: preview?.count, source: 'filter_builder' } } })} className="flex-1">
                          Campaign →
                        </Button>
                      </>
                    ) : (
                      <div className="w-full space-y-2">
                        <input
                          value={saveName}
                          onChange={e => setSaveName(e.target.value)}
                          placeholder="Segment name..."
                          className="w-full px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 focus:outline-none focus:border-accent/50"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                        <div className="flex gap-1">
                          <Button variant="secondary" onClick={() => setShowSave(false)}>Cancel</Button>
                          <Button variant="primary" onClick={handleSave}>Save</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-2xs text-txt-4">Add conditions to see audience count</div>
              )}
            </div>
          </div>
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
                  {seg.description && <div className="text-2xs text-txt-4 mt-0.5 truncate">{seg.description}</div>}
                </div>
                <Badge variant="default">{seg.customer_count.toLocaleString()}</Badge>
                <button onClick={() => nav('/agent', { state: { segment: { name: seg.name, filter: seg.filter_config, count: seg.customer_count, source: 'saved_segment' } } })} className="text-2xs text-accent hover:text-accent-light font-medium">Campaign →</button>
              </div>
            ))}
            {!segments?.length && (
              <div className="px-3 py-8 text-center text-txt-4 text-xs">No segments saved yet. Use the builder above.</div>
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
    conditions.push({ field: 'days_since_last_order', operator: 'gt', value: days })
  }
  const spentMatch = q.match(/(?:spent|spend).*?(\d+)/)
  if (spentMatch) conditions.push({ field: 'total_spent', operator: 'gt', value: parseInt(spentMatch[1]) })
  if (conditions.length === 0) conditions.push({ field: 'total_orders', operator: 'gte', value: 1 })
  return { conditions, logic: 'AND' as const }
}
