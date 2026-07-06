import { describe, expect, it } from 'vitest'
import {
  computeJuneStock,
  computeMayReconciliation,
  enumerateDates,
} from './computeStock'
import type { CleanIssue, CleanReceipt, Item, Snapshot } from './types'

const items: Item[] = [
  { itemCode: 'WD-1001', itemName: '와이어 하네스 A', unit: 'EA', boxQty: 1, unitPrice: 8500 },
  { itemCode: 'CN-2001', itemName: '커넥터 6P', unit: 'BOX', boxQty: 12, unitPrice: 15600 },
  { itemCode: 'GR-5001', itemName: '그로밋', unit: 'EA', boxQty: 1, unitPrice: 450 },
]

const snapshot: Snapshot[] = [
  { date: '2026-05-31', itemCode: 'WD-1001', countedQty: 100 },
  { date: '2026-05-31', itemCode: 'CN-2001', countedQty: 50 },
  // GR-5001은 실사에 없음 → opening 0으로 처리되는지 확인
]

const receipt = (
  receiptId: string,
  date: string,
  itemCode: string,
  qty: number,
): CleanReceipt => ({
  receiptId,
  date,
  itemCode,
  qty,
  unitPrice: 0,
  effectiveUnitPrice: 0,
})

const issue = (
  issueId: string,
  date: string,
  itemCode: string,
  qty: number,
): CleanIssue => ({ issueId, date, itemCode, qty })

const receipts: CleanReceipt[] = [
  // 5월 (대조 검증용)
  receipt('R1', '2026-05-10', 'WD-1001', 120),
  receipt('R2', '2026-05-12', 'CN-2001', 60),
  // 6월 (재고 추이용)
  receipt('R3', '2026-06-05', 'WD-1001', 30),
]

const issues: CleanIssue[] = [
  // 5월
  issue('I1', '2026-05-15', 'WD-1001', 20),
  issue('I2', '2026-05-18', 'CN-2001', 14),
  // 6월
  issue('I3', '2026-06-10', 'WD-1001', 10),
]

describe('enumerateDates', () => {
  it('6월 전체 30일을 열거', () => {
    const d = enumerateDates('2026-06-01', '2026-06-30')
    expect(d).toHaveLength(30)
    expect(d[0]).toBe('2026-06-01')
    expect(d[29]).toBe('2026-06-30')
  })

  it('월 경계를 정확히 넘김 (타임존 안전)', () => {
    const d = enumerateDates('2026-05-30', '2026-06-02')
    expect(d).toEqual(['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02'])
  })
})

describe('computeJuneStock', () => {
  const result = computeJuneStock(items, snapshot, receipts, issues)

  it('8개 아닌 3개 마스터 품목 전부 반환 (거래 없는 품목 포함)', () => {
    expect(result.map((r) => r.itemCode)).toEqual(['WD-1001', 'CN-2001', 'GR-5001'])
  })

  it('WD-1001: 6/30 현재고 = 5/31 실사 100 + 6월 입고 30 − 출고 10 = 120', () => {
    const wd = result.find((r) => r.itemCode === 'WD-1001')!
    expect(wd.openingCounted).toBe(100)
    expect(wd.closingStock).toBe(120)
  })

  it('일별 추이가 실사 앵커(5/31)부터 시작하고 거래일에 정확히 반영', () => {
    const wd = result.find((r) => r.itemCode === 'WD-1001')!
    expect(wd.daily).toHaveLength(31) // 5/31 앵커 + 6월 30일
    expect(wd.daily[0]).toEqual({ date: '2026-05-31', stock: 100 })
    expect(wd.daily.find((p) => p.date === '2026-06-05')!.stock).toBe(130)
    expect(wd.daily.find((p) => p.date === '2026-06-10')!.stock).toBe(120)
    expect(wd.daily.at(-1)!.stock).toBe(120)
  })

  it('6월 거래 없는 품목은 실사값을 그대로 유지', () => {
    const cn = result.find((r) => r.itemCode === 'CN-2001')!
    expect(cn.closingStock).toBe(50)
    expect(cn.daily.every((p) => p.stock === 50)).toBe(true)
  })

  it('실사에 없는 품목은 opening 0으로 처리', () => {
    const gr = result.find((r) => r.itemCode === 'GR-5001')!
    expect(gr.openingCounted).toBe(0)
    expect(gr.closingStock).toBe(0)
  })
})

describe('computeMayReconciliation', () => {
  const recon = computeMayReconciliation(items, snapshot, receipts, issues)

  it('WD-1001: 이론치(120−20=100) == 실사 100 → 정합', () => {
    const wd = recon.find((r) => r.itemCode === 'WD-1001')!
    expect(wd.theoretical).toBe(100)
    expect(wd.counted).toBe(100)
    expect(wd.diff).toBe(0)
    expect(wd.match).toBe(true)
  })

  it('CN-2001: 이론치(60−14=46) vs 실사 50 → 불일치 +4', () => {
    const cn = recon.find((r) => r.itemCode === 'CN-2001')!
    expect(cn.theoretical).toBe(46)
    expect(cn.counted).toBe(50)
    expect(cn.diff).toBe(4)
    expect(cn.match).toBe(false)
  })

  it('6월 거래는 5월 대조에 포함되지 않음', () => {
    // WD-1001의 6월 입고 30/출고 10은 이론치에 영향 없어야 함
    const wd = recon.find((r) => r.itemCode === 'WD-1001')!
    expect(wd.theoretical).toBe(100)
  })
})
