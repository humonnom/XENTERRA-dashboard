import type { AnomalyType } from '../core/types'

/** 이상 유형 → 한글 라벨 */
export const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  code_normalized: '품목코드 정규화',
  unknown_item: '미상 품목코드',
  duplicate: '중복 행',
  price_anomaly: '단가 이상',
  negative_qty: '음수 수량',
  zero_qty: '수량 0',
}

/** 천 단위 구분 정수 */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR')
}

/** 소수 1자리 */
export function fmt1(n: number): string {
  return n.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/** 백분율 (소수 1자리), null이면 '—' */
export function fmtPct(v: number | null): string {
  return v === null ? '—' : `${(v * 100).toFixed(1)}%`
}
