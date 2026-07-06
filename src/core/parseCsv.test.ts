import { describe, expect, it } from 'vitest'
import { parseItems, parseIssues, parseReceipts, parseSnapshot } from './parseCsv'

describe('parseCsv - BOM 및 타입 변환', () => {
  it('BOM이 붙은 헤더도 정상 파싱', () => {
    const text = '﻿item_code,item_name,unit,box_qty,unit_price_krw\nWD-1001,와이어 하네스 A,EA,1,8500'
    const items = parseItems(text)
    expect(items).toHaveLength(1)
    expect(items[0].itemCode).toBe('WD-1001')
    expect(items[0].boxQty).toBe(1)
    expect(items[0].unitPrice).toBe(8500)
  })

  it('입고 수량/단가를 숫자로 변환', () => {
    const text = 'receipt_id,date,item_code,qty,unit_price_krw\nR1,2026-06-01,WD-1001,30,8500'
    const [r] = parseReceipts(text)
    expect(r.qty).toBe(30)
    expect(r.unitPrice).toBe(8500)
    expect(typeof r.qty).toBe('number')
  })

  it('출고 음수 수량 파싱', () => {
    const text = 'issue_id,date,item_code,qty\nI9101,2026-06-25,WD-1001,-12'
    const [s] = parseIssues(text)
    expect(s.qty).toBe(-12)
  })

  it('실사 스냅샷 파싱', () => {
    const text = 'snapshot_date,item_code,counted_qty\n2026-05-31,CL-6001,99'
    const [snap] = parseSnapshot(text)
    expect(snap.itemCode).toBe('CL-6001')
    expect(snap.countedQty).toBe(99)
  })
})
