import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import AttendanceLogDetailDialog from './attendance-log-detail-dialog.vue'

const row = {
  id: 'log-1',
  employee_name: 'Ayu Lestari',
  employee_no: 'EMP001',
  attendance_date: '2026-05-01',
  logged_at: '2026-05-01T08:00:00Z',
  type: 'check_in',
  source: 'mobile',
  status: 'recorded',
  address: 'Jl. Test',
  latitude: -8.409518,
  longitude: 115.188919,
  selfie_url: 'https://example.test/photo.jpg',
}

const mountDialog = (overrides = {}) => mountWithRoleStubs(AttendanceLogDetailDialog, {
  props: {
    row,
    loading: false,
    ...overrides,
  },
})

describe('AttendanceLogDetailDialog', () => {
  it('renders loading states independently from the page', () => {
    const wrapper = mountDialog({ loading: true })

    expect(wrapper.find('[data-testid="attendance-log-detail-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="attendance-log-photo-loading"]').exists()).toBe(true)
  })

  it('renders summary, section values, photo proof, and map link', () => {
    const wrapper = mountDialog()

    expect(wrapper.text()).toContain('Ayu Lestari')
    expect(wrapper.text()).toContain('EMP001')
    expect(wrapper.text()).toContain('Check In')
    expect(wrapper.find('[data-testid="attendance-log-photo-proof"]').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe(row.selfie_url)
    expect(wrapper.find('[data-testid="attendance-log-location-map"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="attendance-log-open-map"]').attributes('href')).toBe(
      'https://www.google.com/maps?q=-8.409518,115.188919',
    )
  })

  it('renders empty states when optional proof data is missing', () => {
    const wrapper = mountDialog({
      row: {
        employee_name: 'Ayu Lestari',
        employee_no: 'EMP001',
      },
    })

    expect(wrapper.find('[data-testid="attendance-log-photo-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="attendance-log-location-map"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="attendance-log-section-empty"]').length).toBeGreaterThan(0)
  })

  it('emits close and openSelfie actions', async () => {
    const wrapper = mountDialog()

    await wrapper.find('[data-testid="attendance-log-detail-close"]').trigger('click')
    await wrapper.find('[data-testid="attendance-log-open-selfie"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('openSelfie')).toEqual([[row]])
  })
})
