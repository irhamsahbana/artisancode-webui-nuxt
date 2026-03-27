<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface OrgUnitNode {
  id: string
  code: string
  name: string
  parent_id: string | null
  category: string
  children: OrgUnitNode[]
}

defineOptions({ name: 'OrgUnitTreeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
  }>(),
  {
    modelValue: null,
    placeholder: 'Select organization unit',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void
}>()

const { apiFetch } = useApi()

// Flat list from API
type OrgUnitItem = { id: string; code: string; name: string; parent_id: string | null; category: string }
const flatItems = ref<OrgUnitItem[]>([])
const loading = ref(false)
const open = ref(false)
const expanded = ref<Set<string>>(new Set())
const rootRef = ref<HTMLElement | null>(null)

// Build tree from flat list
const buildTree = (items: OrgUnitItem[]): OrgUnitNode[] => {
  const map = new Map<string, OrgUnitNode>()
  const roots: OrgUnitNode[] = []

  for (const item of items) {
    map.set(item.id, { ...item, parent_id: item.parent_id, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

const tree = computed(() => buildTree(flatItems.value))

// Breadcrumb path for selected node
const selectedPath = computed(() => {
  if (!props.modelValue) return ''
  const parts: string[] = []
  let current = flatItems.value.find((item) => item.id === props.modelValue)
  while (current) {
    parts.unshift(current.name)
    current = current.parent_id
      ? flatItems.value.find((item) => item.id === current!.parent_id)
      : undefined
  }
  return parts.join(' › ')
})

// Fetch org units
const fetchOrgUnits = async () => {
  loading.value = true
  const resp = await apiFetch<{ items: OrgUnitItem[] }>('/org-units', {
    query: { page: 1, paginate: 1000 },
  })
  if (resp.success && resp.data) {
    flatItems.value = resp.data.items ?? []
    // Auto-expand root nodes
    for (const root of tree.value) {
      expanded.value.add(root.id)
    }
  }
  loading.value = false
}

const toggle = () => {
  if (!open.value && flatItems.value.length === 0) {
    fetchOrgUnits()
  }
  open.value = !open.value
}

const close = () => {
  open.value = false
}

const toggleExpand = (id: string, e: MouseEvent) => {
  e.stopPropagation()
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

const selectNode = (node: OrgUnitNode) => {
  emit('update:modelValue', node.id)
  open.value = false
}

const clear = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', null)
}

// Click outside to close
const handleClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  // Preload data so selected path can be displayed
  fetchOrgUnits()
})

// Expose fetchOrgUnits so parent can preload
defineExpose({ fetchOrgUnits })
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <!-- Trigger -->
    <button
      type="button"
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      @click="toggle"
    >
      <span
        v-if="selectedPath"
        class="truncate text-foreground"
      >
        {{ selectedPath }}
      </span>
      <span
        v-else
        class="text-muted-foreground"
      >
        {{ placeholder }}
      </span>
      <span class="flex items-center gap-1 ml-2 shrink-0">
        <span
          v-if="modelValue"
          class="text-muted-foreground hover:text-foreground text-xs"
          @click="clear"
        >
          ✕
        </span>
        <span class="text-muted-foreground">▾</span>
      </span>
    </button>

    <!-- Dropdown tree panel -->
    <div
      v-if="open"
      class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
    >
      <div
        v-if="loading"
        class="p-3 text-sm text-muted-foreground"
      >
        Loading...
      </div>
      <div
        v-else-if="tree.length === 0"
        class="p-3 text-sm text-muted-foreground"
      >
        No organization units found
      </div>
      <div
        v-else
        class="max-h-64 overflow-auto p-1"
      >
        <template
          v-for="node in tree"
          :key="node.id"
        >
          <OrgUnitTreeNode
            :node="node"
            :selected-id="modelValue"
            :expanded-ids="expanded"
            :level="0"
            @toggle-expand="(id, e) => toggleExpand(id, e)"
            @select="selectNode"
          />
        </template>
      </div>
    </div>
  </div>
</template>