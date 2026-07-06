import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseItems, parseIssues, parseReceipts, parseSnapshot } from './parseCsv'
import { cleanData } from './cleanData'
import { computeMayReconciliation } from './computeStock'
import { buildReconciliation } from './reconciliation'
import { backtestWeek, forecastWeek } from './forecast'

const read = (f: string) =>
  readFileSync(resolve(__dirname, '../../public/data', f), 'utf8')

describe('실제 데이터 통합 검증', () => {
  const items = parseItems(read('items.csv'))
  const rawReceipts = parseReceipts(read('receipts.csv'))
  const rawIssues = parseIssues(read('issues.csv'))
  const snapshot = parseSnapshot(read('stock_snapshot_0531.csv'))
  const clean = cleanData(rawReceipts, rawIssues, items)
  const recon = computeMayReconciliation(items, snapshot, clean.receipts, clean.issues)
  const report = buildReconciliation(rawReceipts, rawIssues, clean, recon)

  it('5월 대조: 정합 5건 / 불일치 3건', () => {
    expect(recon.filter((r) => r.match)).toHaveLength(5)
    expect(recon.filter((r) => !r.match)).toHaveLength(3)
  })

  it('불일치 3건이 awk 분석과 일치 (CN-2002 +4, TM-3001 −2, WD-1001 −7)', () => {
    const byCode = Object.fromEntries(recon.map((r) => [r.itemCode, r.diff]))
    expect(byCode['CN-2002']).toBe(4)
    expect(byCode['TM-3001']).toBe(-2)
    expect(byCode['WD-1001']).toBe(-7)
  })

  it('합계 대사표 입고: 정제 전 287건/8747개 → 후 284건/8725개 (awk 교차검산)', () => {
    expect(report.totals.receiptCountRaw).toBe(287)
    expect(report.totals.receiptQtyRaw).toBe(8747)
    expect(report.totals.receiptCountClean).toBe(284)
    expect(report.totals.receiptQtyClean).toBe(8725)
  })

  it('합계 대사표 출고: 정제 전 254건/3642개 → 후 252건/3654개', () => {
    expect(report.totals.issueCountRaw).toBe(254)
    expect(report.totals.issueQtyRaw).toBe(3642)
    expect(report.totals.issueCountClean).toBe(252)
    expect(report.totals.issueQtyClean).toBe(3654)
  })

  it('금액 대사: 원본 51,806,600원 → 보정 49,967,400원 (awk 교차검산)', () => {
    expect(report.amount.receiptAmountRaw).toBe(51806600)
    expect(report.amount.receiptAmountClean).toBe(49967400)
  })

  it('이상 데이터: 총 8건 (제외 5, 보정 3)', () => {
    expect(report.anomalies.total).toBe(8)
    expect(report.anomalies.excluded).toBe(5)
    expect(report.anomalies.corrected).toBe(3)
  })

  it('7월 1주 예측: 6월 일평균×7, WD-1002는 6월 출고 기반 (awk 교차검산)', () => {
    // 6월 WD-1002 정제 출고 합 / 30일 × 7
    const juneWd1002 = clean.issues
      .filter((s) => s.itemCode === 'WD-1002' && s.date.startsWith('2026-06'))
      .reduce((acc, s) => acc + s.qty, 0)
    const july = forecastWeek(clean.issues, items, '2026-06-01', '2026-06-30', 7)
    const wd = july.find((f) => f.itemCode === 'WD-1002')!
    expect(wd.forecastQty).toBeCloseTo((juneWd1002 / 30) * 7, 6)
  })

  it('자체검증(5월→6월 1주): WD-1002 예측 460/31×7, 실제 140', () => {
    const bt = backtestWeek(
      clean.issues,
      items,
      '2026-05-01',
      '2026-05-31',
      '2026-06-01',
      '2026-06-07',
    )
    const wd = bt.rows.find((r) => r.itemCode === 'WD-1002')!
    expect(wd.predicted).toBeCloseTo((460 / 31) * 7, 6) // 5월 460개
    expect(wd.actual).toBe(140) // 실제 6/1~6/7
    expect(bt.mae).toBeGreaterThan(0)
    expect(bt.mape).not.toBeNull() // 6월 1주 전 품목 출고>0 → MAPE 계산 가능
  })
})
