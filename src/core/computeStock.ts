import type { CleanIssue, CleanReceipt, Item, Snapshot } from './types'

/** 일별 재고 1점 */
export interface DailyPoint {
  date: string
  stock: number
}

/** 품목별 재고 결과 (대시보드 표시용) */
export interface ItemStock {
  itemCode: string
  itemName: string
  unit: string
  boxQty: number
  openingCounted: number // 5/31 실사 (6월 시작점)
  closingStock: number // 6/30 현재고
  daily: DailyPoint[] // 5/31 앵커 + 6월 일별 추이
}

/** 5월 대조 검증 1행 (계획 §1-B) */
export interface MayReconRow {
  itemCode: string
  theoretical: number // "5/1=0 가정" 이론치 = 5월 입고 − 5월 출고
  counted: number // 5/31 실사
  diff: number // counted − theoretical
  match: boolean // 정합 여부
}

/**
 * ISO 날짜 문자열(YYYY-MM-DD)을 start~end 범위로 열거.
 * 타임존 영향을 피하려고 UTC 기준으로 하루씩 증가.
 */
export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const toUTC = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  const endMs = toUTC(end)
  const day = 24 * 60 * 60 * 1000
  for (let t = toUTC(start); t <= endMs; t += day) {
    dates.push(new Date(t).toISOString().slice(0, 10))
  }
  return dates
}

/** `${itemCode}|${date}` → 순증감(입고−출고) 맵 구성 */
function netByItemDate(
  receipts: CleanReceipt[],
  issues: CleanIssue[],
): Map<string, number> {
  const net = new Map<string, number>()
  const add = (code: string, date: string, delta: number) => {
    const key = `${code}|${date}`
    net.set(key, (net.get(key) ?? 0) + delta)
  }
  for (const r of receipts) add(r.itemCode, r.date, r.qty)
  for (const s of issues) add(s.itemCode, s.date, -s.qty)
  return net
}

/**
 * 6월 품목별 일별 재고 추이 (계획 §2).
 * 6/1 시작값 = 5/31 실사, 이후 6월 정제 거래를 일별 누적.
 * 8개 마스터 품목 전부를 반환 (6월 거래가 없어도 실사값 유지).
 */
export function computeJuneStock(
  items: Item[],
  snapshot: Snapshot[],
  receipts: CleanReceipt[],
  issues: CleanIssue[],
  monthStart = '2026-06-01',
  monthEnd = '2026-06-30',
  anchorDate = '2026-05-31',
): ItemStock[] {
  const snapMap = new Map(snapshot.map((s) => [s.itemCode, s.countedQty]))
  const net = netByItemDate(receipts, issues)
  const juneDates = enumerateDates(monthStart, monthEnd)

  return items.map((item) => {
    const opening = snapMap.get(item.itemCode) ?? 0
    const daily: DailyPoint[] = [{ date: anchorDate, stock: opening }]
    let running = opening
    for (const date of juneDates) {
      running += net.get(`${item.itemCode}|${date}`) ?? 0
      daily.push({ date, stock: running })
    }
    return {
      itemCode: item.itemCode,
      itemName: item.itemName,
      unit: item.unit,
      boxQty: item.boxQty,
      openingCounted: opening,
      closingStock: running,
      daily,
    }
  })
}

/**
 * 5월 대조 검증 (계획 §1-B).
 * "5/1=0 가정" 이론치(5월 입고−출고)를 5/31 실사와 대조하여 불일치 품목 산출.
 */
export function computeMayReconciliation(
  items: Item[],
  snapshot: Snapshot[],
  receipts: CleanReceipt[],
  issues: CleanIssue[],
  mayPrefix = '2026-05',
): MayReconRow[] {
  const snapMap = new Map(snapshot.map((s) => [s.itemCode, s.countedQty]))

  const sumMay = <T extends { itemCode: string; date: string; qty: number }>(
    records: T[],
    code: string,
  ) =>
    records
      .filter((r) => r.itemCode === code && r.date.startsWith(mayPrefix))
      .reduce((acc, r) => acc + r.qty, 0)

  return items.map((item) => {
    const theoretical =
      sumMay(receipts, item.itemCode) - sumMay(issues, item.itemCode)
    const counted = snapMap.get(item.itemCode) ?? 0
    const diff = counted - theoretical
    return {
      itemCode: item.itemCode,
      theoretical,
      counted,
      diff,
      match: diff === 0,
    }
  })
}
