import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ItemStock } from '../core/computeStock'

interface Props {
  item: ItemStock | undefined
}

export function StockTrendChart({ item }: Props) {
  if (!item) return <p>품목을 선택하세요.</p>

  // X축은 날짜의 일(day)만 표시해 간결하게
  const data = item.daily.map((p) => ({
    day: p.date.slice(5),
    stock: p.stock,
  }))

  return (
    <div>
      <h3>
        {item.itemName} ({item.itemCode}) — 6월 일별 재고
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="stock"
            name="재고"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
