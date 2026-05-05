import { computed, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { ListResponse } from '~/types/api'
import type { ApiFetch } from '../roles/types'
import type { AttendanceLogFilters, ExportJob } from './types'
import {
  buildAttendanceExportPayload,
  buildExportMenuItems,
  countCompletedExports,
  countPendingExports,
  shouldPollExports,
} from './attendance-log-export'

type UseAttendanceLogExportsOptions = {
  apiFetch: ApiFetch
  filters: AttendanceLogFilters
  show: (message: string, variant: 'success' | 'error') => void
  t: (key: string) => string
}

export const useAttendanceLogExports = ({
  apiFetch,
  filters,
  show,
  t,
}: UseAttendanceLogExportsOptions) => {
  const loading = ref(false)
  const listLoading = ref(false)
  const items = ref<ExportJob[]>([])
  const menuOpen = ref(false)

  const completedCount = computed(() => countCompletedExports(items.value))
  const pendingCount = computed(() => countPendingExports(items.value))
  const menuItems = computed(() => buildExportMenuItems(loading.value, {
    queueing: t('ui.queueing'),
    export: t('ui.export'),
  }))

  const { pause: stopPolling, resume: startPolling, isActive: isPolling } = useIntervalFn(
    async () => {
      await load()
    },
    5000,
    { immediate: false },
  )

  const load = async () => {
    listLoading.value = true

    try {
      const response = await apiFetch<ListResponse<ExportJob>>('/export-jobs', {
        query: { page: 1, limit: 10 },
      })

      items.value = response.data?.items ?? []

      if (shouldPollExports(items.value)) {
        if (!isPolling.value) {
          startPolling()
        }
        return
      }

      stopPolling()
    }
    finally {
      listLoading.value = false
    }
  }

  const create = async () => {
    menuOpen.value = false
    loading.value = true

    try {
      const response = await apiFetch<{ id: string }>('/export-jobs', {
        method: 'POST',
        body: buildAttendanceExportPayload(filters),
      })

      if (!response.success) {
        return
      }

      show(t('ui.attendanceExportQueued'), 'success')
      await load()
    }
    finally {
      loading.value = false
    }
  }

  const selectMenuItem = async (key: string) => {
    if (key === 'export') {
      await create()
    }
  }

  const download = (item: ExportJob) => {
    if (!item.download_url || !import.meta.client) {
      return
    }

    window.open(item.download_url, '_blank', 'noopener,noreferrer')
  }

  return {
    loading,
    listLoading,
    items,
    menuOpen,
    completedCount,
    pendingCount,
    menuItems,
    load,
    startPolling,
    stopPolling,
    create,
    selectMenuItem,
    download,
  }
}
