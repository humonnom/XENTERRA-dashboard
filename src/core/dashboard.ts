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

/** 대시보드 전체 모델 (모든 계산 결과 집약) */
export interface DashboardModel {
  items: Item[]
  stock: ItemStock[] // 6월 재고 (현재고 + 일별 추이)
  mayReconciliation: MayReconRow[] // §1-B 대조
  report: ReconciliationReport // 합계 대사표
  anomalies: Anomaly[] // §1-A 구조적 이상
  forecast: ForecastRow[] // 7월 1주 예측
  backtest: AccuracySummary // 자체검증(5월→6월 1주)
}

/**
 * 4개 CSV 텍스트로부터 대시보드 모델 전체를 구성 (순수 함수).
 * 파싱 → 정제 → 재고/대조/대사/예측을 한 번에 계산.
 */
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
