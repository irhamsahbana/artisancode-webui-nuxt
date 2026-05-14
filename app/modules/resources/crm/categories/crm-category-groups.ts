export const categoryGroupMetas = {
  customer_type: {
    labelKey: "ui.customerTypes",
    supportsParent: false,
  },
  segment: {
    labelKey: "ui.segments",
    supportsParent: false,
  },
  area: {
    labelKey: "ui.areas",
    supportsParent: true,
  },
  relationship_status: {
    labelKey: "ui.relationshipStatuses",
    supportsParent: false,
  },
  customer_company: {
    labelKey: "ui.customerCompanies",
    supportsParent: false,
  },
} as const

export type CrmCategoryGroup = keyof typeof categoryGroupMetas

export const crmCategoryGroups = Object.keys(categoryGroupMetas) as CrmCategoryGroup[]

export const getCrmCategoryLabelKey = (group: CrmCategoryGroup) =>
  categoryGroupMetas[group].labelKey

export const getCrmCategoryEndpoint = (group: CrmCategoryGroup) =>
  `/categories?group=${group}`

export const getCrmCategorySupportsParent = (group: CrmCategoryGroup) =>
  categoryGroupMetas[group].supportsParent
