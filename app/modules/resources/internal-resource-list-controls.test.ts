import assert from 'node:assert/strict'
import test from 'node:test'

const {
  appendExportHistory,
  buildCsv,
  buildExportFilename,
  createExportHistoryEntry,
  escapeCsvValue,
  getCellValue,
  parseExportHistory,
} = await import(new URL('./internal-resource-list-controls.ts', import.meta.url).href)

test('builds deterministic export filenames', () => {
  assert.equal(
    buildExportFilename('internal-users', new Date('2026-05-01T08:09:10.321Z')),
    'internal-users-2026-05-01T08-09-10.csv',
  )
})

test('formats csv values and rows defensively', () => {
  assert.equal(getCellValue({ name: 'Ayu' }, 'name'), 'Ayu')
  assert.equal(getCellValue({ missing: null }, 'missing'), '')
  assert.equal(getCellValue({ meta: { active: true } }, 'meta'), '{"active":true}')
  assert.equal(escapeCsvValue('plain'), 'plain')
  assert.equal(escapeCsvValue('needs,quotes'), '"needs,quotes"')
  assert.equal(escapeCsvValue('say "hi"'), '"say ""hi"""')

  assert.equal(buildCsv([
    { key: 'name', label: 'Name' },
    { key: 'meta', label: 'Meta' },
  ], [
    { name: 'Ayu', meta: { active: true } },
  ]), 'Name,Meta\nAyu,"{""active"":true}"')
})

test('parses and appends export history safely', () => {
  assert.deepEqual(parseExportHistory(null), [])
  assert.deepEqual(parseExportHistory('invalid'), [])
  assert.deepEqual(parseExportHistory('{"bad":true}'), [])
  assert.deepEqual(parseExportHistory('[{"id":"1","filename":"a.csv","createdAt":"2026-05-01","rowCount":2}]'), [
    { id: '1', filename: 'a.csv', createdAt: '2026-05-01', rowCount: 2 },
  ])

  const entry = createExportHistoryEntry('users.csv', 10, '2026-05-01T08:00:00Z', 'entry-1')
  assert.deepEqual(entry, {
    id: 'entry-1',
    filename: 'users.csv',
    createdAt: '2026-05-01T08:00:00Z',
    rowCount: 10,
  })

  assert.deepEqual(appendExportHistory([
    { id: 'older', filename: 'older.csv', createdAt: '2026-05-01T07:00:00Z', rowCount: 5 },
  ], entry, 2), [
    entry,
    { id: 'older', filename: 'older.csv', createdAt: '2026-05-01T07:00:00Z', rowCount: 5 },
  ])
})
