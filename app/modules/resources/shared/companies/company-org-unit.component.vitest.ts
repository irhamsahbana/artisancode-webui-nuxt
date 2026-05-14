import { describe, expect, it } from 'vitest'
import {
  buildOrgUnitPayload,
  createAllowedCategoryOptions,
  createEmptyOrgUnitForm,
  getAllowedOrgUnitCategories,
  type TreeNode,
} from './company-org-unit'

describe('company-org-unit', () => {
  const companyNode: TreeNode = {
    id: 'company-1',
    code: 'CMP',
    name: 'Company',
    category: 'company',
    children: [],
  }

  const departmentNode: TreeNode = {
    id: 'dept-1',
    code: 'DPT',
    name: 'Department',
    category: 'department',
    children: [],
  }

  it('creates an empty org unit form state', () => {
    expect(createEmptyOrgUnitForm()).toEqual({
      code: '',
      name: '',
      category: 'division',
      parent_id: '',
    })
  })

  it('resolves allowed categories from parent or edit node', () => {
    expect(getAllowedOrgUnitCategories(companyNode, null)).toEqual(['branch'])
    expect(getAllowedOrgUnitCategories(null, departmentNode)).toEqual(['unit', 'department'])
    expect(getAllowedOrgUnitCategories(null, null)).toEqual(['division'])
  })

  it('creates display options for allowed categories', () => {
    expect(createAllowedCategoryOptions(['branch', 'division'])).toEqual([
      { value: 'branch', label: 'Branch' },
      { value: 'division', label: 'Division' },
    ])
  })

  it('builds normalized payloads and rejects blank required fields', () => {
    const form = createEmptyOrgUnitForm()
    form.code = '  DIV-01  '
    form.name = '  Operations  '
    form.category = 'division'
    form.parent_id = 'parent-1'

    expect(buildOrgUnitPayload(form)).toEqual({
      code: 'DIV-01',
      name: 'Operations',
      category: 'division',
      parent_id: 'parent-1',
    })

    form.parent_id = ''
    expect(buildOrgUnitPayload(form)).toEqual({
      code: 'DIV-01',
      name: 'Operations',
      category: 'division',
    })

    form.code = '   '
    expect(buildOrgUnitPayload(form)).toBeNull()
  })
})
