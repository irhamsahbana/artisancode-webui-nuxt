<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch, type ComponentPublicInstance } from 'vue'

type Column = {
  key: string
  label: string
  format?: (value: unknown, row: Record<string, unknown>) => string
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: Record<string, unknown>[]
    emptyText?: string
    canViewDetail?: boolean
    canDelete?: boolean
    selectable?: boolean
  }>(),
  {
    canViewDetail: true,
    canDelete: true,
    emptyText: 'No data available',
    selectable: true,
  },
)

const emit = defineEmits<{
  (event: 'delete', row: Record<string, unknown>): void
  (event: 'view', row: Record<string, unknown>): void
  (event: 'selection-change', keys: Array<string | number>): void
}>()

const resolvedRows = computed(() => props.rows ?? [])
const slots = useSlots()
const hasCustomActions = computed(() => Boolean(slots['row-actions']))
const openMenuKey = ref<string | number | null>(null)
const menuPosition = ref<{ top: number; left: number } | null>(null)
const menuRefs = ref<Record<string, HTMLElement | null>>({})
const menuAnchorRefs = ref<Record<string, HTMLElement | null>>({})
const hasActions = computed(() => props.canViewDetail || props.canDelete || hasCustomActions.value)
const selectedKeys = ref<Set<string | number>>(new Set())
const rowKeys = computed(() => resolvedRows.value.map((row, index) => getRowKey(row, index)))
const allSelected = computed(
  () => rowKeys.value.length > 0 && rowKeys.value.every((key) => selectedKeys.value.has(key)),
)

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '-'
  }
  
  // Auto format ISO 8601 datetime strings to local timezone
  if (typeof value === 'string') {
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

const getRowKey = (row: Record<string, unknown>, index: number) => {
  const id = row.id ?? row.uuid ?? row.code
  if (typeof id === 'string' || typeof id === 'number') {
    return id
  }
  return index
}

const syncSelection = () => {
  const nextKeys = new Set(
    rowKeys.value.filter((key) => selectedKeys.value.has(key)),
  )
  selectedKeys.value = nextKeys
  emit('selection-change', Array.from(nextKeys))
}

const toggleAll = () => {
  const nextKeys = new Set<string | number>()
  if (!allSelected.value) {
    rowKeys.value.forEach((key) => nextKeys.add(key))
  }
  selectedKeys.value = nextKeys
  emit('selection-change', Array.from(nextKeys))
}

const toggleRow = (key: string | number) => {
  const nextKeys = new Set(selectedKeys.value)
  if (nextKeys.has(key)) {
    nextKeys.delete(key)
  } else {
    nextKeys.add(key)
  }
  selectedKeys.value = nextKeys
  emit('selection-change', Array.from(nextKeys))
}

const closeMenu = () => {
  openMenuKey.value = null
  menuPosition.value = null
}

const resolveElement = (element: Element | ComponentPublicInstance | null) => {
  if (element instanceof HTMLElement) {
    return element
  }
  if (element && '$el' in element && element.$el instanceof HTMLElement) {
    return element.$el
  }
  return null
}

const setMenuRef = (key: string | number, element: Element | ComponentPublicInstance | null) => {
  menuRefs.value[String(key)] = resolveElement(element)
}

const setMenuAnchorRef = (key: string | number, element: Element | ComponentPublicInstance | null) => {
  menuAnchorRefs.value[String(key)] = resolveElement(element)
}

const toggleMenu = (key: string | number, event: MouseEvent) => {
  if (openMenuKey.value === key) {
    closeMenu()
    return
  }
  const target = event.currentTarget
  if (!(target instanceof HTMLElement) || !import.meta.client) {
    openMenuKey.value = key
    menuPosition.value = null
    setMenuAnchorRef(key, null)
    return
  }
  setMenuAnchorRef(key, target)
  const rect = target.getBoundingClientRect()
  const optionCount =
    (props.canViewDetail ? 1 : 0)
    + (props.canDelete ? 1 : 0)
    + (hasCustomActions.value ? 1 : 0)
  const estimatedHeight = optionCount * 40 + 16
  const menuWidth = 160
  const padding = 8
  const spaceBelow = window.innerHeight - rect.bottom
  const top =
    spaceBelow < estimatedHeight
      ? Math.max(padding, rect.top - estimatedHeight - 4)
      : rect.bottom + 4
  let left = rect.right - menuWidth
  if (left < padding) {
    left = padding
  }
  if (left + menuWidth > window.innerWidth - padding) {
    left = window.innerWidth - menuWidth - padding
  }
  openMenuKey.value = key
  menuPosition.value = { top, left }
}

const viewDetail = (row: Record<string, unknown>) => {
  closeMenu()
  emit('view', row)
}

const confirmDelete = (row: Record<string, unknown>) => {
  closeMenu()
  emit('delete', row)
}

const handleClickOutside = (event: MouseEvent) => {
  if (!openMenuKey.value) {
    return
  }
  const target = event.target as Node
  const activeKey = String(openMenuKey.value)
  const menuEl = menuRefs.value[activeKey]
  if (menuEl && menuEl.contains(target)) {
    return
  }
  const buttonEl = menuAnchorRefs.value[activeKey]
  if (buttonEl && buttonEl.contains(target)) {
    return
  }
  closeMenu()
}

const handleScroll = () => {
  if (openMenuKey.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
})

watch(
  () => rowKeys.value,
  () => syncSelection(),
)
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead
          v-if="props.selectable"
          class="w-10"
        >
          <input
            type="checkbox"
            role="checkbox"
            class="h-4 w-4 rounded border-input bg-background text-primary"
            :checked="allSelected"
            @change="toggleAll"
          >
        </TableHead>
        <TableHead
          v-for="column in columns"
          :key="column.key"
        >
          {{ column.label }}
        </TableHead>
        <TableHead
          v-if="hasActions"
          class="w-10 text-right"
        >
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(row, index) in resolvedRows"
        :key="getRowKey(row, index)"
      >
        <TableCell
          v-if="props.selectable"
          class="w-10"
        >
          <input
            type="checkbox"
            role="checkbox"
            class="h-4 w-4 rounded border-input bg-background text-primary"
            :checked="selectedKeys.has(getRowKey(row, index))"
            @change="toggleRow(getRowKey(row, index))"
          >
        </TableCell>
        <TableCell
          v-for="column in columns"
          :key="column.key"
        >
          <span v-if="column.format">
            {{ column.format(row[column.key], row) }}
          </span>
          <span v-else>
            {{ formatCellValue(row[column.key]) }}
          </span>
        </TableCell>
        <TableCell
          v-if="hasActions"
          class="relative text-right"
        >
          <Button
            variant="ghost"
            size="sm"
            :ref="(el) => setMenuAnchorRef(getRowKey(row, index), el)"
            @click="toggleMenu(getRowKey(row, index), $event)"
          >
            ⋯
          </Button>
          <Teleport to="body">
            <div
              v-if="openMenuKey === getRowKey(row, index) && menuPosition"
              :ref="(el) => setMenuRef(getRowKey(row, index), el)"
              class="fixed z-50 w-40 rounded-md border bg-popover p-1 text-sm shadow-md"
              :style="{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }"
            >
              <button
                v-if="props.canViewDetail"
                class="w-full rounded px-3 py-2 text-left hover:bg-accent"
                @click="viewDetail(row)"
              >
                Manage
              </button>
              <slot
                name="row-actions"
                :row="row"
                :close="closeMenu"
              />
              <button
                v-if="props.canDelete"
                class="w-full rounded px-3 py-2 text-left text-destructive hover:bg-accent"
                @click="confirmDelete(row)"
              >
                Delete
              </button>
            </div>
          </Teleport>
        </TableCell>
      </TableRow>
      <TableRow v-if="resolvedRows.length === 0">
        <TableCell
          :colspan="columns.length + (hasActions ? 1 : 0) + (props.selectable ? 1 : 0)"
          class="text-center text-muted-foreground"
        >
          {{ emptyText ?? 'No data available' }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
