import type { Anomaly } from '../core/types'
import { ANOMALY_TYPE_LABEL } from './labels'

interface Props {
  anomalies: Anomaly[]
}

export function AnomalyList({ anomalies }: Props) {
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
    </div>
  )
}
