<script setup lang="ts">
import type { OrgUnitNode } from '~/components/resource/org-unit-tree-select.vue'

defineOptions({ name: 'OrgUnitTreeNode' })

const props = defineProps<{
  node: OrgUnitNode
  selectedId: string | null
  expandedIds: Set<string>
  level: number
}>()

const emit = defineEmits<{
  (event: 'toggle-expand', id: string, e: MouseEvent): void
  (event: 'select', node: OrgUnitNode): void
}>()

const isExpanded = () => props.expandedIds.has(props.node.id)
const isSelected = () => props.selectedId === props.node.id
const hasChildren = () => props.node.children.length > 0
const formattedLabel = computed(() => {
  const category = props.node.category?.trim()
  return category ? `${props.node.name} (${category})` : props.node.name
})
</script>

<template>
  <div>
    <div
      class="flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-accent"
      :class="{ 'bg-accent': isSelected() }"
      :style="{ paddingLeft: `${level * 20 + 8}px` }"
      role="treeitem"
      :aria-selected="isSelected()"
      :aria-expanded="hasChildren() ? isExpanded() : undefined"
    >
      <!-- Expand toggle -->
      <button
        v-if="hasChildren()"
        type="button"
        class="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground"
        :aria-label="isExpanded() ? 'Collapse organization unit' : 'Expand organization unit'"
        @click="emit('toggle-expand', node.id, $event)"
      >
        {{ isExpanded() ? '▾' : '▸' }}
      </button>
      <span
        v-else
        class="w-4 h-4 flex items-center justify-center shrink-0 text-xs text-muted-foreground"
        aria-hidden="true"
      >●</span>

      <!-- Name -->
      <button
        type="button"
        class="min-w-0 flex-1 truncate text-left"
        :class="{ 'font-medium': isSelected() }"
        @click="emit('select', node)"
      >
        {{ formattedLabel }}
      </button>
    </div>

    <!-- Children -->
    <div v-if="hasChildren() && isExpanded()">
      <OrgUnitTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :level="level + 1"
        @toggle-expand="(id, e) => emit('toggle-expand', id, e)"
        @select="(n) => emit('select', n)"
      />
    </div>
  </div>
</template>
