import { flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useOrgUnitDetailPage } from './use-org-unit-detail-page'

const { apiFetch, show, push } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
  push: vi.fn(),
}))

const route = reactive<{ params: Record<string, unknown> }>({
  params: {
    id: 'ou-2',
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

describe('useOrgUnitDetailPage', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    push.mockReset()

    route.params = {
      id: 'ou-2',
    }

    stubTestLocale()

    apiFetch.mockImplementation(async (path: string, options?: { method?: string, body?: Record<string, unknown> }) => {
      if (path === '/org-units?limit=1000') {
        return {
          success: true,
          data: {
            items: [
              { id: 'ou-1', name: 'Head Office' },
              { id: 'ou-2', name: 'Current Unit' },
            ],
          },
        }
      }

      if (path === '/org-units/ou-2' && !options) {
        return {
          success: true,
          data: {
            name: 'People Ops',
            category: 'department',
            parent_id: 'ou-1',
          },
        }
      }

      if (path === '/org-units/ou-2' && options?.method === 'PUT') {
        return {
          success: true,
          data: options.body,
        }
      }

      throw new Error(`Unhandled request: ${path}`)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads detail and parent options on mount', async () => {
    const detailPage = mountComposable(() => useOrgUnitDetailPage())
    await flushPromises()

    expect(detailPage.editForm.name).toBe('People Ops')
    expect(detailPage.editForm.category).toBe('department')
    expect(detailPage.editForm.parent_id).toBe('ou-1')
    expect(detailPage.parentOptions.value).toEqual([
      { value: 'ou-1', label: 'Head Office' },
    ])
    expect(detailPage.categoryOptionList).toEqual([
      { value: 'company', label: 'Company' },
      { value: 'division', label: 'Division' },
      { value: 'department', label: 'Department' },
      { value: 'unit', label: 'Unit' },
    ])
  })

  it('blocks saving when the trimmed name is empty', async () => {
    const detailPage = mountComposable(() => useOrgUnitDetailPage())
    await flushPromises()

    detailPage.editForm.name = '   '
    await detailPage.saveChanges()

    expect(show).toHaveBeenCalledWith('ui.nameIsRequired', 'error')
    expect(apiFetch).not.toHaveBeenCalledWith('/org-units/ou-2', expect.objectContaining({ method: 'PUT' }))
  })

  it('submits the normalized payload and navigates back to the list', async () => {
    const detailPage = mountComposable(() => useOrgUnitDetailPage())
    await flushPromises()

    detailPage.editForm.name = '  People Operations  '
    detailPage.editForm.category = 'division'
    detailPage.editForm.parent_id = ''

    await detailPage.saveChanges()
    await detailPage.goBack()

    expect(apiFetch).toHaveBeenCalledWith('/org-units/ou-2', {
      method: 'PUT',
      body: {
        name: 'People Operations',
        category: 'division',
        parent_id: null,
      },
    })
    expect(show).toHaveBeenCalledWith('ui.orgUnitUpdated', 'success')
    expect(push).toHaveBeenCalledWith('/app/resources/org-units')
  })
})
