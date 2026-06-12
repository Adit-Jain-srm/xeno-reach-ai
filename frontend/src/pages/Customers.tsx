import { useQuery } from '@tanstack/react-query'
import { fetchCustomers } from '../services/api'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, filters],
    queryFn: () => fetchCustomers({ page, page_size: 20, search: search || undefined, ...filters }),
  })

  const tierColors: Record<string, string> = {
    platinum: 'bg-violet-500/10 text-violet-400',
    gold: 'bg-amber-500/10 text-amber-400',
    silver: 'bg-slate-400/10 text-slate-400',
    bronze: 'bg-orange-500/10 text-orange-400',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{data?.total?.toLocaleString() || '—'} total customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={filters.loyalty_tier || ''}
          onChange={e => { setFilters(f => ({ ...f, loyalty_tier: e.target.value })); setPage(1); }}
          className="px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
        >
          <option value="">All Tiers</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
        <select
          value={filters.city || ''}
          onChange={e => { setFilters(f => ({ ...f, city: e.target.value })); setPage(1); }}
          className="px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
        >
          <option value="">All Cities</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Pune">Pune</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Chennai">Chennai</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">City</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Orders</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Spent</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Engagement</th>
              <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Channel</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50">
                  <td colSpan={7} className="px-4 py-3"><div className="h-4 bg-[var(--border)] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : (
              data?.data?.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${tierColors[c.loyalty_tier] || ''}`}>
                      {c.loyalty_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.total_orders}</td>
                  <td className="px-4 py-3">₹{Number(c.total_spent).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${Number(c.engagement_score) * 100}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{(Number(c.engagement_score) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-xs">{c.preferred_channel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--text-muted)]">Page {page} of {data.total_pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
