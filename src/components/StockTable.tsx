import type { ItemStock } from '../core/computeStock'
import { fmtInt } from './labels'

interface Props {
  stock: ItemStock[]
  selected: string
  onSelect: (itemCode: string) => void
}

/** 품목별 현재고 목록 (6/30 기준). BOX 품목은 EA 환산 병기. */
export function StockTable({ stock, selected, onSelect }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>품목코드</th>
          <th>품명</th>
          <th>단위</th>
          <th>현재고 (6/30)</th>
          <th>EA 환산</th>
        </tr>
      </thead>
      <tbody>
        {stock.map((s) => {
          const eaEquivalent = s.unit === 'BOX' ? s.closingStock * s.boxQty : null
          return (
            <tr
              key={s.itemCode}
              onClick={() => onSelect(s.itemCode)}
              className={s.itemCode === selected ? 'row-selected' : 'row-clickable'}
            >
              <td>{s.itemCode}</td>
              <td>{s.itemName}</td>
              <td>{s.unit}</td>
              <td>
                {fmtInt(s.closingStock)} {s.unit}
              </td>
              <td>{eaEquivalent === null ? '—' : `${fmtInt(eaEquivalent)} EA`}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
