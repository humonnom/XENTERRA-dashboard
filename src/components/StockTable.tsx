import { useState } from 'react'
import type { ItemStock } from '../core/computeStock'
import { fmtInt, refShort } from './labels'

interface Props {
  stock: ItemStock[]
  refDate: string
  selected: string
  onSelect: (itemCode: string) => void
}

type SortKey = 'itemCode' | 'itemName' | 'closingStock' | 'eaEquivalent' | null
type SortDir = 'asc' | 'desc'

interface Row {
  itemCode: string
  itemName: string
  unit: string
  closingStock: number
  eaEquivalent: number | null
}

function closingAt(item: ItemStock, refDate: string): number {
  return item.daily.find((p) => p.date === refDate)?.stock ?? item.closingStock
}

export function StockTable({ stock, refDate, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows: Row[] = stock.map((s) => {
    const closingStock = closingAt(s, refDate)
    return {
      itemCode: s.itemCode,
      itemName: s.itemName,
      unit: s.unit,
      closingStock,
      eaEquivalent: s.unit === 'BOX' ? closingStock * s.boxQty : null,
    }
  })

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'eaEquivalent') {
          if (a.eaEquivalent === null && b.eaEquivalent === null) return 0
          if (a.eaEquivalent === null) return 1
          if (b.eaEquivalent === null) return -1
          return (a.eaEquivalent - b.eaEquivalent) * dir
        }
        const av = a[sortKey]
        const bv = b[sortKey]
        if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir
        return ((av as number) - (bv as number)) * dir
      })
    : rows

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('itemCode')}>
              품목코드{arrow('itemCode')}
            </th>
            <th className="sortable" style={{ textAlign: 'left' }} onClick={() => toggleSort('itemName')}>
              품명{arrow('itemName')}
            </th>
            <th style={{ textAlign: 'left' }}>단위</th>
            <th className="sortable" onClick={() => toggleSort('closingStock')}>
              현재고 ({refShort(refDate)}){arrow('closingStock')}
            </th>
            <th className="sortable" onClick={() => toggleSort('eaEquivalent')}>
              EA 환산{arrow('eaEquivalent')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr
              key={s.itemCode}
              onClick={() => onSelect(s.itemCode)}
              className={s.itemCode === selected ? 'row-selected' : 'row-clickable'}
            >
              <td>{s.itemCode}</td>
              <td style={{ textAlign: 'left' }}>{s.itemName}</td>
              <td style={{ textAlign: 'left' }}>{s.unit}</td>
              <td>
                {fmtInt(s.closingStock)} {s.unit}
              </td>
              <td>{s.eaEquivalent === null ? '—' : `${fmtInt(s.eaEquivalent)} EA`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
