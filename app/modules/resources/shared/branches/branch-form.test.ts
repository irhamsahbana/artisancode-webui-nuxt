import assert from 'node:assert/strict'
import test from 'node:test'

const {
  createBranchPayload,
  createEmptyBranchForm,
  formatBranchDeleteLabel,
  getBranchRowId,
  syncBranchForm,
} = await import(new URL('./branch-form.ts', import.meta.url).href)

test('formats delete labels with name and city when available', () => {
  assert.equal(formatBranchDeleteLabel({ name: 'Makassar', city: 'Gowa' }), 'Makassar - Gowa')
  assert.equal(formatBranchDeleteLabel({ name: 'Makassar' }), 'Makassar')
  assert.equal(formatBranchDeleteLabel({ id: 12 }), '12')
})

test('builds normalized branch payloads and omits invalid optional fields', () => {
  const form = createEmptyBranchForm()
  form.name = '  Branch A  '
  form.city = '  Makassar '
  form.capacity = '150'
  form.email = '  branch@example.com '
  form.description = '  Training center  '
  form.address = '  Jl. Sudirman  '
  form.phone = '  0812  '
  form.headCoach = '  Coach A  '
  form.status = 'planning'

  assert.deepEqual(createBranchPayload(form), {
    name: 'Branch A',
    city: 'Makassar',
    capacity: 150,
    description: 'Training center',
    address: 'Jl. Sudirman',
    phone: '0812',
    email: 'branch@example.com',
    head_coach: 'Coach A',
    status: 'planning',
  })

  form.capacity = 'unknown'
  form.email = '   '
  form.description = '   '
  form.address = '   '
  form.phone = '   '
  form.headCoach = '   '

  assert.deepEqual(createBranchPayload(form), {
    name: 'Branch A',
    city: 'Makassar',
    status: 'planning',
  })
})

test('returns null payload when required fields are blank', () => {
  const form = createEmptyBranchForm()
  form.name = ' '
  form.city = 'Makassar'

  assert.equal(createBranchPayload(form), null)
})

test('syncs form values from a resource row and falls back to active status', () => {
  const form = createEmptyBranchForm()

  syncBranchForm(form, {
    name: 'Branch B',
    city: 'Maros',
    capacity: 42,
    description: 'Main hall',
    address: 'Jl. Pettarani',
    phone: '0813',
    email: 'branch-b@example.com',
    head_coach: 'Coach B',
    status: 'unexpected',
  })

  assert.deepEqual(form, {
    name: 'Branch B',
    city: 'Maros',
    capacity: '42',
    description: 'Main hall',
    address: 'Jl. Pettarani',
    phone: '0813',
    email: 'branch-b@example.com',
    headCoach: 'Coach B',
    status: 'active',
  })
})

test('extracts branch ids from supported row keys', () => {
  assert.equal(getBranchRowId({ id: 7 }), '7')
  assert.equal(getBranchRowId({ uuid: 'branch-1' }), 'branch-1')
  assert.equal(getBranchRowId({ code: 'BR-2' }), 'BR-2')
  assert.equal(getBranchRowId({}), null)
})
