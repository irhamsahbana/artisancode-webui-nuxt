<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, useSlots, watch } from 'vue'
import { useAsyncData, useRoute, useRouter } from '#app'

import type { ApiResponse, ListResponse } from '~/types/api'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

type Column = {
  key: string
  label: string
  format?: (value: unknown, row: Record<string, unknown>) => string
}

const props = withDefaults(
  defineProps<{
    title: string
    endpoint: string
    columns: Column[]
    extraQuery?: Record<string, unknown>
    searchKey?: string | null
    searchPlaceholder?: string
    searchDebounceMs?: number
    loadingVariant?: 'text' | 'skeleton'
    canViewDetail?: boolean
    canDelete?: boolean
    deleteLabelKey?: string | null
    deleteLabelFormatter?: (row: Record<string, unknown>) => string
  }>(),
  {
    extraQuery: undefined,
    searchKey: 'q',
    searchPlaceholder: 'Search...',
    searchDebounceMs: 0,
    loadingVariant: 'text',
    canViewDetail: true,
    canDelete: true,
    deleteLabelKey: 'name',
    deleteLabelFormatter: () => '',
  },
)

const query = reactive({
  q: '',
  page: 1,
  limit: 15,
})

const { apiFetch } = useApi()
const { show } = useBanner()
const route = useRoute()
const router = useRouter()
const limitOptions = [10, 15, 25, 50, 100]
const limitOptionList = computed(() =>
  limitOptions.map((limit) => ({
    value: limit,
    label: `${limit} / page`,
  })),
)

const detailOpen = ref(false)
const detailRow = ref<Record<string, unknown> | null>(null)
const detailLoading = ref(false)
const detailId = ref<string | null>(null)
const deleteOpen = ref(false)
const deleteRowTarget = ref<Record<string, unknown> | null>(null)
const deleteLoading = ref(false)
const selectedCount = ref(0)

const buildQuery = () => {
  const base: Record<string, unknown> = {
    page: query.page,
    limit: query.limit,
  }

  if (props.extraQuery) {
    for (const [key, value] of Object.entries(props.extraQuery)) {
      if (value !== '' && value !== null && value !== undefined) {
        base[key] = value
      }
    }
  }

  if (props.searchKey && query.q) {
    base[props.searchKey] = query.q
  }

  return base
}

const asyncKey = `resource-list:${props.endpoint}`

const { data, pending, refresh, error } = await useAsyncData(
  asyncKey,
  () =>
    apiFetch<ListResponse<Record<string, unknown>>>(props.endpoint, {
      query: buildQuery(),
    }),
  { server: false },
)

watch(
  () => [query.page, query.limit],
  () => refresh(),
)

watch(
  () => JSON.stringify(props.extraQuery ?? {}),
  () => {
    query.page = 1
    refresh()
  },
)

watch(
  () => query.limit,
  (value, previous) => {
    if (value !== previous) {
      query.page = 1
    }
  },
)

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => query.q,
  () => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    const delay = props.searchDebounceMs ?? 0
    if (delay > 0) {
      searchDebounceTimer = setTimeout(() => {
        refresh()
      }, delay)
      return
    }
    refresh()
  },
)

onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})

const response = computed(() => data.value as ApiResponse<ListResponse<Record<string, unknown>>> | undefined)
const rows = computed(() => response.value?.data?.items ?? [])
const pagination = computed(() => response.value?.data?.pagination)
const skeletonRows = computed(() => Math.max(1, Number(query.limit ?? 1)))
const slots = useSlots()
const hasDetailSlot = computed(() => Boolean(slots.detail))
const hasHeaderActions = computed(() => Boolean(slots['header-actions']))
const hasRowActions = computed(() => Boolean(slots['row-actions']))

const detailEntries = computed(() => {
  if (!detailRow.value) {
    return []
  }
  return Object.entries(detailRow.value)
})

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '-'
  }
  
  // Auto format ISO 8601 datetime strings to local timezone
  if (typeof value === 'string') {
    // Check if string matches ISO datetime format (with T and Z, including microseconds)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
      try {
        return new Date(value).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        // Fallback to original string if date parsing fails
        return value
      }
    }
    return value
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  
  return String(value)
}

const getRowId = (row: Record<string, unknown>) => {
  const id = row.id ?? row.uuid ?? row.code
  if (typeof id === 'string' || typeof id === 'number') {
    return id
  }
  return null
}

const closeDetail = () => {
  detailOpen.value = false
  detailRow.value = null
  detailLoading.value = false
  detailId.value = null
}

const getRouteId = () => {
  const idParam = route.params.id
  if (typeof idParam === 'string' && idParam.length > 0) {
    return idParam
  }
  return null
}

const getBasePath = () => {
  const idParam = getRouteId()
  if (idParam && route.path.endsWith(`/${idParam}`)) {
    return route.path.slice(0, -(`/${idParam}`).length)
  }
  return route.path
}

const openDetailById = async (id: string) => {
  if (!props.canViewDetail) {
    return
  }
  detailId.value = id
  detailOpen.value = true
  detailLoading.value = true
  detailRow.value = null
  const response = await apiFetch<Record<string, unknown>>(`${props.endpoint}/${id}`)
  if (response.success && response.data) {
    detailRow.value = response.data
  }
  detailLoading.value = false
}

const openDetail = async (row: Record<string, unknown>) => {
  if (!props.canViewDetail) {
    return
  }
  const id = getRowId(row)
  if (id === null) {
    show('Detail not available.', 'error')
    return
  }
  const idString = String(id)
  const basePath = getBasePath()

  // When no detail slot is provided, always navigate to a separate page
  // (page-based navigation). Never open a modal.
  if (!hasDetailSlot.value) {
    await router.push(`${basePath}/${idString}`)
    return
  }

  // When a detail slot is provided, use the modal pattern:
  // push route if not already there, then load data into the modal.
  if (getRouteId() !== idString) {
    await router.push(`${basePath}/${idString}`)
    return
  }
  await openDetailById(idString)
}

const closeDetailWithRoute = async () => {
  closeDetail()
  const basePath = getBasePath()
  if (route.path !== basePath) {
    await router.push(basePath)
  }
}

const requestDelete = (row: Record<string, unknown>) => {
  if (!props.canDelete) {
    return
  }
  deleteRowTarget.value = row
  deleteOpen.value = true
}

const cancelDelete = () => {
  deleteOpen.value = false
  deleteRowTarget.value = null
  deleteLoading.value = false
}

const confirmDelete = async () => {
  if (!props.canDelete || !deleteRowTarget.value) {
    cancelDelete()
    return
  }
  const id = getRowId(deleteRowTarget.value)
  if (id === null) {
    show('Delete failed: missing id.', 'error')
    cancelDelete()
    return
  }
  deleteLoading.value = true
  const response = await apiFetch(`${props.endpoint}/${id}`, { method: 'DELETE' })
  deleteLoading.value = false
  if (response.success) {
    await refresh()
    cancelDelete()
  }
}

const deleteLabel = computed(() => {
  if (!deleteRowTarget.value) {
    return '-'
  }
  if (props.deleteLabelFormatter) {
    const formatted = props.deleteLabelFormatter(deleteRowTarget.value)
    if (typeof formatted === 'string' && formatted.length > 0) {
      return formatted
    }
  }
  if (props.deleteLabelKey) {
    const value = deleteRowTarget.value[props.deleteLabelKey]
    if (value !== undefined) {
      return formatValue(value)
    }
  }
  return formatValue(getRowId(deleteRowTarget.value))
})

const nextPage = () => {
  if (pagination.value && query.page < pagination.value.last_page) {
    query.page += 1
  }
}

const prevPage = () => {
  if (query.page > 1) {
    query.page -= 1
  }
}

const updateSelection = (keys: Array<string | number>) => {
  selectedCount.value = keys.length
}

watch(
  () => route.params.id,
  (value) => {
    if (!import.meta.client) {
      return
    }

    // When no detail slot is provided, skip modal handling entirely.
    // Navigation to detail pages is handled by openDetail() directly.
    if (!hasDetailSlot.value) {
      return
    }

    const idParam = typeof value === 'string' ? value : null
    if (idParam) {
      if (detailId.value !== idParam) {
        openDetailById(idParam)
      }
      return
    }
    if (detailOpen.value) {
      closeDetail()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{{ title }}</CardTitle>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-1 flex-wrap items-center gap-2">
          <Input
            v-if="props.searchKey"
            v-model="query.q"
            :placeholder="props.searchPlaceholder"
            class="h-9 w-full max-w-xs"
          />
          <Button
            v-if="props.searchKey"
            variant="outline"
            size="sm"
          >
            Filter
          </Button>
          <div
            v-if="props.searchKey && query.q"
            class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            <span>Search: {{ query.q }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-6 px-2"
              @click="query.q = ''"
            >
              Clear
            </Button>
          </div>
          <slot name="filters" />
        </div>
        <div class="flex items-center gap-2">
          <slot
            v-if="hasHeaderActions"
            name="header-actions"
          />
        </div>
      </div>
    </CardHeader>
    <ClientOnly>
      <CardContent>
        <div
          v-if="error"
          class="text-sm text-destructive"
        >
          Failed to load data.
        </div>
        <div v-else>
          <div v-if="pending">
            <Table v-if="props.loadingVariant === 'skeleton'">
              <TableHeader>
                <TableRow>
                  <TableHead
                    v-for="column in columns"
                    :key="column.key"
                  >
                    {{ column.label }}
                  </TableHead>
                  <TableHead
                    v-if="props.canViewDetail || props.canDelete"
                    class="w-10 text-right"
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="index in skeletonRows"
                  :key="`resource-skeleton-${index}`"
                >
                  <TableCell
                    v-for="column in columns"
                    :key="`resource-skeleton-cell-${column.key}-${index}`"
                  >
                    <div
                      class="h-4 rounded bg-muted animate-pulse"
                      :class="column.key === 'description' ? 'w-48' : 'w-32'"
                    />
                  </TableCell>
                  <TableCell v-if="props.canViewDetail || props.canDelete">
                    <div class="ml-auto h-4 w-8 rounded bg-muted animate-pulse" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div
              v-else
              class="text-sm text-muted-foreground"
            >
              Loading...
            </div>
          </div>
          <ResourceTable
            v-else
            :columns="columns"
            :rows="rows"
            :can-view-detail="props.canViewDetail"
            :can-delete="props.canDelete"
            @view="openDetail"
            @delete="requestDelete"
            @selection-change="updateSelection"
          >
            <template
              v-for="(_, name) in $slots"
              #[name]="slotProps"
            >
              <slot
                :name="name"
                v-bind="slotProps"
              />
            </template>
          </ResourceTable>
        </div>
      </CardContent>
      <CardFooter class="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div class="text-muted-foreground">
          {{ selectedCount }} of {{ rows.length }} row(s) selected
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Rows per page</span>
            <SearchableSelect
              v-model="query.limit"
              :options="limitOptionList"
              placeholder="Limit"
              search-placeholder="Search limit"
              class="w-32"
            />
          </div>
          <div
            v-if="pagination"
            class="text-muted-foreground"
          >
            Page {{ pagination.page }} of {{ pagination.last_page }}
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="query.page === 1"
              @click="prevPage"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!pagination || query.page >= pagination.last_page"
              @click="nextPage"
            >
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
      <template #fallback>
        <CardContent>
          <div class="text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </template>
    </ClientOnly>
  </Card>
  <slot
    v-if="detailOpen && hasDetailSlot"
    name="detail"
    :open="detailOpen"
    :row="detailRow"
    :loading="detailLoading"
    :entries="detailEntries"
    :format-value="formatValue"
    :close="closeDetailWithRoute"
    :refresh="refresh"
  />
  <div
    v-else-if="detailOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    @click.self="closeDetailWithRoute"
  >
    <div class="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          Detail
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="closeDetailWithRoute"
        >
          Close
        </Button>
      </div>
      <div class="mt-4 max-h-[70vh] overflow-auto text-sm">
        <div class="grid gap-2">
          <div
            v-if="detailLoading"
            class="text-muted-foreground"
          >
            Loading...
          </div>
          <div
            v-else-if="detailEntries.length === 0"
            class="text-muted-foreground"
          >
            No detail available.
          </div>
          <div v-else>
            <div
              v-for="[key, value] in detailEntries"
              :key="String(key)"
              class="grid grid-cols-3 gap-4"
            >
              <div class="text-muted-foreground">
                {{ key }}
              </div>
              <div class="col-span-2 break-words">
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="deleteOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
  >
    <div class="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
      <div class="text-lg font-semibold">
        Confirm delete
      </div>
      <div class="mt-2 text-sm text-muted-foreground">
        Delete {{ deleteLabel }}? This action cannot be undone.
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="deleteLoading"
          @click="cancelDelete"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          :disabled="deleteLoading"
          @click="confirmDelete"
        >
          {{ deleteLoading ? 'Deleting...' : 'Delete' }}
        </Button>
      </div>
    </div>
  </div>
</template>
