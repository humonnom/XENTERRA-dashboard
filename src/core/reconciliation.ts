import type { MayReconRow } from './computeStock'
import type {
  AnomalyType,
  CleanResult,
  RawIssue,
  RawReceipt,
} from './types'

export interface QtyTotals {
  receiptCountRaw: number
  receiptCountClean: number
  receiptQtyRaw: number
  receiptQtyClean: number
  issueCountRaw: number
  issueCountClean: number
  issueQtyRaw: number
  issueQtyClean: number
}

export interface AnomalyCount {
  type: AnomalyType
  count: number
}

export interface ReconciliationReport {
  totals: QtyTotals
  anomalies: {
    total: number
    excluded: number
    corrected: number
    byType: AnomalyCount[]
  }
  amount: {
    receiptAmountRaw: number // 원본 단가 기준 (이상치 포함)
    receiptAmountClean: number // 보정 단가 기준 (제외 반영)
  }
  mayReconciliation: {
    match: number
    mismatch: number
    mismatchItems: string[]
  }
}

const sumQty = (rows: { qty: number }[]) =>
  rows.reduce((acc, r) => acc + r.qty, 0)

/**
 * 합계 대사표 산출.
 * 정제 전(raw) 대비 정제 후(clean)의 건수·수량·금액을 대조하고,
 * 이상 데이터 유형별 집계와 5월 대조 요약을 함께 제공.
 */
export function buildReconciliation(
  rawReceipts: RawReceipt[],
  rawIssues: RawIssue[],
  clean: CleanResult,
  mayRecon: MayReconRow[],
): ReconciliationReport {
  const totals: QtyTotals = {
    receiptCountRaw: rawReceipts.length,
    receiptCountClean: clean.receipts.length,
    receiptQtyRaw: sumQty(rawReceipts),
    receiptQtyClean: sumQty(clean.receipts),
    issueCountRaw: rawIssues.length,
    issueCountClean: clean.issues.length,
    issueQtyRaw: sumQty(rawIssues),
    issueQtyClean: sumQty(clean.issues),
  }

  const byTypeMap = new Map<AnomalyType, number>()
  let excluded = 0
  let corrected = 0
  for (const a of clean.anomalies) {
    byTypeMap.set(a.type, (byTypeMap.get(a.type) ?? 0) + 1)
    if (a.action === 'excluded') excluded++
    else corrected++
  }

  const receiptAmountRaw = rawReceipts.reduce(
    (acc, r) => acc + r.qty * r.unitPrice,
    0,
  )
  const receiptAmountClean = clean.receipts.reduce(
    (acc, r) => acc + r.qty * r.effectiveUnitPrice,
    0,
  )

  const mismatch = mayRecon.filter((r) => !r.match)

  return {
    totals,
    anomalies: {
      total: clean.anomalies.length,
      excluded,
      corrected,
      byType: [...byTypeMap.entries()].map(([type, count]) => ({ type, count })),
    },
    amount: {
      receiptAmountRaw,
      receiptAmountClean,
    },
    mayReconciliation: {
      match: mayRecon.filter((r) => r.match).length,
      mismatch: mismatch.length,
      mismatchItems: mismatch.map((r) => r.itemCode),
    },
  }
}
