import { useState } from 'react'
import type { Anomaly, AnomalyType } from '../core/types'
import { ANOMALY_TYPE_LABEL } from './labels'

interface Props {
  anomalies: Anomaly[]
}

type Filter = 'all' | 'corrected' | 'excluded'

const ANOMALY_TYPES = Object.keys(ANOMALY_TYPE_LABEL) as AnomalyType[]

const FILTER_LABEL: Record<Filter, string> = {
  all: '전체',
  corrected: '보정만',
  excluded: '제외만',
}

const EMPTY_MESSAGE: Record<Filter, string> = {
  all: '이상 데이터가 없습니다.',
  corrected: '보정 처리된 이상 데이터가 없습니다.',
  excluded: '제외 처리된 이상 데이터가 없습니다.',
}

export function AnomalyList({ anomalies }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const correctedCount = anomalies.filter((a) => a.action === 'corrected').length
  const excludedCount = anomalies.filter((a) => a.action === 'excluded').length

  const typeCounts = new Map<AnomalyType, number>()
  for (const a of anomalies) typeCounts.set(a.type, (typeCounts.get(a.type) ?? 0) + 1)

  const filtered = anomalies.filter((a) => filter === 'all' || a.action === filter)

  // 동일 (id, type) 조합은 한 행으로 접고 ×N 배지로 표시. 요약 바의 총 건수는 원본 그대로 유지.
  const groups: (Anomaly & { count: number })[] = []
  const groupIndex = new Map<string, number>()
  for (const a of filtered) {
    const key = `${a.id}|${a.type}`
    const idx = groupIndex.get(key)
    if (idx !== undefined) {
      groups[idx].count++
    } else {
      groupIndex.set(key, groups.length)
      groups.push({ ...a, count: 1 })
    }
  }

  return (
    <div>
      <div className="summary-bar">
        <span className="summary-total">
          총 {anomalies.length}건
          <span className="dot">·</span>
          <span className="text-corrected">보정 {correctedCount}</span>
          <span className="dot">/</span>
          <span className="text-excluded">제외 {excludedCount}</span>
        </span>
        <span className="summary-divider" />
        <span className="summary-label">유형별</span>
        <div className="summary-types">
          {ANOMALY_TYPES.filter((t) => typeCounts.has(t)).map((t) => (
            <span key={t} className="type-tag">
              {ANOMALY_TYPE_LABEL[t]} <b className="count-badge">{typeCounts.get(t)}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">필터</span>
        {(['all', 'corrected', 'excluded'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="table-card">
        <table className="anomaly-table">
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
            {groups.map((a) => (
              <tr key={`${a.id}-${a.type}`} className={a.action === 'excluded' ? 'anomaly-row-excluded' : ''}>
                <td>{a.source === 'receipt' ? '입고' : '출고'}</td>
                <td>
                  {a.id}
                  {a.count > 1 && <span className="dup-badge">×{a.count}</span>}
                </td>
                <td>{a.date}</td>
                <td>{a.itemCode}</td>
                <td>{ANOMALY_TYPE_LABEL[a.type]}</td>
                <td>
                  <span className={`action-badge ${a.action}`}>
                    {a.action === 'excluded' ? '제외' : '보정'}
                  </span>
                </td>
                <td>{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && <div className="empty-state">{EMPTY_MESSAGE[filter]}</div>}
      </div>
    </div>
  )
}
