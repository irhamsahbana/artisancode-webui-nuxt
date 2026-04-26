<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '~/utils/utils'

defineOptions({ name: 'SearchableTreeSelect' })

type TreeItem = {
  id: string
  name: string
  parent_id: string | null
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    items: TreeItem[]
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: 'Select option',
    searchPlaceholder: 'Search…',
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void
}>()

const { t } = useLocale()

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const debouncedQuery = ref('')
const listboxId = useId()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

interface TreeNode {
  id: string
  name: string
  depth: number
  children: TreeNode[]
}

const selectedItem = computed(() => {
  return props.items.find((item) => item.id === props.modelValue) ?? null
})

const selectedLabel = computed(() => selectedItem.value?.name ?? '')

const buildTree = (items: TreeItem[]): TreeNode[] => {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const item of items) {
    map.set(item.id, { id: item.id, name: item.name, depth: 0, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      const parent = map.get(item.parent_id)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const setDepth = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      node.depth = depth
      setDepth(node.children, depth + 1)
    }
  }
  setDepth(roots, 0)

  return roots
}

const flattenTree = (nodes: TreeNode[]): Array<TreeNode & { indent: number }> => {
  const result: Array<TreeNode & { indent: number }> = []
  for (const node of nodes) {
    result.push({ ...node, indent: node.depth * 20 })
    result.push(...flattenTree(node.children))
  }
  return result
}

const tree = computed(() => buildTree(props.items))
const allFlatNodes = computed(() => flattenTree(tree.value))

const filteredNodes = computed(() => {
  const term = debouncedQuery.value.trim().toLowerCase()
  if (!term) return allFlatNodes.value

  const matchingIds = new Set<string>()
  const ancestorIds = new Set<string>()

  const findAncestors = (id: string, items: TreeItem[]) => {
    let current = items.find((item) => item.id === id)
    while (current?.parent_id) {
      ancestorIds.add(current.parent_id)
      current = items.find((item) => item.id === current!.parent_id)
    }
  }

  for (const item of props.items) {
    if (item.name.toLowerCase().includes(term)) {
      matchingIds.add(item.id)
      findAncestors(item.id, props.items)
    }
  }

  const visibleIds = new Set([...matchingIds, ...ancestorIds])
  return allFlatNodes.value.filter((node) => visibleIds.has(node.id))
})

const resolvedPlaceholder = computed(() => props.placeholder)
const selectedBadgeLabel = computed(() => t('ui.selected'))
const emptyLabel = computed(() => t('ui.noOptions'))

const openList = () => {
  if (props.disabled) return
  isOpen.value = true
}

const closeList = () => {
  isOpen.value = false
  query.value = selectedLabel.value
  debouncedQuery.value = selectedLabel.value
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeList()
  }
}

const selectOption = (node: TreeNode) => {
  emit('update:modelValue', node.id)
  isOpen.value = false
  query.value = node.name
  debouncedQuery.value = node.name
}

const clearSelection = () => {
  emit('update:modelValue', null)
  query.value = ''
  debouncedQuery.value = ''
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  query.value = target.value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = query.value
  }, 200)
  if (!isOpen.value) isOpen.value = true
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    closeList()
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      query.value = selectedLabel.value
      debouncedQuery.value = selectedLabel.value
    }
  },
  { immediate: true },
)

watch(
  () => props.items,
  () => {
    if (!isOpen.value) {
      query.value = selectedLabel.value
      debouncedQuery.value = selectedLabel.value
    }
  },
  { deep: true },
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <div class="relative">
      <input
        v-bind="$attrs"
        :value="query"
        :disabled="disabled"
        :placeholder="selectedLabel ? '' : resolvedPlaceholder"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        aria-autocomplete="list"
        autocomplete="off"
        role="combobox"
        :class="cn('h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', $attrs.class as string)"
        @focus="openList"
        @input="onInput"
        @keydown="handleInputKeydown"
      >
      <button
        v-if="selectedLabel && !disabled"
        type="button"
        :aria-label="t('ui.clear')"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        @click="clearSelection"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
          />
          <line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          />
        </svg>
      </button>
    </div>
    <div
      v-if="isOpen"
      :id="listboxId"
      class="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 text-sm shadow-md"
      role="listbox"
    >
      <div class="max-h-64 overflow-auto">
        <button
          v-for="node in filteredNodes"
          :key="node.id"
          type="button"
          class="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
          role="option"
          :aria-selected="node.id === props.modelValue"
          @click="selectOption(node)"
        >
          <span :style="{ paddingLeft: `${node.indent}px` }">
            <span
              v-if="node.depth > 0"
              class="mr-1 text-muted-foreground"
            >└</span>
            {{ node.name }}
          </span>
          <span
            v-if="node.id === props.modelValue"
            class="text-xs text-muted-foreground"
          >
            {{ selectedBadgeLabel }}
          </span>
        </button>
        <div
          v-if="filteredNodes.length === 0"
          class="px-3 py-2 text-muted-foreground"
        >
          {{ emptyLabel }}
        </div>
      </div>
    </div>
  </div>
</template>
