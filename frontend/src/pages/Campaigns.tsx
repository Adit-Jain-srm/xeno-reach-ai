import { useQuery } from '@tanstack/react-query'
import { fetchCampaigns } from '../services/api'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function Campaigns() {
  const { data } = useQuery({ queryKey: ['campaigns'], queryFn: () => fetchCampaigns({}) })

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-md font-semibold text-txt-0">Campaigns</h1>
        <Link to="/agent" className="btn-pill btn-pill-filled text-xs">
          <Plus size={11} /> Create
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-1 border-b border-border-subtle">
            <tr className="text-2xs text-txt-4 font-medium tracking-wider">
              <th className="text-left px-5 py-2">NAME</th>
              <th className="text-left px-3 py-2">CHANNEL</th>
              <th className="text-right px-3 py-2">AUDIENCE</th>
              <th className="text-right px-3 py-2">DELIVERY</th>
              <th className="text-right px-5 py-2">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data?.data?.map((c: any) => (
              <tr key={c.id} className="hover:bg-bg-2 transition-colors cursor-pointer" onClick={() => window.location.href = `/campaigns/${c.id}`}>
                <td className="px-5 py-2.5">
                  <div className="text-txt-0 font-medium">{c.name}</div>
                  <div className="text-2xs text-txt-4 mt-0.5">{c.goal?.slice(0, 50)}</div>
                </td>
                <td className="px-3 py-2.5 text-xs text-txt-2 capitalize">{c.channels?.join(', ')}</td>
                <td className="px-3 py-2.5 text-right data-value text-txt-1">{c.audience_count?.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right data-value text-txt-1">{c.campaign_stats?.[0]?.delivery_rate || '—'}%</td>
                <td className="px-5 py-2.5 text-right">
                  <span className={`badge ${
                    c.status === 'completed' ? 'bg-semantic-green/10 text-semantic-green' :
                    c.status === 'running' ? 'bg-semantic-blue/10 text-semantic-blue' :
                    c.status === 'failed' ? 'bg-semantic-red/10 text-semantic-red' :
                    'bg-bg-3 text-txt-4'
                  }`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.data?.length && <div className="text-center text-txt-4 text-xs py-12">No campaigns</div>}
      </div>
    </div>
  )
}
