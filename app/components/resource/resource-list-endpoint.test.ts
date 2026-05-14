import assert from 'node:assert/strict'
import test from 'node:test'

const { appendResourceIdToEndpoint } = await import(
  new URL('./resource-list-endpoint.ts', import.meta.url).href
)

test('appendResourceIdToEndpoint appends ids to plain collection endpoints', () => {
  assert.equal(appendResourceIdToEndpoint('/categories', 'area-1'), '/categories/area-1')
  assert.equal(appendResourceIdToEndpoint('/categories/', 'area-1'), '/categories/area-1')
})

test('appendResourceIdToEndpoint keeps existing query params after the resource id', () => {
  assert.equal(
    appendResourceIdToEndpoint(
      '/categories?group=area',
      '019e230c-3abe-70e2-9194-798640191e8a',
    ),
    '/categories/019e230c-3abe-70e2-9194-798640191e8a?group=area',
  )
})

test('appendResourceIdToEndpoint encodes ids before appending them to the endpoint path', () => {
  assert.equal(
    appendResourceIdToEndpoint('/categories?group=area', 'area child'),
    '/categories/area%20child?group=area',
  )
})
