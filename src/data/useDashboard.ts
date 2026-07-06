import { useEffect, useState } from 'react'
import { buildDashboardModel, type DashboardModel } from '../core/dashboard'

const FILES = [
  'items.csv',
  'receipts.csv',
  'issues.csv',
  'stock_snapshot_0531.csv',
] as const

interface DashboardState {
  model: DashboardModel | null
  loading: boolean
  error: string | null
}

/** public/data 의 CSV 4종을 fetch → 파싱/정제/계산하여 대시보드 모델 반환 */
export function useDashboard(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    model: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const texts = await Promise.all(
          FILES.map(async (f) => {
            const res = await fetch(`${import.meta.env.BASE_URL}data/${f}`)
            if (!res.ok) throw new Error(`${f} 로드 실패 (${res.status})`)
            return res.text()
          }),
        )
        const [items, receipts, issues, snapshot] = texts
        const model = buildDashboardModel(items, receipts, issues, snapshot)
        if (!cancelled) setState({ model, loading: false, error: null })
      } catch (e) {
        if (!cancelled)
          setState({
            model: null,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
