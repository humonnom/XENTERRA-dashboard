import type { MayReconRow } from '../core/computeStock'
import type { Anomaly } from '../core/types'
import { ANOMALY_TYPE_LABEL, fmtInt } from './labels'

interface Props {
  anomalies: Anomaly[] // §1-A 구조적 이상
  mayReconciliation: MayReconRow[] // §1-B 대조 불일치
}

/** 데이터 이상 목록: 구조적 이상(§1-A) + 대사 불일치(§1-B) */
export function AnomalyList({ anomalies, mayReconciliation }: Props) {
  const mismatches = mayReconciliation.filter((r) => !r.match)

  return (
    <div>
      <h3>구조적 이상 ({anomalies.length}건)</h3>
      <table>
        <thead>
          <tr>
            <th>구분</th>
            <th>ID</th>
            <th>일자</th>
            <th>품목</th>
            <th>유형</th>
            <th>처리</th>
            <th>사유</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.map((a, i) => (
            <tr key={`${a.id}-${i}`} className={a.action === 'excluded' ? 'row-warn' : ''}>
              <td>{a.source === 'receipt' ? '입고' : '출고'}</td>
              <td>{a.id}</td>
              <td>{a.date}</td>
              <td>{a.itemCode}</td>
              <td>{ANOMALY_TYPE_LABEL[a.type]}</td>
              <td>{a.action === 'excluded' ? '제외' : '보정'}</td>
              <td style={{ textAlign: 'left' }}>{a.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>대사 불일치 ({mismatches.length}건) — 5월 거래 누적 vs 5/31 실사</h3>
      <table>
        <thead>
          <tr>
            <th>품목</th>
            <th>이론치 (5/1=0 가정)</th>
            <th>5/31 실사</th>
            <th>차이</th>
          </tr>
        </thead>
        <tbody>
          {mismatches.map((r) => (
            <tr key={r.itemCode} className="row-warn">
              <td>{r.itemCode}</td>
              <td>{fmtInt(r.theoretical)}</td>
              <td>{fmtInt(r.counted)}</td>
              <td>
                {r.diff > 0 ? '+' : ''}
                {fmtInt(r.diff)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
