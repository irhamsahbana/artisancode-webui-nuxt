export type ExportColumn = {
  key: string
  label: string
}

export type ExportHistoryItem = {
  id: string
  filename: string
  createdAt: string
  rowCount: number
}

export const buildExportFilename = (filenamePrefix: string, now = new Date()) => {
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${filenamePrefix}-${stamp}.csv`
}

export const getCellValue = (row: Record<string, unknown>, key: string) => {
  const value = row[key]

  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

export const escapeCsvValue = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}

export const buildCsv = (columns: ExportColumn[], rows: Record<string, unknown>[]) => {
  const header = columns.map(column => escapeCsvValue(column.label)).join(',')
  const lines = rows.map(row => (
    columns
      .map(column => escapeCsvValue(getCellValue(row, column.key)))
      .join(',')
  ))

  return [header, ...lines].join('\n')
}

export const parseExportHistory = (raw: string | null) => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as ExportHistoryItem[] : []
  }
  catch {
    return []
  }
}

export const createExportHistoryEntry = (
  filename: string,
  rowCount: number,
  createdAt = new Date().toISOString(),
  id = crypto.randomUUID(),
): ExportHistoryItem => ({
  id,
  filename,
  createdAt,
  rowCount,
})

export const appendExportHistory = (
  history: ExportHistoryItem[],
  entry: ExportHistoryItem,
  maxItems = 8,
) => [entry, ...history].slice(0, maxItems)
