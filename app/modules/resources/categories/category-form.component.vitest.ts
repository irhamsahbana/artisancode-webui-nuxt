import { describe, expect, it } from 'vitest'
import {
  categoryStatusOptionList,
  createCategoryPayload,
} from './category-form'

describe('category-form', () => {
  it('builds a trimmed payload and normalizes optional parent ids', () => {
    expect(createCategoryPayload({
      name: '  Uniform  ',
      group: '  apparel  ',
      parentId: '  cat-1  ',
      status: 'inactive',
    })).toEqual({
      name: 'Uniform',
      group: 'apparel',
      parent_id: 'cat-1',
      status: 'inactive',
    })

    expect(createCategoryPayload({
      name: 'Accessories',
      group: '   ',
      parentId: '   ',
      status: 'unknown',
    })).toEqual({
      name: 'Accessories',
      group: '',
      parent_id: null,
    })
  })

  it('rejects empty names and exposes stable status options', () => {
    expect(createCategoryPayload({
      name: '   ',
      group: 'ops',
      parentId: '',
      status: 'active',
    })).toBeNull()

    expect(categoryStatusOptionList).toEqual([
      { value: 'active', label: 'active' },
      { value: 'inactive', label: 'inactive' },
    ])
  })
})
