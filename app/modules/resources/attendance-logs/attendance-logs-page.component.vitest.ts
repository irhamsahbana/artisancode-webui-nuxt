import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import AttendanceLogsPage from './attendance-logs-page.vue'

const managerMocks = vi.hoisted(() => ({
  applyDatePreset: vi.fn(),
  clearFilters: vi.fn(),
  closeExportMenu: vi.fn(),
  closeFilterPanel: vi.fn(),
  downloadExport: vi.fn(),
  handleExportMenuSelect: vi.fn(),
  loadExports: vi.fn(),
  openSelfie: vi.fn(),
  toggleExportMenu: vi.fn(),
  toggleFilterPanel: vi.fn(),
  updateFilter: vi.fn(),
}))

vi.mock('./use-attendance-logs-manager', () => ({
  useAttendanceLogsManager: () => ({
    columns: computed(() => [{ key: 'employee_name', label: 'ui.employeeName' }]),
    filterPanelOptions: computed(() => ({
      employeeOptions: [{ value: '', label: 'ui.allEmployees' }],
      statusOptions: [{ value: '', label: 'ui.allStatuses' }],
      typeOptions: [{ value: '', label: 'ui.allTypes' }],
      sourceOptions: [{ value: '', label: 'ui.allSources' }],
      selfieOptions: [{ value: '', label: 'ui.allPhotoStates' }],
      orgUnitOptions: [{ value: '', label: 'ui.allOrgUnits' }],
      branchOptions: [{ value: '', label: 'ui.allBranches' }],
      workLocationOptions: [{ value: '', label: 'ui.allWorkLocations' }],
      exceptionOptions: [{ value: '', label: 'ui.allExceptions' }],
    })),
    filters: {
      date_from: '',
      date_to: '',
      type: '',
      source: '',
      employee_id: '',
      status: '',
      selfie_status: '',
      org_unit_id: '',
      branch_id: '',
      work_location_id: '',
      exception_type: '',
    },
    listQuery: computed(() => ({ status: 'recorded' })),
    filterPanelOpen: ref(true),
    exportListLoading: ref(false),
    exportItems: ref([
      {
        id: 'export-1',
        resource_type: 'attendance_logs',
        resource_label: 'Attendance Logs',
        format: 'xlsx',
        status: 'completed',
        requested_by_name: 'Ayu',
        error_message: null,
        started_at: null,
        completed_at: null,
        expires_at: null,
        created_at: '2026-05-01T08:00:00Z',
        download_url: 'https://example.test/export.xlsx',
      },
    ]),
    exportMenuOpen: ref(true),
    completedExportCount: computed(() => 1),
    pendingExportCount: computed(() => 0),
    exportMenuItems: computed(() => [{ key: 'export', label: 'ui.export', disabled: false }]),
    toggleFilterPanel: managerMocks.toggleFilterPanel,
    closeFilterPanel: managerMocks.closeFilterPanel,
    toggleExportMenu: managerMocks.toggleExportMenu,
    closeExportMenu: managerMocks.closeExportMenu,
    isDatePresetActive: (preset: string) => preset === 'today',
    clearFilters: managerMocks.clearFilters,
    applyDatePreset: managerMocks.applyDatePreset,
    updateFilter: managerMocks.updateFilter,
    openSelfie: managerMocks.openSelfie,
    formatTimestamp: (value: string | null | undefined) => value ?? '-',
    loadExports: managerMocks.loadExports,
    downloadExport: managerMocks.downloadExport,
    handleExportMenuSelect: managerMocks.handleExportMenuSelect,
  }),
}))

const ResourceListStub = defineComponent({
  name: 'ResourceList',
  props: {
    title: { type: String, default: '' },
    endpoint: { type: String, default: '' },
    extraQuery: { type: Object, default: () => ({}) },
    columns: { type: Array, default: () => [] },
    showSearchFilterTrigger: { type: Boolean, default: false },
    searchFilterOpen: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: true },
  },
  emits: ['search-filter-trigger'],
  setup(props, { emit, slots }) {
    const row = {
      id: 'row-1',
      employee_name: 'Ayu',
      selfie_url: 'https://example.test/selfie.jpg',
    }
    const close = vi.fn()

    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      h('button', {
        'data-testid': 'resource-list-filter-trigger',
        onClick: () => emit('search-filter-trigger'),
      }),
      slots['header-actions']?.(),
      slots.filters?.(),
      slots['row-actions']?.({ row, close }),
      slots.detail?.({ row, loading: false, close, refresh: vi.fn() }),
    ])
  },
})

const ActionMenuStub = defineComponent({
  name: 'ActionMenu',
  props: {
    open: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
    label: { type: String, default: '' },
  },
  emits: ['toggle', 'close', 'select'],
  setup(props, { emit }) {
    return () => h('div', { 'data-testid': 'action-menu', 'data-open': String(props.open) }, [
      h('button', {
        'data-testid': 'action-menu-toggle',
        onClick: () => emit('toggle'),
      }, props.label),
      h('button', {
        'data-testid': 'action-menu-close',
        onClick: () => emit('close'),
      }),
      h('button', {
        'data-testid': 'action-menu-select',
        onClick: () => emit('select', 'export'),
      }),
    ])
  },
})

const AttendanceLogFilterPanelStub = defineComponent({
  name: 'AttendanceLogFilterPanel',
  props: {
    filters: { type: Object, required: true },
    open: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) },
  },
  emits: ['close', 'clear', 'apply-date-preset', 'update-filter'],
  setup(props, { emit }) {
    return () => h('div', {
      'data-testid': 'attendance-log-filter-panel',
      'data-open': String(props.open),
      'data-employee-options': String((props.options as { employeeOptions?: unknown[] }).employeeOptions?.length ?? 0),
    }, [
      h('button', {
        'data-testid': 'attendance-log-filter-close',
        onClick: () => emit('close'),
      }),
      h('button', {
        'data-testid': 'attendance-log-filter-clear',
        onClick: () => emit('clear'),
      }),
      h('button', {
        'data-testid': 'attendance-log-filter-preset',
        onClick: () => emit('apply-date-preset', 'today'),
      }),
      h('button', {
        'data-testid': 'attendance-log-filter-update',
        onClick: () => emit('update-filter', 'status', 'recorded'),
      }),
    ])
  },
})

const AttendanceLogDetailDialogStub = defineComponent({
  name: 'AttendanceLogDetailDialog',
  props: {
    row: { type: Object, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['close', 'open-selfie'],
  setup(_, { emit }) {
    return () => h('div', { 'data-testid': 'attendance-log-detail-dialog' }, [
      h('button', {
        'data-testid': 'attendance-log-detail-close',
        onClick: () => emit('close'),
      }),
      h('button', {
        'data-testid': 'attendance-log-detail-open-selfie',
        onClick: () => emit('open-selfie', { id: 'detail-row' }),
      }),
    ])
  },
})

const AttendanceLogExportsCardStub = defineComponent({
  name: 'AttendanceLogExportsCard',
  props: {
    loading: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
    completedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    formatTimestamp: { type: Function, required: true },
  },
  emits: ['refresh', 'download'],
  setup(props, { emit }) {
    return () => h('div', {
      'data-testid': 'attendance-log-exports-card',
      'data-items': String(props.items.length),
      'data-completed-count': String(props.completedCount),
      'data-pending-count': String(props.pendingCount),
    }, [
      h('button', {
        'data-testid': 'attendance-log-exports-refresh',
        onClick: () => emit('refresh'),
      }),
      h('button', {
        'data-testid': 'attendance-log-exports-download',
        onClick: () => emit('download', props.items[0]),
      }),
    ])
  },
})

describe('AttendanceLogsPage', () => {
  it('wires manager state into the page composition surface and forwards child events', async () => {
    const wrapper = mount(AttendanceLogsPage, {
      global: {
        stubs: {
          ActionMenu: ActionMenuStub,
          AttendanceLogDetailDialog: AttendanceLogDetailDialogStub,
          AttendanceLogExportsCard: AttendanceLogExportsCardStub,
          AttendanceLogFilterPanel: AttendanceLogFilterPanelStub,
          ResourceList: ResourceListStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.attendanceLogs')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/attendance-logs')
    expect(wrapper.get('[data-testid="action-menu"]').attributes('data-open')).toBe('true')
    expect(wrapper.get('[data-testid="attendance-log-filter-panel"]').attributes('data-employee-options')).toBe('1')
    expect(wrapper.get('[data-testid="attendance-log-exports-card"]').attributes('data-items')).toBe('1')

    await wrapper.get('[data-testid="resource-list-filter-trigger"]').trigger('click')
    await wrapper.get('[data-testid="action-menu-toggle"]').trigger('click')
    await wrapper.get('[data-testid="action-menu-close"]').trigger('click')
    await wrapper.get('[data-testid="action-menu-select"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-filter-close"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-filter-clear"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-filter-preset"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-filter-update"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-detail-open-selfie"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-exports-refresh"]').trigger('click')
    await wrapper.get('[data-testid="attendance-log-exports-download"]').trigger('click')

    expect(managerMocks.toggleFilterPanel).toHaveBeenCalledTimes(1)
    expect(managerMocks.toggleExportMenu).toHaveBeenCalledTimes(1)
    expect(managerMocks.closeExportMenu).toHaveBeenCalledTimes(1)
    expect(managerMocks.handleExportMenuSelect).toHaveBeenCalledWith('export')
    expect(managerMocks.closeFilterPanel).toHaveBeenCalledTimes(1)
    expect(managerMocks.clearFilters).toHaveBeenCalledTimes(1)
    expect(managerMocks.applyDatePreset).toHaveBeenCalledWith('today')
    expect(managerMocks.updateFilter).toHaveBeenCalledWith('status', 'recorded')
    expect(managerMocks.openSelfie).toHaveBeenCalled()
    expect(managerMocks.loadExports).toHaveBeenCalledTimes(1)
    expect(managerMocks.downloadExport).toHaveBeenCalledTimes(1)
  })
})
