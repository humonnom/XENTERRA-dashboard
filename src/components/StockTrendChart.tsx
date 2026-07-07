import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ItemStock } from '../core/computeStock'
import { refShort } from './labels'

interface Props {
  item: ItemStock | undefined
  refDate: string
}

export function StockTrendChart({ item, refDate }: Props) {
  if (!item) return <p>품목을 선택하세요.</p>

  const data = item.daily.map((p) => ({
    day: p.date.slice(5),
    stock: p.stock,
  }))

  const refDay = refDate.slice(5)
  const refPoint = data.find((d) => d.day === refDay)

  const stocks = data.map((d) => d.stock)
  const dmin = Math.min(...stocks)
  const dmax = Math.max(...stocks)
  const pad = (dmax - dmin || 1) * 0.12
  const yDomain: [number, number] = [Math.floor(dmin - pad), Math.ceil(dmax + pad)]

  return (
    <div>
      <h3>
        {item.itemName} ({item.itemCode}) — 6월 일별 재고
      </h3>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch-line" /> 일별 재고
        </span>
        <span className="legend-item">
          <span className="legend-swatch-dot" /> 기준일 ({refShort(refDate)})
        </span>
      </div>
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(124,58,237,0.16)" />
                <stop offset="100%" stopColor="rgba(124,58,237,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={yDomain} tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="stock"
              stroke="none"
              fill="url(#stockGradient)"
              isAnimationActive={false}
              tooltipType="none"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="stock"
              name="재고"
              stroke="#7c3aed"
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
            {refPoint && (
              <>
                <ReferenceLine x={refDay} stroke="#7c3aed" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceDot x={refDay} y={refPoint.stock} r={5} fill="#7c3aed" stroke="#fff" strokeWidth={2} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
