import { enumerateDates } from './computeStock'
import type { CleanIssue, Item } from './types'

export interface ForecastRow {
  itemCode: string
  dailyAvg: number // 학습 구간 일평균 출고
  forecastQty: number // dailyAvg × horizonDays
}

export interface AccuracyRow {
  itemCode: string
  predicted: number
  actual: number
  absError: number
  pctError: number | null // 실제=0이면 계산 불가(null)
}

export interface AccuracySummary {
  rows: AccuracyRow[]
  mae: number // 평균 절대 오차
  mape: number | null // 평균 절대 백분율 오차 (실제>0 품목만)
  excludedFromMape: string[] // 실제=0으로 MAPE에서 제외된 품목
}

const sumIssuesInRange = (
  issues: CleanIssue[],
  itemCode: string,
  start: string,
  end: string,
) =>
  issues
    .filter((s) => s.itemCode === itemCode && s.date >= start && s.date <= end)
    .reduce((acc, s) => acc + s.qty, 0)

/**
 * 방법: 학습 구간의 일평균 출고 × horizonDays.
 * 데이터가 희소해 요일 가중/회귀 대신 단순·설명가능한 기준선을 채택.
 */
export function forecastWeek(
  issues: CleanIssue[],
  items: Item[],
  trainStart: string,
  trainEnd: string,
  horizonDays = 7,
): ForecastRow[] {
  const trainDays = enumerateDates(trainStart, trainEnd).length
  return items.map((item) => {
    const total = sumIssuesInRange(issues, item.itemCode, trainStart, trainEnd)
    const dailyAvg = total / trainDays
    return {
      itemCode: item.itemCode,
      dailyAvg,
      forecastQty: dailyAvg * horizonDays,
    }
  })
}

/**
 * 학습 구간으로 예측한 뒤 실제 구간과 비교해 MAE/MAPE 산출.
 * 예: 학습=5월, 실제=6/1~6/7 → "5월로 6월 1주 예측"의 오차.
 * MAPE는 실제=0인 품목에서 발산하므로 해당 품목을 제외하고 계산.
 */
export function backtestWeek(
  issues: CleanIssue[],
  items: Item[],
  trainStart: string,
  trainEnd: string,
  actualStart: string,
  actualEnd: string,
  horizonDays = 7,
): AccuracySummary {
  const forecast = forecastWeek(issues, items, trainStart, trainEnd, horizonDays)
  const forecastMap = new Map(forecast.map((f) => [f.itemCode, f.forecastQty]))

  const rows: AccuracyRow[] = items.map((item) => {
    const predicted = forecastMap.get(item.itemCode) ?? 0
    const actual = sumIssuesInRange(
      issues,
      item.itemCode,
      actualStart,
      actualEnd,
    )
    const absError = Math.abs(predicted - actual)
    return {
      itemCode: item.itemCode,
      predicted,
      actual,
      absError,
      pctError: actual > 0 ? absError / actual : null,
    }
  })

  const mae = rows.reduce((acc, r) => acc + r.absError, 0) / rows.length

  const mapeRows = rows.filter((r) => r.pctError !== null)
  const mape =
    mapeRows.length > 0
      ? mapeRows.reduce((acc, r) => acc + (r.pctError as number), 0) /
        mapeRows.length
      : null
  const excludedFromMape = rows
    .filter((r) => r.pctError === null)
    .map((r) => r.itemCode)

  return { rows, mae, mape, excludedFromMape }
}
