import type { AnomalyType } from '../core/types'

export const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  code_normalized: '품목코드 정규화',
  unknown_item: '미상 품목코드',
  duplicate: '중복 행',
  price_anomaly: '단가 이상',
  negative_qty: '음수 수량',
  zero_qty: '수량 0',
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR')
}
