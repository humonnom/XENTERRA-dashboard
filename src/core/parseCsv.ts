import Papa from 'papaparse'
import type { Item, RawIssue, RawReceipt, Snapshot } from './types'

/** BOM 제거 후 헤더 기반 파싱 */
function parseRows(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '')
  const result = Papa.parse<Record<string, string>>(clean, {
    header: true,
    skipEmptyLines: true,
  })
  return result.data
}

export function parseItems(text: string): Item[] {
  return parseRows(text).map((r) => ({
    itemCode: r.item_code,
    itemName: r.item_name,
    unit: r.unit,
    boxQty: Number(r.box_qty),
    unitPrice: Number(r.unit_price_krw),
  }))
}

export function parseReceipts(text: string): RawReceipt[] {
  return parseRows(text).map((r) => ({
    receiptId: r.receipt_id,
    date: r.date,
    itemCode: r.item_code,
    qty: Number(r.qty),
    unitPrice: Number(r.unit_price_krw),
  }))
}

export function parseIssues(text: string): RawIssue[] {
  return parseRows(text).map((r) => ({
    issueId: r.issue_id,
    date: r.date,
    itemCode: r.item_code,
    qty: Number(r.qty),
  }))
}

export function parseSnapshot(text: string): Snapshot[] {
  return parseRows(text).map((r) => ({
    date: r.snapshot_date,
    itemCode: r.item_code,
    countedQty: Number(r.counted_qty),
  }))
}
