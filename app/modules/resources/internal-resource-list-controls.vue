<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, MoreVertical, SlidersHorizontal } from 'lucide-vue-next'
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

const props = withDefaults(
  defineProps<{
    endpoint: string
    resourceKey: string
    filenamePrefix: string
    columns: ExportColumn[]
    query?: Record<string, unknown>
    filterCount?: number
    authMode?: 'user' | 'internal'
  }>(),
  {
    query: undefined,
    filterCount: 0,
    authMode: 'internal',
  },
)

const emit = defineEmits<{
  reset: []
}>()

const { apiFetch } = useApi()
const { text: uiText } = useLocale()
const { formatDateTime } = useDateTime()
const { show } = useBanner()

const filtersOpen = ref(false)
const historyOpen = ref(false)
const actionsOpen = ref(false)
const exporting = ref(false)
const historyItems = ref<ExportHistoryItem[]>([])

const storageKey = computed(() => `internal-resource-export-history:${props.resourceKey}`)
const hasFilters = computed(() => props.filterCount > 0)

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
  const header = props.columns.map(column => escapeCsvValue(uiText(column.label))).join(',')
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
  show(uiText('Export completed.'), 'success')
}

const openHistory = () => {
  actionsOpen.value = false
  historyOpen.value = true
}

onMounted(loadHistory)
</script>

<template>
  <div class="flex w-full flex-wrap items-center justify-end gap-2">
    <Teleport to="body">
      <div
        v-if="filtersOpen"
        class="fixed inset-0 z-50"
      >
        <button
          type="button"
          class="absolute inset-0 bg-transparent"
          :aria-label="uiText('Close filters')"
          @click="filtersOpen = false"
        />

        <div class="absolute inset-x-3 top-16 overflow-hidden rounded-sm border border-border bg-background shadow-xl dark:bg-slate-950 sm:inset-x-6">
          <div class="grid border-b border-border text-xs font-semibold text-foreground md:grid-cols-[230px_1fr]">
            <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
              {{ uiText('Filter by date') }}
            </div>
            <div class="min-w-0 px-4 py-3">
              {{ uiText('Filters') }}
            </div>
          </div>

          <div class="max-h-[62vh] overflow-auto px-4 py-3">
            <slot />
          </div>

          <div class="flex items-center justify-end gap-4 border-t border-border bg-background px-4 py-3 dark:bg-slate-950">
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="emit('reset')"
            >
              {{ uiText('Clear Filter') }}
            </Button>
            <Button
              size="sm"
              @click="filtersOpen = false"
            >
              {{ uiText('Submit') }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>

    <Button
      variant="outline"
      size="sm"
      class="gap-2 rounded-md"
      @click="filtersOpen = true"
    >
      <SlidersHorizontal class="h-4 w-4" />
      {{ uiText('Filter') }}
      <span
        v-if="hasFilters"
        class="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground"
      >
        {{ props.filterCount }}
      </span>
    </Button>

    <div class="relative">
      <Button
        variant="outline"
        size="icon"
        class="h-9 w-9 rounded-md"
        :aria-label="uiText('Export actions')"
        @click="actionsOpen = !actionsOpen"
      >
        <MoreVertical class="h-4 w-4" />
      </Button>

      <div
        v-if="actionsOpen"
        class="absolute right-0 z-40 mt-2 w-40 overflow-hidden rounded-md border bg-popover text-sm shadow-md"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="exporting"
          @click="exportRows"
        >
          <Download class="h-4 w-4" />
          {{ exporting ? uiText('Exporting...') : uiText('Export') }}
        </button>
        <button
          type="button"
          class="block w-full px-3 py-2 text-left hover:bg-accent"
          @click="openHistory"
        >
          {{ uiText('Export') }}
        </button>
      </div>

      <div
        v-if="historyOpen"
        class="absolute right-0 z-40 mt-2 w-80 rounded-md border bg-popover p-2 text-sm shadow-xl"
      >
        <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {{ uiText('Export') }}
        </div>
        <div
          v-if="historyItems.length === 0"
          class="px-3 py-6 text-center text-sm text-muted-foreground"
        >
          {{ uiText('No export history yet.') }}
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
            {{ item.rowCount }} {{ uiText('rows') }} - {{ formatDateTime(item.createdAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
