export interface TreeNode {
  id: string
  code: string
  name: string
  category: string
  children: TreeNode[]
}

export type OrgUnitFormState = {
  code: string
  name: string
  category: string
  parent_id: string
}

const categoryHierarchy: Record<string, string[]> = {
  company: ['branch'],
  branch: ['division'],
  division: ['department', 'division'],
  department: ['unit', 'department'],
  unit: ['unit'],
}

export const createEmptyOrgUnitForm = (): OrgUnitFormState => ({
  code: '',
  name: '',
  category: 'division',
  parent_id: '',
})

export const getAllowedOrgUnitCategories = (
  parentNode: TreeNode | null,
  editNode: TreeNode | null,
) => {
  if (parentNode) {
    return categoryHierarchy[parentNode.category] || ['unit']
  }

  if (editNode) {
    return categoryHierarchy[editNode.category] || ['unit']
  }

  return ['division']
}

export const createAllowedCategoryOptions = (categories: string[]) => (
  categories.map((category) => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
  }))
)

export const buildOrgUnitPayload = (form: OrgUnitFormState) => {
  const code = form.code.trim()
  const name = form.name.trim()

  if (!code || !name) {
    return null
  }

  const payload: Record<string, unknown> = {
    code,
    name,
    category: form.category,
  }

  if (form.parent_id) {
    payload.parent_id = form.parent_id
  }

  return payload
}
