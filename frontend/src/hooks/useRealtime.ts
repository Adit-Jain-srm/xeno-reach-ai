import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeSubscription(
  table: string,
  filter?: { column: string; value: string },
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const channelName = filter ? `${table}:${filter.column}:${filter.value}` : table

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        (payload: any) => {
          setData(payload.new)
          callback?.(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter?.column, filter?.value, callback])

  return data
}

export function useCampaignStatsRealtime(campaignId: string | undefined) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!campaignId) return

    const channel = supabase
      .channel(`campaign-stats-${campaignId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_stats',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload: any) => {
          setStats(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId])

  return stats
}
