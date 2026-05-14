import { flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useCompanyManagePage } from './use-company-manage-page'
import type { TreeNode } from './company-org-unit'

const { apiFetch, show, push, confirmSpy } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
  push: vi.fn(),
  confirmSpy: vi.fn(),
}))

const route = reactive<{ params: Record<string, unknown> }>({
  params: {
    id: 'company-1',
  },
})

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({ show }),
}))

vi.mock('#app', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

describe('useCompanyManagePage', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    push.mockReset()
    confirmSpy.mockReset()
    route.params = { id: 'company-1' }

    stubTestLocale({
      format: (key: string) => key,
    })
    vi.stubGlobal('confirm', confirmSpy)

    apiFetch.mockImplementation(async (path: string, options?: { method?: string, body?: Record<string, unknown> }) => {
      if (path === '/companies/company-1' && !options) {
        return {
          success: true,
          data: {
            code: 'CMP-01',
            name: 'Artisan',
          },
        }
      }

      if (path === '/org-units/tree/company-1') {
        return {
          success: true,
          data: [
            {
              id: 'branch-1',
              code: 'BR-01',
              name: 'Branch 1',
              category: 'branch',
              children: [],
            },
          ],
        }
      }

      if (path === '/companies/company-1' && options?.method === 'PUT') {
        return { success: true }
      }

      if (path === '/org-units' && options?.method === 'POST') {
        return { success: true }
      }

      if (path === '/org-units/edit-1' && options?.method === 'PUT') {
        return { success: true }
      }

      if (path === '/org-units/branch-1' && options?.method === 'DELETE') {
        return { success: true }
      }

      throw new Error(`Unhandled request: ${path}`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads company data on mount and resets loading when fetch throws', async () => {
    apiFetch.mockRejectedValueOnce(new Error('load failed'))

    const page = mountComposable(() => useCompanyManagePage())
    await flushPromises()

    expect(page.pageLoading.value).toBe(false)
    expect(page.editForm.code).toBe('')
    expect(page.editForm.name).toBe('')
  })

  it('opens create mode for child nodes with allowed category defaults', async () => {
    const page = mountComposable(() => useCompanyManagePage())
    await flushPromises()

    const node: TreeNode = {
      id: 'branch-1',
      code: 'BR-01',
      name: 'Branch 1',
      category: 'branch',
      children: [],
    }

    page.handleAddChild(node)

    expect(page.orgUnitDialogOpen.value).toBe(true)
    expect(page.orgUnitDialogMode.value).toBe('create')
    expect(page.orgUnitForm.parent_id).toBe('branch-1')
    expect(page.orgUnitForm.category).toBe('division')
    expect(page.allowedCategoryOptions.value).toEqual([
      { value: 'division', label: 'Division' },
    ])
  })

  it('submits edit mode payloads and closes the dialog after refresh', async () => {
    const page = mountComposable(() => useCompanyManagePage())
    await flushPromises()

    page.handleEditNode({
      id: 'edit-1',
      code: 'DEP-1',
      name: 'Department',
      category: 'department',
      children: [],
    })
    page.orgUnitForm.code = '  DEP-2 '
    page.orgUnitForm.name = '  Operations '

    await page.submitOrgUnit()

    expect(apiFetch).toHaveBeenCalledWith('/org-units/edit-1', {
      method: 'PUT',
      body: {
        code: 'DEP-2',
        name: 'Operations',
        category: 'department',
      },
    })
    expect(show).toHaveBeenCalledWith('company.orgUnitUpdated', 'success')
    expect(page.orgUnitDialogOpen.value).toBe(false)
    expect(page.orgTree.value).toEqual([
      {
        id: 'branch-1',
        code: 'BR-01',
        name: 'Branch 1',
        category: 'branch',
        children: [],
      },
    ])
    expect(page.orgUnitDialogLoading.value).toBe(false)
  })

  it('validates company name and resets edit loading when update throws', async () => {
    const page = mountComposable(() => useCompanyManagePage())
    await flushPromises()

    page.editForm.name = '   '
    await page.submitEdit()
    expect(show).toHaveBeenCalledWith('common.requiredField', 'error')

    apiFetch.mockRejectedValueOnce(new Error('save failed'))
    page.editForm.name = '  Artisan Corp '

    await expect(page.submitEdit()).rejects.toThrow('save failed')
    expect(page.editLoading.value).toBe(false)
  })

  it('confirms delete, refreshes the tree, and navigates back', async () => {
    confirmSpy.mockReturnValue(true)
    const page = mountComposable(() => useCompanyManagePage())
    await flushPromises()

    await page.handleDeleteNode({
      id: 'branch-1',
      code: 'BR-01',
      name: 'Branch 1',
      category: 'branch',
      children: [],
    })
    page.goBack()

    expect(apiFetch).toHaveBeenCalledWith('/org-units/branch-1', {
      method: 'DELETE',
    })
    expect(show).toHaveBeenCalledWith('company.orgUnitDeleted', 'success')
    expect(push).toHaveBeenCalledWith('/app/resources/companies')
  })
})
