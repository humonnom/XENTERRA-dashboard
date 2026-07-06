import { describe, expect, it } from 'vitest'
import { cleanData, normalizeCode } from './cleanData'
import type { Item, RawIssue, RawReceipt } from './types'

// 실제 마스터의 축소본 (테스트에 필요한 품목만)
const items: Item[] = [
  { itemCode: 'WD-1001', itemName: '와이어 하네스 A', unit: 'EA', boxQty: 1, unitPrice: 8500 },
  { itemCode: 'WD-1002', itemName: '와이어 하네스 B', unit: 'EA', boxQty: 1, unitPrice: 9200 },
  { itemCode: 'CN-2001', itemName: '커넥터 6P', unit: 'BOX', boxQty: 12, unitPrice: 15600 },
  { itemCode: 'GR-5001', itemName: '그로밋', unit: 'EA', boxQty: 1, unitPrice: 450 },
  { itemCode: 'CL-6001', itemName: '클립', unit: 'BOX', boxQty: 12, unitPrice: 3600 },
  { itemCode: 'TP-4001', itemName: '보호 테이프', unit: 'EA', boxQty: 1, unitPrice: 1200 },
]

describe('normalizeCode', () => {
  it('공백 제거 + 대문자화', () => {
    expect(normalizeCode('wd-1002 ')).toBe('WD-1002')
    expect(normalizeCode('  cn-2001')).toBe('CN-2001')
    expect(normalizeCode('WD-1001')).toBe('WD-1001')
  })
})

describe('cleanData - 구조적 이상 처리 (§1-A)', () => {
  it('정상 입고/출고는 그대로 통과', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R1', date: '2026-06-01', itemCode: 'WD-1001', qty: 30, unitPrice: 8500 },
    ]
    const issues: RawIssue[] = [
      { issueId: 'I1', date: '2026-06-02', itemCode: 'WD-1001', qty: 5 },
    ]
    const res = cleanData(receipts, issues, items)
    expect(res.receipts).toHaveLength(1)
    expect(res.issues).toHaveLength(1)
    expect(res.anomalies).toHaveLength(0)
    expect(res.receipts[0].effectiveUnitPrice).toBe(8500)
  })

  it('품목코드 공백/소문자 → 정규화 보정 후 유지', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R9001', date: '2026-06-20', itemCode: 'wd-1002 ', qty: 25, unitPrice: 9200 },
    ]
    const res = cleanData(receipts, [], items)
    expect(res.receipts).toHaveLength(1)
    expect(res.receipts[0].itemCode).toBe('WD-1002')
    const a = res.anomalies.find((x) => x.type === 'code_normalized')
    expect(a?.action).toBe('corrected')
  })

  it('마스터에 없는 품목코드 → 제외', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R9002', date: '2026-06-21', itemCode: 'XX-9999', qty: 10, unitPrice: 5000 },
    ]
    const res = cleanData(receipts, [], items)
    expect(res.receipts).toHaveLength(0)
    const a = res.anomalies.find((x) => x.type === 'unknown_item')
    expect(a?.action).toBe('excluded')
  })

  it('단가 0 → 마스터 단가로 금액 보정, 수량은 유지', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R9003', date: '2026-06-22', itemCode: 'TP-4001', qty: 30, unitPrice: 0 },
    ]
    const res = cleanData(receipts, [], items)
    expect(res.receipts).toHaveLength(1)
    expect(res.receipts[0].qty).toBe(30)
    expect(res.receipts[0].effectiveUnitPrice).toBe(1200)
    expect(res.anomalies.find((x) => x.type === 'price_anomaly')?.action).toBe('corrected')
  })

  it('단가 이상치(마스터와 불일치) → 마스터 단가로 보정', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R9004', date: '2026-06-23', itemCode: 'GR-5001', qty: 40, unitPrice: 45000 },
    ]
    const res = cleanData(receipts, [], items)
    expect(res.receipts[0].qty).toBe(40)
    expect(res.receipts[0].effectiveUnitPrice).toBe(450)
    expect(res.anomalies.some((x) => x.type === 'price_anomaly')).toBe(true)
  })

  it('동일 입고 ID 3중 중복 → 1건 유지, 2건 제외', () => {
    const dup: RawReceipt = {
      receiptId: 'R9005',
      date: '2026-06-24',
      itemCode: 'CL-6001',
      qty: 6,
      unitPrice: 3600,
    }
    const res = cleanData([dup, { ...dup }, { ...dup }], [], items)
    expect(res.receipts).toHaveLength(1)
    expect(res.anomalies.filter((x) => x.type === 'duplicate')).toHaveLength(2)
  })

  it('출고 수량 음수 → 제외', () => {
    const issues: RawIssue[] = [
      { issueId: 'I9101', date: '2026-06-25', itemCode: 'WD-1001', qty: -12 },
    ]
    const res = cleanData([], issues, items)
    expect(res.issues).toHaveLength(0)
    expect(res.anomalies.find((x) => x.type === 'negative_qty')?.action).toBe('excluded')
  })

  it('출고 수량 0 → 제외', () => {
    const issues: RawIssue[] = [
      { issueId: 'I9102', date: '2026-06-26', itemCode: 'CN-2001', qty: 0 },
    ]
    const res = cleanData([], issues, items)
    expect(res.issues).toHaveLength(0)
    expect(res.anomalies.find((x) => x.type === 'zero_qty')?.action).toBe('excluded')
  })

  it('7가지 구조적 이상을 한 번에 처리 (통합)', () => {
    const receipts: RawReceipt[] = [
      { receiptId: 'R9001', date: '2026-06-20', itemCode: 'wd-1002 ', qty: 25, unitPrice: 9200 },
      { receiptId: 'R9002', date: '2026-06-21', itemCode: 'XX-9999', qty: 10, unitPrice: 5000 },
      { receiptId: 'R9003', date: '2026-06-22', itemCode: 'TP-4001', qty: 30, unitPrice: 0 },
      { receiptId: 'R9004', date: '2026-06-23', itemCode: 'GR-5001', qty: 40, unitPrice: 45000 },
      { receiptId: 'R9005', date: '2026-06-24', itemCode: 'CL-6001', qty: 6, unitPrice: 3600 },
      { receiptId: 'R9005', date: '2026-06-24', itemCode: 'CL-6001', qty: 6, unitPrice: 3600 },
      { receiptId: 'R9005', date: '2026-06-24', itemCode: 'CL-6001', qty: 6, unitPrice: 3600 },
    ]
    const issues: RawIssue[] = [
      { issueId: 'I9101', date: '2026-06-25', itemCode: 'WD-1001', qty: -12 },
      { issueId: 'I9102', date: '2026-06-26', itemCode: 'CN-2001', qty: 0 },
    ]
    const res = cleanData(receipts, issues, items)

    // 유지: wd-1002 정규화, TP-4001 단가보정, GR-5001 단가보정, CL-6001 1건 = 입고 4건
    expect(res.receipts).toHaveLength(4)
    // 출고는 2건 모두 제외
    expect(res.issues).toHaveLength(0)
    // 이상 레코드 유형별 집계
    const byType = (t: string) => res.anomalies.filter((a) => a.type === t).length
    expect(byType('code_normalized')).toBe(1)
    expect(byType('unknown_item')).toBe(1)
    expect(byType('price_anomaly')).toBe(2)
    expect(byType('duplicate')).toBe(2)
    expect(byType('negative_qty')).toBe(1)
    expect(byType('zero_qty')).toBe(1)
  })
})
