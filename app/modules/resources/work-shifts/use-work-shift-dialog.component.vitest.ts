import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable } from '~/testing/component-test-utils'
import { useWorkShiftDialog } from './use-work-shift-dialog'

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

describe('useWorkShiftDialog', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates required fields before submit', async () => {
    const dialog = mountComposable(() => useWorkShiftDialog())

    dialog.openCreateModal()
    await dialog.handleSubmit()

    expect(show).toHaveBeenCalledWith('ui.nameIsRequired', 'error')
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('resets modal loading when edit detail fetch throws', async () => {
    apiFetch.mockRejectedValueOnce(new Error('load failed'))
    const dialog = mountComposable(() => useWorkShiftDialog())

    await expect(dialog.openEditModal({ id: 'shift-1' })).rejects.toThrow('load failed')
    expect(dialog.modalLoading.value).toBe(false)
    expect(dialog.modalOpen.value).toBe(true)
  })

  it('normalizes payload and resets submit loading when create fails', async () => {
    apiFetch.mockRejectedValueOnce(new Error('save failed'))
    const dialog = mountComposable(() => useWorkShiftDialog())

    dialog.openCreateModal()
    dialog.form.value.name = '  Morning Shift  '
    dialog.form.value.timezone = '  Asia/Makassar  '
    dialog.form.value.start_time = '08:00'
    dialog.form.value.end_time = '17:00'
    dialog.form.value.grace_period_minutes = '15'

    await expect(dialog.handleSubmit()).rejects.toThrow('save failed')

    expect(apiFetch).toHaveBeenCalledWith('/work-shifts', {
      method: 'POST',
      body: {
        name: 'Morning Shift',
        timezone: 'Asia/Makassar',
        start_time: '08:00',
        end_time: '17:00',
        grace_period_minutes: 15,
      },
    })
    expect(dialog.submitLoading.value).toBe(false)
  })

  it('refreshes and closes after successful update', async () => {
    apiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'shift-1',
          name: 'Morning',
          timezone: 'Asia/Jakarta',
          start_time: '08:00',
          end_time: '17:00',
          grace_period_minutes: 10,
        },
      })
      .mockResolvedValueOnce({ success: true })

    const dialog = mountComposable(() => useWorkShiftDialog())
    const refreshBefore = dialog.refreshKey.value

    await dialog.openEditModal({ id: 'shift-1' })
    await dialog.handleSubmit()

    expect(show).toHaveBeenCalledWith('ui.workShiftUpdatedSuccessfully', 'success')
    expect(dialog.modalOpen.value).toBe(false)
    expect(dialog.refreshKey.value).toBe(refreshBefore + 1)
    expect(dialog.submitLoading.value).toBe(false)
  })
})
