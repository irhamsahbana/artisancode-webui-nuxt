<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ListResponse } from '~/types/api'

defineOptions({ name: 'InternalResourceListControls' })

type ExportColumn = {
  key: string
  label: string
}

type ExportHistoryItem = {
  id: string
  filename: string
  createdAt: string
  rowCount: number
}

type ResourceActionItem = {
  key: string
  label: string
  kind?: 'export' | 'export-history'
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    endpoint: string
    resourceKey: string
    filenamePrefix: string
    columns: ExportColumn[]
    actionItems: ResourceActionItem[]
    query?: Record<string, unknown>
    historyTitle?: string
    actionsOpen?: boolean
    authMode?: 'user' | 'internal'
  }>(),
  {
    query: undefined,
    historyTitle: 'ui.exportHistory',
    actionsOpen: undefined,
    authMode: 'internal',
  },
)

const emit = defineEmits<{
  actionSelect: [key: string]
  'update:actionsOpen': [value: boolean]
}>()

const { apiFetch } = useApi()
const { t } = useLocale()
const { formatDateTime } = useDateTime()
const { show } = useBanner()

const historyOpen = ref(false)
const localActionsOpen = ref(false)
const exporting = ref(false)
const historyItems = ref<ExportHistoryItem[]>([])

const storageKey = computed(() => `internal-resource-export-history:${props.resourceKey}`)
const hasActions = computed(() => props.actionItems.length > 0)
const actionMenuItems = computed(() => props.actionItems.map(item => ({
  key: item.key,
  label: item.kind === 'export' && exporting.value ? t('ui.exporting') : t(item.label),
  disabled: item.disabled || (item.kind === 'export' && exporting.value),
})))
const actionsOpen = computed({
  get: () => props.actionsOpen ?? localActionsOpen.value,
  set: (value: boolean) => {
    localActionsOpen.value = value
    emit('update:actionsOpen', value)
  },
})

const buildExportFilename = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${props.filenamePrefix}-${stamp}.csv`
}

const getQuery = () => ({
  ...(props.query ?? {}),
  page: 1,
  limit: 100000,
  paginate: 100000,
})

const getCellValue = (row: Record<string, unknown>, key: string) => {
  const value = row[key]
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const escapeCsvValue = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value
  }
  return `"${value.replace(/"/g, '""')}"`
}

const buildCsv = (rows: Record<string, unknown>[]) => {
  const header = props.columns.map(column => escapeCsvValue(column.label)).join(',')
  const lines = rows.map(row =>
    props.columns
      .map(column => escapeCsvValue(getCellValue(row, column.key)))
      .join(','),
  )

  return [header, ...lines].join('\n')
}

const downloadCsv = (filename: string, content: string) => {
  if (!import.meta.client) {
    return
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const persistHistory = () => {
  if (!import.meta.client) {
    return
  }
  localStorage.setItem(storageKey.value, JSON.stringify(historyItems.value.slice(0, 8)))
}

const loadHistory = () => {
  if (!import.meta.client) {
    return
  }
  const raw = localStorage.getItem(storageKey.value)
  if (!raw) {
    return
  }
  try {
    const parsed = JSON.parse(raw)
    historyItems.value = Array.isArray(parsed) ? parsed : []
  }
  catch {
    historyItems.value = []
  }
}

const addHistory = (filename: string, rowCount: number) => {
  historyItems.value = [
    {
      id: crypto.randomUUID(),
      filename,
      createdAt: new Date().toISOString(),
      rowCount,
    },
    ...historyItems.value,
  ].slice(0, 8)
  persistHistory()
}

const exportRows = async () => {
  actionsOpen.value = false
  exporting.value = true
  const response = await apiFetch<ListResponse<Record<string, unknown>>>(props.endpoint, {
    query: getQuery(),
    authMode: props.authMode,
  })
  exporting.value = false

  if (!response.success) {
    return
  }

  const rows = response.data?.items ?? []
  const filename = buildExportFilename()
  downloadCsv(filename, buildCsv(rows))
  addHistory(filename, rows.length)
  show(t('ui.exportCompleted'), 'success')
}

const openHistory = () => {
  actionsOpen.value = false
  historyOpen.value = true
}

const handleActionSelect = (key: string) => {
  const item = props.actionItems.find(action => action.key === key)
  emit('actionSelect', key)

  if (item?.kind === 'export') {
    exportRows()
    return
  }

  if (item?.kind === 'export-history') {
    openHistory()
  }
}

onMounted(loadHistory)
</script>

<template>
  <div
    v-if="hasActions"
    class="flex shrink-0 items-center justify-end gap-2"
  >
    <div class="relative">
      <button
        v-if="historyOpen"
        type="button"
        class="fixed inset-0 z-30 cursor-default bg-transparent"
        :aria-label="t('ui.closeActions')"
        @click="historyOpen = false"
      />
      <ActionMenu
        :open="actionsOpen"
        :label="t('ui.exportActions')"
        :items="actionMenuItems"
        @toggle="actionsOpen = !actionsOpen; historyOpen = false"
        @close="actionsOpen = false"
        @select="handleActionSelect"
      />

      <div
        v-if="historyOpen"
        class="absolute right-0 z-40 mt-2 w-80 rounded-md border bg-popover p-2 text-sm shadow-xl"
      >
        <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {{ t(props.historyTitle) }}
        </div>
        <div
          v-if="historyItems.length === 0"
          class="px-3 py-6 text-center text-sm text-muted-foreground"
        >
          {{ t('ui.noExportHistoryYet') }}
        </div>
        <div
          v-for="item in historyItems"
          :key="item.id"
          class="rounded-xl px-3 py-2 hover:bg-accent"
        >
          <div class="truncate font-medium">
            {{ item.filename }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ item.rowCount }} {{ t('ui.rows') }} - {{ formatDateTime(item.createdAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
