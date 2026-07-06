import { cleanData } from './cleanData'
import {
  computeJuneStock,
  computeMayReconciliation,
  type ItemStock,
  type MayReconRow,
} from './computeStock'
import { backtestWeek, forecastWeek, type AccuracySummary, type ForecastRow } from './forecast'
import { parseIssues, parseItems, parseReceipts, parseSnapshot } from './parseCsv'
import { buildReconciliation, type ReconciliationReport } from './reconciliation'
import type { Anomaly, Item } from './types'

export interface DashboardModel {
  items: Item[]
  stock: ItemStock[] // 6월 재고 (현재고 + 일별 추이)
  mayReconciliation: MayReconRow[]
  report: ReconciliationReport
  anomalies: Anomaly[]
  forecast: ForecastRow[] // 7월 1주 예측
  backtest: AccuracySummary // 자체검증(5월→6월 1주)
}

export function buildDashboardModel(
  itemsText: string,
  receiptsText: string,
  issuesText: string,
  snapshotText: string,
): DashboardModel {
  const items = parseItems(itemsText)
  const rawReceipts = parseReceipts(receiptsText)
  const rawIssues = parseIssues(issuesText)
  const snapshot = parseSnapshot(snapshotText)

  const clean = cleanData(rawReceipts, rawIssues, items)
  const stock = computeJuneStock(items, snapshot, clean.receipts, clean.issues)
  const mayReconciliation = computeMayReconciliation(
    items,
    snapshot,
    clean.receipts,
    clean.issues,
  )
  const report = buildReconciliation(rawReceipts, rawIssues, clean, mayReconciliation)

  // 7월 1주 예측: 6월 일평균 기반 / 자체검증: 5월로 6월 1주 예측
  const forecast = forecastWeek(clean.issues, items, '2026-06-01', '2026-06-30', 7)
  const backtest = backtestWeek(
    clean.issues,
    items,
    '2026-05-01',
    '2026-05-31',
    '2026-06-01',
    '2026-06-07',
    7,
  )

  return {
    items,
    stock,
    mayReconciliation,
    report,
    anomalies: clean.anomalies,
    forecast,
    backtest,
  }
}
