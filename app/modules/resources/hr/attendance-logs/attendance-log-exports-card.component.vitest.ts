import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import AttendanceLogExportsCard from './attendance-log-exports-card.vue'
import type { ExportJob } from './types'

const exportItems: ExportJob[] = [
  {
    id: 'export-1',
    resource_type: 'attendance_logs',
    resource_label: 'Attendance Logs',
    format: 'xlsx',
    status: 'completed',
    requested_by_name: 'Ayu Lestari',
    error_message: null,
    started_at: '2026-05-01T08:01:00Z',
    completed_at: '2026-05-01T08:02:00Z',
    expires_at: '2026-05-08T08:02:00Z',
    created_at: '2026-05-01T08:00:00Z',
    download_url: 'https://example.test/export-1.xlsx',
  },
  {
    id: 'export-2',
    resource_type: 'attendance_logs',
    resource_label: 'Attendance Logs',
    format: 'xlsx',
    status: 'failed',
    requested_by_name: 'Budi',
    error_message: 'Generation failed',
    started_at: null,
    completed_at: null,
    expires_at: null,
    created_at: '2026-05-01T09:00:00Z',
    download_url: null,
  },
]

const mountCard = (overrides = {}) => mountWithRoleStubs(AttendanceLogExportsCard, {
  props: {
    loading: false,
    items: exportItems,
    completedCount: 1,
    pendingCount: 0,
    formatTimestamp: (value: string | null | undefined) => value ?? '-',
    ...overrides,
  },
})

describe('AttendanceLogExportsCard', () => {
  it('renders loading and empty states', () => {
    const loadingWrapper = mountCard({ loading: true, items: [] })
    const emptyWrapper = mountCard({ items: [] })

    expect(loadingWrapper.find('[data-testid="attendance-exports-loading"]').exists()).toBe(true)
    expect(emptyWrapper.find('[data-testid="attendance-exports-empty"]').exists()).toBe(true)
  })

  it('renders export items and emits refresh/download actions', async () => {
    const wrapper = mountCard()

    expect(wrapper.find('[data-testid="attendance-export-item-export-1"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).toContain('Generation failed')

    await wrapper.get('[data-testid="attendance-exports-refresh"]').trigger('click')
    await wrapper.get('[data-testid="attendance-export-download-export-1"]').trigger('click')

    expect(wrapper.emitted('refresh')).toHaveLength(1)
    expect(wrapper.emitted('download')).toEqual([[exportItems[0]]])
  })

  it('renders waiting badge instead of download button when file is unavailable', () => {
    const wrapper = mountCard()

    expect(wrapper.find('[data-testid="attendance-export-waiting-export-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="attendance-export-download-export-2"]').exists()).toBe(false)
  })
})
