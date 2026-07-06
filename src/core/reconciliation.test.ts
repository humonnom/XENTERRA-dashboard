import { describe, expect, it } from 'vitest'
import { cleanData } from './cleanData'
import type { MayReconRow } from './computeStock'
import { buildReconciliation } from './reconciliation'
import type { Item, RawIssue, RawReceipt } from './types'

const items: Item[] = [
  { itemCode: 'WD-1001', itemName: '와이어 하네스 A', unit: 'EA', boxQty: 1, unitPrice: 8500 },
  { itemCode: 'TP-4001', itemName: '보호 테이프', unit: 'EA', boxQty: 1, unitPrice: 1200 },
]

const rawReceipts: RawReceipt[] = [
  { receiptId: 'R1', date: '2026-06-01', itemCode: 'WD-1001', qty: 10, unitPrice: 8500 },
  { receiptId: 'R2', date: '2026-06-02', itemCode: 'XX-9999', qty: 5, unitPrice: 100 }, // 제외
  { receiptId: 'R3', date: '2026-06-03', itemCode: 'TP-4001', qty: 20, unitPrice: 0 }, // 단가보정
]

const rawIssues: RawIssue[] = [
  { issueId: 'I1', date: '2026-06-04', itemCode: 'WD-1001', qty: 3 },
  { issueId: 'I2', date: '2026-06-05', itemCode: 'WD-1001', qty: -1 }, // 제외
]

const mayRecon: MayReconRow[] = [
  { itemCode: 'WD-1001', theoretical: 100, counted: 100, diff: 0, match: true },
  { itemCode: 'TP-4001', theoretical: 46, counted: 50, diff: 4, match: false },
]

describe('buildReconciliation - 합계 대사표', () => {
  const clean = cleanData(rawReceipts, rawIssues, items)
  const report = buildReconciliation(rawReceipts, rawIssues, clean, mayRecon)

  it('입고 건수/수량: 정제 전 3건35 → 후 2건30', () => {
    expect(report.totals.receiptCountRaw).toBe(3)
    expect(report.totals.receiptCountClean).toBe(2)
    expect(report.totals.receiptQtyRaw).toBe(35)
    expect(report.totals.receiptQtyClean).toBe(30)
  })

  it('출고 건수/수량: 정제 전 2건2 → 후 1건3 (음수 제외로 합 증가)', () => {
    expect(report.totals.issueCountRaw).toBe(2)
    expect(report.totals.issueCountClean).toBe(1)
    expect(report.totals.issueQtyRaw).toBe(2)
    expect(report.totals.issueQtyClean).toBe(3)
  })

  it('금액: 원본 85,500 → 보정 109,000 (단가 0 보정 반영)', () => {
    expect(report.amount.receiptAmountRaw).toBe(85500)
    expect(report.amount.receiptAmountClean).toBe(109000)
  })

  it('이상 집계: 총 3건 (제외 2, 보정 1)', () => {
    expect(report.anomalies.total).toBe(3)
    expect(report.anomalies.excluded).toBe(2)
    expect(report.anomalies.corrected).toBe(1)
  })

  it('5월 대조 요약: 정합 1 / 불일치 1', () => {
    expect(report.mayReconciliation.match).toBe(1)
    expect(report.mayReconciliation.mismatch).toBe(1)
    expect(report.mayReconciliation.mismatchItems).toEqual(['TP-4001'])
  })
})
