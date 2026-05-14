import { describe, expect, it } from 'vitest'
import {
  categoryStatusOptionList,
  createCategoryPayload,
} from './category-form'

describe('category-form', () => {
  it('builds a trimmed payload and normalizes optional parent ids', () => {
    expect(createCategoryPayload({
      name: '  Uniform  ',
      parentId: '  cat-1  ',
      status: 'inactive',
    })).toEqual({
      name: 'Uniform',
      parent_id: 'cat-1',
      status: 'inactive',
    })

    expect(createCategoryPayload({
      name: 'Accessories',
      parentId: '   ',
      status: 'unknown',
    })).toEqual({
      name: 'Accessories',
      parent_id: null,
    })
  })

  it('rejects empty names and exposes stable status options', () => {
    expect(createCategoryPayload({
      name: '   ',
      parentId: '',
      status: 'active',
    })).toBeNull()

    expect(categoryStatusOptionList).toEqual([
      { value: 'active', label: 'active' },
      { value: 'inactive', label: 'inactive' },
    ])
  })
})
