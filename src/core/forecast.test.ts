import { describe, expect, it } from 'vitest'
import { backtestWeek, forecastWeek } from './forecast'
import type { CleanIssue, Item } from './types'

const items: Item[] = [
  { itemCode: 'A', itemName: '품목 A', unit: 'EA', boxQty: 1, unitPrice: 100 },
  { itemCode: 'B', itemName: '품목 B', unit: 'EA', boxQty: 1, unitPrice: 100 },
]

const issue = (date: string, itemCode: string, qty: number): CleanIssue => ({
  issueId: `${itemCode}-${date}`,
  date,
  itemCode,
  qty,
})

describe('forecastWeek - 단순 일평균×7', () => {
  it('학습 10일간 총 70개 → 일평균 7 → 주간 예측 49', () => {
    const issues: CleanIssue[] = [
      issue('2026-05-01', 'A', 40),
      issue('2026-05-05', 'A', 30),
    ]
    const [a] = forecastWeek(issues, [items[0]], '2026-05-01', '2026-05-10', 7)
    expect(a.dailyAvg).toBeCloseTo(7, 6) // 70 / 10일
    expect(a.forecastQty).toBeCloseTo(49, 6) // 7 × 7
  })

  it('출고 없는 품목은 예측 0', () => {
    const [b] = forecastWeek([], [items[1]], '2026-05-01', '2026-05-10', 7)
    expect(b.forecastQty).toBe(0)
  })
})

describe('backtestWeek - 자체검증 MAE/MAPE', () => {
  it('예측 대비 실제 오차를 정확히 산출', () => {
    const issues: CleanIssue[] = [
      // 학습(5월 10일): A 70개 → 예측 49
      issue('2026-05-01', 'A', 40),
      issue('2026-05-05', 'A', 30),
      // 실제(6/1~6/7): A 42개
      issue('2026-06-03', 'A', 42),
    ]
    const res = backtestWeek(
      issues,
      [items[0]],
      '2026-05-01',
      '2026-05-10',
      '2026-06-01',
      '2026-06-07',
    )
    const a = res.rows[0]
    expect(a.predicted).toBeCloseTo(49, 6)
    expect(a.actual).toBe(42)
    expect(a.absError).toBeCloseTo(7, 6)
    expect(a.pctError).toBeCloseTo(7 / 42, 6)
    expect(res.mae).toBeCloseTo(7, 6)
  })

  it('실제 출고 0인 품목은 MAPE에서 제외 (0-나눗셈 회피)', () => {
    const issues: CleanIssue[] = [
      issue('2026-05-02', 'A', 30), // A: 학습만, 실제 0
    ]
    const res = backtestWeek(
      issues,
      [items[0]],
      '2026-05-01',
      '2026-05-10',
      '2026-06-01',
      '2026-06-07',
    )
    expect(res.rows[0].actual).toBe(0)
    expect(res.rows[0].pctError).toBeNull()
    expect(res.excludedFromMape).toEqual(['A'])
    expect(res.mape).toBeNull() // 유효 품목이 없으면 null
    expect(res.mae).toBeGreaterThan(0) // MAE는 여전히 계산됨
  })
})
