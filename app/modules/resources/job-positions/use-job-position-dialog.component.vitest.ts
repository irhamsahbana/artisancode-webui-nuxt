import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useJobPositionDialog } from './use-job-position-dialog'

const { apiFetch, show } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({ show }),
}))

describe('useJobPositionDialog', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    stubTestLocale()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates trimmed name before submit', async () => {
    const dialog = mountComposable(() => useJobPositionDialog())

    dialog.openCreateModal()
    dialog.form.value.name = '   '

    await dialog.handleSubmit()

    expect(show).toHaveBeenCalledWith('ui.nameIsRequired', 'error')
    expect(apiFetch).not.toHaveBeenCalled()
    expect(dialog.submitLoading.value).toBe(false)
  })

  it('resets modal loading when detail fetch fails', async () => {
    apiFetch.mockRejectedValue(new Error('detail failed'))

    const dialog = mountComposable(() => useJobPositionDialog())

    await expect(dialog.openEditModal({ id: 'jp-1' })).rejects.toThrow('detail failed')

    expect(dialog.modalOpen.value).toBe(true)
    expect(dialog.modalLoading.value).toBe(false)
  })

  it('resets submit loading when save fails after payload normalization', async () => {
    apiFetch.mockRejectedValue(new Error('save failed'))

    const dialog = mountComposable(() => useJobPositionDialog())

    dialog.openCreateModal()
    dialog.form.value.name = '  Software Engineer  '
    dialog.form.value.grade = '  A1  '

    await expect(dialog.handleSubmit()).rejects.toThrow('save failed')

    expect(apiFetch).toHaveBeenCalledWith('/job-positions', {
      method: 'POST',
      body: {
        name: 'Software Engineer',
        grade: 'A1',
      },
    })
    expect(dialog.submitLoading.value).toBe(false)
    expect(dialog.modalOpen.value).toBe(true)
  })
})
