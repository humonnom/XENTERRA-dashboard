// 도메인 타입 정의 — CSV 원본과 정제 결과, 이상 데이터 표현

/** 품목 마스터 (items.csv) */
export interface Item {
  itemCode: string
  itemName: string
  unit: string
  boxQty: number
  unitPrice: number
}

/** 입고 원본 (receipts.csv) */
export interface RawReceipt {
  receiptId: string
  date: string
  itemCode: string
  qty: number
  unitPrice: number
}

/** 출고 원본 (issues.csv) */
export interface RawIssue {
  issueId: string
  date: string
  itemCode: string
  qty: number
}

/** 5/31 실사 (stock_snapshot_0531.csv) */
export interface Snapshot {
  date: string
  itemCode: string
  countedQty: number
}

/** 이상 데이터 처리 방식 */
export type AnomalyAction = 'excluded' | 'corrected'

/** 이상 데이터 유형 */
export type AnomalyType =
  | 'code_normalized' // 품목코드 대소문자/공백 → 정규화 보정
  | 'unknown_item' // 마스터에 없는 품목코드 → 제외
  | 'duplicate' // 동일 ID 중복 행 → 제외
  | 'price_anomaly' // 단가 0 또는 마스터와 불일치 → 금액 보정
  | 'negative_qty' // 음수 수량 → 제외
  | 'zero_qty' // 0 수량 → 제외

/** 발견·처리된 이상 데이터 1건 (구조적 이상, §1-A) */
export interface Anomaly {
  source: 'receipt' | 'issue'
  id: string
  date: string
  itemCode: string
  type: AnomalyType
  action: AnomalyAction
  reason: string
}

/** 정제된 입고 (금액 대사용 보정 단가 포함) */
export interface CleanReceipt {
  receiptId: string
  date: string
  itemCode: string
  qty: number
  unitPrice: number // 원본 단가
  effectiveUnitPrice: number // 금액 대사에 사용할 단가 (이상 시 마스터 단가)
}

/** 정제된 출고 */
export interface CleanIssue {
  issueId: string
  date: string
  itemCode: string
  qty: number
}

/** cleanData 결과 */
export interface CleanResult {
  receipts: CleanReceipt[]
  issues: CleanIssue[]
  anomalies: Anomaly[]
}
