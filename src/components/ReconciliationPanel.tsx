import type { ReconciliationReport } from '../core/reconciliation'
import { ANOMALY_TYPE_LABEL, fmtInt } from './labels'

interface Props {
  report: ReconciliationReport
}

/** 합계 대사표 패널 (계획 §3) */
export function ReconciliationPanel({ report }: Props) {
  const { totals, anomalies, amount } = report

  return (
    <div>
      <h3>합계 대사표</h3>
      <table>
        <thead>
          <tr>
            <th>항목</th>
            <th>정제 전</th>
            <th>정제 후</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>입고 건수</td>
            <td>{fmtInt(totals.receiptCountRaw)}</td>
            <td>{fmtInt(totals.receiptCountClean)}</td>
          </tr>
          <tr>
            <td>입고 수량</td>
            <td>{fmtInt(totals.receiptQtyRaw)}</td>
            <td>{fmtInt(totals.receiptQtyClean)}</td>
          </tr>
          <tr>
            <td>출고 건수</td>
            <td>{fmtInt(totals.issueCountRaw)}</td>
            <td>{fmtInt(totals.issueCountClean)}</td>
          </tr>
          <tr>
            <td>출고 수량</td>
            <td>{fmtInt(totals.issueQtyRaw)}</td>
            <td>{fmtInt(totals.issueQtyClean)}</td>
          </tr>
          <tr>
            <td>입고 금액 (원)</td>
            <td>{fmtInt(amount.receiptAmountRaw)}</td>
            <td>{fmtInt(amount.receiptAmountClean)}</td>
          </tr>
        </tbody>
      </table>

      <h3>
        이상 데이터 집계 (총 {anomalies.total}건 · 제외 {anomalies.excluded} / 보정{' '}
        {anomalies.corrected})
      </h3>
      <table>
        <thead>
          <tr>
            <th>유형</th>
            <th>건수</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.byType.map((b) => (
            <tr key={b.type}>
              <td>{ANOMALY_TYPE_LABEL[b.type]}</td>
              <td>{fmtInt(b.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
