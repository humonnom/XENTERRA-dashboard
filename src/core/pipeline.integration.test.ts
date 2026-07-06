import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseItems, parseIssues, parseReceipts, parseSnapshot } from './parseCsv'
import { cleanData } from './cleanData'
import { computeMayReconciliation } from './computeStock'

const read = (f: string) =>
  readFileSync(resolve(__dirname, '../../public/data', f), 'utf8')

describe('실제 데이터 통합 검증', () => {
  const items = parseItems(read('items.csv'))
  const rawReceipts = parseReceipts(read('receipts.csv'))
  const rawIssues = parseIssues(read('issues.csv'))
  const snapshot = parseSnapshot(read('stock_snapshot_0531.csv'))
  const clean = cleanData(rawReceipts, rawIssues, items)
  const recon = computeMayReconciliation(items, snapshot, clean.receipts, clean.issues)

  it('5월 대조: 정합 5건 / 불일치 3건', () => {
    expect(recon.filter((r) => r.match)).toHaveLength(5)
    expect(recon.filter((r) => !r.match)).toHaveLength(3)
  })

  it('불일치 3건이 awk 분석과 일치 (CN-2002 +4, TM-3001 −2, WD-1001 −7)', () => {
    const byCode = Object.fromEntries(recon.map((r) => [r.itemCode, r.diff]))
    expect(byCode['CN-2002']).toBe(4)
    expect(byCode['TM-3001']).toBe(-2)
    expect(byCode['WD-1001']).toBe(-7)
  })
})
