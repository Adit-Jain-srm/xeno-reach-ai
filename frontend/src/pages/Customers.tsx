import { useQuery } from '@tanstack/react-query'
import { fetchCustomers } from '../services/api'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tier, setTier] = useState('')
  const [city, setCity] = useState('')

  const { data } = useQuery({
    queryKey: ['customers', page, search, tier, city],
    queryFn: () => fetchCustomers({ page, page_size: 25, search: search || undefined, loyalty_tier: tier || undefined, city: city || undefined }),
  })

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center px-5 border-b border-border-subtle flex-shrink-0 gap-3">
        <h1 className="text-md font-semibold text-txt-0">Customers</h1>
        <span className="text-2xs text-txt-4">{data?.total?.toLocaleString() || '—'} total</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-4" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search..." className="pl-7 pr-3 py-1.5 w-48 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-0 placeholder:text-txt-4 focus:outline-none focus:border-accent/50" />
          </div>
          <select value={tier} onChange={e => { setTier(e.target.value); setPage(1) }} className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-1 focus:outline-none">
            <option value="">All Tiers</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
          <select value={city} onChange={e => { setCity(e.target.value); setPage(1) }} className="px-2 py-1.5 rounded-md bg-bg-2 border border-border-subtle text-xs text-txt-1 focus:outline-none">
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Chennai">Chennai</option>
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-1 border-b border-border-subtle">
            <tr className="text-2xs text-txt-4 font-medium tracking-wider">
              <th className="text-left px-5 py-2">CUSTOMER</th>
              <th className="text-left px-3 py-2">CITY</th>
              <th className="text-left px-3 py-2">TIER</th>
              <th className="text-right px-3 py-2">ORDERS</th>
              <th className="text-right px-3 py-2">SPENT</th>
              <th className="text-right px-3 py-2">ENGAGEMENT</th>
              <th className="text-right px-5 py-2">CHANNEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data?.data?.map((c: any) => (
              <tr key={c.id} className="hover:bg-bg-2 transition-colors">
                <td className="px-5 py-2">
                  <div className="text-txt-0 font-medium">{c.name}</div>
                  <div className="text-2xs text-txt-4">{c.email}</div>
                </td>
                <td className="px-3 py-2 text-txt-2">{c.city}</td>
                <td className="px-3 py-2">
                  <span className={`badge ${c.loyalty_tier === 'platinum' ? 'bg-purple-500/10 text-purple-400' : c.loyalty_tier === 'gold' ? 'bg-semantic-amber/10 text-semantic-amber' : c.loyalty_tier === 'silver' ? 'bg-gray-400/10 text-gray-400' : 'bg-orange-500/10 text-orange-400'}`}>{c.loyalty_tier}</span>
                </td>
                <td className="px-3 py-2 text-right data-value text-txt-1">{c.total_orders}</td>
                <td className="px-3 py-2 text-right data-value text-txt-1">₹{Number(c.total_spent).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="w-12 h-1 bg-bg-3 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${Number(c.engagement_score) * 100}%` }} /></div>
                    <span className="data-value text-2xs text-txt-3">{(Number(c.engagement_score) * 100).toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-5 py-2 text-right text-2xs text-txt-3 capitalize">{c.preferred_channel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total_pages > 1 && (
        <div className="h-10 flex items-center justify-between px-5 border-t border-border-subtle text-2xs text-txt-4">
          <span>Page {page}/{data.total_pages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded bg-bg-2 border border-border-subtle disabled:opacity-30 hover:bg-bg-3">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages} className="px-2 py-1 rounded bg-bg-2 border border-border-subtle disabled:opacity-30 hover:bg-bg-3">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
