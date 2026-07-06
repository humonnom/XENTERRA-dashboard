import type {
  Anomaly,
  CleanIssue,
  CleanReceipt,
  CleanResult,
  Item,
  RawIssue,
  RawReceipt,
} from './types'

/** 품목코드 정규화: 앞뒤 공백 제거 + 대문자화 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * 구조적 데이터 정제.
 * 규칙:
 *  - 품목코드 공백/소문자 → 정규화 보정 (유지)
 *  - 마스터에 없는 품목 → 제외
 *  - 동일 ID 중복 행 → 최초 1건만 유지, 나머지 제외
 *  - 단가 0 또는 마스터 단가와 불일치 → 금액용 단가를 마스터 값으로 보정 (수량 유지)
 *  - 출고 수량 음수/0 → 제외
 */
export function cleanData(
  rawReceipts: RawReceipt[],
  rawIssues: RawIssue[],
  items: Item[],
): CleanResult {
  const master = new Map(items.map((i) => [i.itemCode, i]))
  const anomalies: Anomaly[] = []

  const receipts: CleanReceipt[] = []
  const seenReceiptIds = new Set<string>()

  for (const r of rawReceipts) {
    const normalized = normalizeCode(r.itemCode)
    if (normalized !== r.itemCode) {
      anomalies.push({
        source: 'receipt',
        id: r.receiptId,
        date: r.date,
        itemCode: normalized,
        type: 'code_normalized',
        action: 'corrected',
        reason: `품목코드 '${r.itemCode}' → '${normalized}' 정규화(공백/대소문자)`,
      })
    }

    const item = master.get(normalized)
    if (!item) {
      anomalies.push({
        source: 'receipt',
        id: r.receiptId,
        date: r.date,
        itemCode: normalized,
        type: 'unknown_item',
        action: 'excluded',
        reason: `품목 마스터에 없는 코드 '${normalized}'`,
      })
      continue
    }

    if (seenReceiptIds.has(r.receiptId)) {
      anomalies.push({
        source: 'receipt',
        id: r.receiptId,
        date: r.date,
        itemCode: normalized,
        type: 'duplicate',
        action: 'excluded',
        reason: `중복된 입고 ID '${r.receiptId}' (최초 1건만 유지)`,
      })
      continue
    }
    seenReceiptIds.add(r.receiptId)

    let effectiveUnitPrice = r.unitPrice
    if (r.unitPrice <= 0 || r.unitPrice !== item.unitPrice) {
      effectiveUnitPrice = item.unitPrice
      anomalies.push({
        source: 'receipt',
        id: r.receiptId,
        date: r.date,
        itemCode: normalized,
        type: 'price_anomaly',
        action: 'corrected',
        reason: `단가 ${r.unitPrice} → 마스터 단가 ${item.unitPrice}로 금액 보정(수량 유지)`,
      })
    }

    receipts.push({
      receiptId: r.receiptId,
      date: r.date,
      itemCode: normalized,
      qty: r.qty,
      unitPrice: r.unitPrice,
      effectiveUnitPrice,
    })
  }

  const issues: CleanIssue[] = []
  const seenIssueIds = new Set<string>()

  for (const s of rawIssues) {
    const normalized = normalizeCode(s.itemCode)
    if (normalized !== s.itemCode) {
      anomalies.push({
        source: 'issue',
        id: s.issueId,
        date: s.date,
        itemCode: normalized,
        type: 'code_normalized',
        action: 'corrected',
        reason: `품목코드 '${s.itemCode}' → '${normalized}' 정규화(공백/대소문자)`,
      })
    }

    if (!master.has(normalized)) {
      anomalies.push({
        source: 'issue',
        id: s.issueId,
        date: s.date,
        itemCode: normalized,
        type: 'unknown_item',
        action: 'excluded',
        reason: `품목 마스터에 없는 코드 '${normalized}'`,
      })
      continue
    }

    if (seenIssueIds.has(s.issueId)) {
      anomalies.push({
        source: 'issue',
        id: s.issueId,
        date: s.date,
        itemCode: normalized,
        type: 'duplicate',
        action: 'excluded',
        reason: `중복된 출고 ID '${s.issueId}' (최초 1건만 유지)`,
      })
      continue
    }
    seenIssueIds.add(s.issueId)

    if (s.qty < 0) {
      anomalies.push({
        source: 'issue',
        id: s.issueId,
        date: s.date,
        itemCode: normalized,
        type: 'negative_qty',
        action: 'excluded',
        reason: `음수 출고 수량 ${s.qty} (원인 불명, 제외)`,
      })
      continue
    }
    if (s.qty === 0) {
      anomalies.push({
        source: 'issue',
        id: s.issueId,
        date: s.date,
        itemCode: normalized,
        type: 'zero_qty',
        action: 'excluded',
        reason: `수량 0 출고 (무의미 거래, 제외)`,
      })
      continue
    }

    issues.push({
      issueId: s.issueId,
      date: s.date,
      itemCode: normalized,
      qty: s.qty,
    })
  }

  return { receipts, issues, anomalies }
}
