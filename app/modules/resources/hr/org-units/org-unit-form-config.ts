export const orgUnitCategories = [
  'company',
  'division',
  'department',
  'unit',
] as const

export type OrgUnitCategory = (typeof orgUnitCategories)[number]

export type OrgUnitOption = {
  value: string
  label: string
}

export type OrgUnitFormState = {
  name: string
  category: OrgUnitCategory
  parent_id: string
}

export type OrgUnitDetail = {
  name?: string
  category?: string
  parent_id?: string | null
}

export const orgUnitCategoryOptions: OrgUnitOption[] = orgUnitCategories.map(category => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}))

export const createOrgUnitFormState = (): OrgUnitFormState => ({
  name: '',
  category: 'company',
  parent_id: '',
})

export const isOrgUnitCategory = (value: string): value is OrgUnitCategory =>
  orgUnitCategories.includes(value as OrgUnitCategory)
