import { useState } from 'react'
import './App.css'
import { AnomalyList } from './components/AnomalyList'
import { StockTable } from './components/StockTable'
import { StockTrendChart } from './components/StockTrendChart'
import { useDashboard } from './data/useDashboard'

const REF_DATE_MIN = '2026-06-01'
const REF_DATE_MAX = '2026-06-30'

function App() {
  const { model, loading, error } = useDashboard()
  const [selected, setSelected] = useState('WD-1001')
  const [refDate, setRefDate] = useState(REF_DATE_MAX)

  if (loading) return <main className="app"><p>데이터 로딩 중…</p></main>
  if (error || !model)
    return (
      <main className="app">
        <p className="row-warn">데이터 로드 오류: {error}</p>
      </main>
    )

  const selectedItem = model.stock.find((s) => s.itemCode === selected)

  return (
    <main className="app">
      <header>
        <h1>젠테라 자재 재고 대시보드</h1>
        <p className="muted header-meta">
          <span className="header-meta-item">
            기준일
            <input
              type="date"
              min={REF_DATE_MIN}
              max={REF_DATE_MAX}
              value={refDate}
              onChange={(e) => setRefDate(e.target.value)}
              className="ref-date-input"
            />
          </span>
          <span className="dot">·</span>
          <span>품목 {model.items.length}종</span>
          <span className="dot">·</span>
          <span>이상 데이터 {model.anomalies.length}건</span>
        </p>
      </header>

      <section>
        <h2>1. 품목별 현재고</h2>
        <p className="muted">행을 클릭하면 아래 그래프가 해당 품목으로 바뀝니다. 열 제목을 클릭하면 정렬됩니다.</p>
        <StockTable stock={model.stock} refDate={refDate} selected={selected} onSelect={setSelected} />
      </section>

      <section>
        <h2>2. 일별 재고 추이</h2>
        <StockTrendChart item={selectedItem} refDate={refDate} />
      </section>

      <section>
        <h2>3. 데이터 이상 목록</h2>
        <AnomalyList anomalies={model.anomalies} />
      </section>
    </main>
  )
}

export default App
