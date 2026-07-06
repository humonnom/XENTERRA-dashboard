import type { AccuracySummary, ForecastRow } from '../core/forecast'
import { fmt1, fmtInt, fmtPct } from './labels'

interface Props {
  forecast: ForecastRow[]
  backtest: AccuracySummary
}

/** 수요 예측 + 자체검증 패널 (계획 §4) */
export function ForecastPanel({ forecast, backtest }: Props) {
  return (
    <div>
      <h3>7월 1주(7/1~7/7) 품목별 예상 출고 — 6월 일평균 × 7</h3>
      <table>
        <thead>
          <tr>
            <th>품목</th>
            <th>6월 일평균</th>
            <th>예상 출고 (7일)</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((f) => (
            <tr key={f.itemCode}>
              <td>{f.itemCode}</td>
              <td>{fmt1(f.dailyAvg)}</td>
              <td>{fmtInt(f.forecastQty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>
        자체검증: 5월로 6월 1주 예측 — MAE {fmt1(backtest.mae)}, MAPE{' '}
        {fmtPct(backtest.mape)}
      </h3>
      <table>
        <thead>
          <tr>
            <th>품목</th>
            <th>예측</th>
            <th>실제</th>
            <th>절대오차</th>
            <th>백분율오차</th>
          </tr>
        </thead>
        <tbody>
          {backtest.rows.map((r) => (
            <tr key={r.itemCode}>
              <td>{r.itemCode}</td>
              <td>{fmtInt(r.predicted)}</td>
              <td>{fmtInt(r.actual)}</td>
              <td>{fmtInt(r.absError)}</td>
              <td>{fmtPct(r.pctError)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
