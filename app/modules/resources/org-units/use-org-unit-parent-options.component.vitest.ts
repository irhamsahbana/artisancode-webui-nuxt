import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable } from '~/testing/component-test-utils'
import { useOrgUnitParentOptions } from './use-org-unit-parent-options'

const { apiFetch } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

describe('useOrgUnitParentOptions', () => {
  beforeEach(() => {
    apiFetch.mockReset()
  })

  it('maps available org units into parent options and filters invalid items', async () => {
    apiFetch.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: 'ou-1', name: 'Head Office' },
          { id: 'ou-2', name: 'People Ops' },
          { id: '', name: 'Broken' },
          { id: 'ou-3', name: '' },
        ],
      },
    })

    const parentOptionsManager = mountComposable(() => useOrgUnitParentOptions())
    await parentOptionsManager.fetchParentOptions()
    await flushPromises()

    expect(parentOptionsManager.parentOptions.value).toEqual([
      { value: 'ou-1', label: 'Head Office' },
      { value: 'ou-2', label: 'People Ops' },
    ])
  })

  it('can exclude the current org unit from parent options', async () => {
    apiFetch.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: 'ou-1', name: 'Head Office' },
          { id: 'ou-2', name: 'Current Unit' },
        ],
      },
    })

    const parentOptionsManager = mountComposable(() => useOrgUnitParentOptions())
    await parentOptionsManager.fetchParentOptions({ excludeId: 'ou-2' })

    expect(parentOptionsManager.parentOptions.value).toEqual([
      { value: 'ou-1', label: 'Head Office' },
    ])
  })

  it('clears stale options when refreshing parent options fails', async () => {
    apiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { id: 'ou-1', name: 'Head Office' },
          ],
        },
      })
      .mockRejectedValueOnce(new Error('network failed'))

    const parentOptionsManager = mountComposable(() => useOrgUnitParentOptions())

    await parentOptionsManager.fetchParentOptions()
    expect(parentOptionsManager.parentOptions.value).toEqual([
      { value: 'ou-1', label: 'Head Office' },
    ])

    await expect(parentOptionsManager.fetchParentOptions()).rejects.toThrow('network failed')
    expect(parentOptionsManager.parentOptions.value).toEqual([])
  })
})
