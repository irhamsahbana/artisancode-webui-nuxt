import type { CrmCategoryGroup } from './crm-category-groups'
import {
  getCrmCategoryEndpoint,
  getCrmCategoryLabelKey,
  getCrmCategorySupportsParent,
} from './crm-category-groups'

type Translate = (key: string) => string

export const createCategoryColumns = (categoryGroup: CrmCategoryGroup, t: Translate) => [
  { key: 'name', label: t('common.name') },
  ...(getCrmCategorySupportsParent(categoryGroup)
    ? [{
        key: 'parent',
        label: t('ui.parent'),
        format: (_value: unknown, row: Record<string, unknown>) => {
          const parentName = row.parent_name
          if (typeof parentName === 'string' && parentName.trim().length > 0) {
            return parentName.trim()
          }

          return '-'
        },
      }]
    : []),
  {
    key: 'status',
    label: t('ui.status'),
    format: (value: unknown) => {
      const status = String(value ?? '')
      if (status === 'active') {
        return t('ui.active')
      }
      if (status === 'inactive') {
        return t('ui.inactive')
      }
      return status || '-'
    },
  },
]

export const formatCategoryDeleteLabel = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

export const getCategoryDialogDescriptionKey = (categoryGroup: CrmCategoryGroup) => (
  getCrmCategorySupportsParent(categoryGroup)
    ? 'ui.manageCategoryNamesStatusAndParentWithACleanerFormLayout'
    : 'ui.manageCategoryNamesAndStatusWithACleanerFormLayout'
)

export const getCategoryListMeta = (categoryGroup: CrmCategoryGroup, t: Translate) => ({
  endpoint: getCrmCategoryEndpoint(categoryGroup),
  title: t(getCrmCategoryLabelKey(categoryGroup)),
})
