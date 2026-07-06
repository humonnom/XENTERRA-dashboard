import { useState } from 'react'
import './App.css'
import { AnomalyList } from './components/AnomalyList'
import { StockTable } from './components/StockTable'
import { StockTrendChart } from './components/StockTrendChart'
import { useDashboard } from './data/useDashboard'

function App() {
  const { model, loading, error } = useDashboard()
  const [selected, setSelected] = useState('WD-1001')

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
        <p className="muted">
          기준일 6/30 · 품목 {model.items.length}종 · 이상 데이터 {model.anomalies.length}건
        </p>
      </header>

      <section>
        <h2>1. 품목별 현재고</h2>
        <p className="muted">행을 클릭하면 아래 그래프가 해당 품목으로 바뀝니다.</p>
        <StockTable stock={model.stock} selected={selected} onSelect={setSelected} />
      </section>

      <section>
        <h2>2. 일별 재고 추이</h2>
        <StockTrendChart item={selectedItem} />
      </section>

      <section>
        <h2>3. 데이터 이상 목록</h2>
        <AnomalyList anomalies={model.anomalies} />
      </section>
    </main>
  )
}

export default App
