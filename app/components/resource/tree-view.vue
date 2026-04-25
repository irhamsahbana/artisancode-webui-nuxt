<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Circle } from 'lucide-vue-next'

interface TreeNode {
  id: string
  code: string
  name: string
  category: string
  children: TreeNode[]
}

const props = withDefaults(
  defineProps<{
    items: TreeNode[]
    level?: number
    canEditNode?: (node: TreeNode) => boolean
    canDeleteNode?: (node: TreeNode) => boolean
  }>(),
  {
    level: 0,
    canEditNode: () => true,
    canDeleteNode: () => true,
  },
)

const emit = defineEmits<{
  addChild: [node: TreeNode]
  edit: [node: TreeNode]
  delete: [node: TreeNode]
}>()

const expanded = ref<Set<string>>(new Set())

// Collect all node IDs that have children (for auto-expand)
const collectExpandableIds = (nodes: TreeNode[]): string[] => {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id)
      ids.push(...collectExpandableIds(node.children))
    }
  }
  return ids
}

// Auto-expand all nodes when items change
watch(
  () => props.items,
  (newItems) => {
    expanded.value = new Set(collectExpandableIds(newItems))
  },
  { immediate: true },
)

const toggleExpand = (id: string) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

const isExpanded = (id: string) => expanded.value.has(id)
const formatNodeLabel = (item: TreeNode) => {
  const category = item.category?.trim()
  return category ? `${item.name} (${category})` : item.name
}
</script>

<template>
  <div class="pl-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="py-1"
    >
      <div
        class="flex items-center gap-2 hover:bg-accent/50 rounded px-2 py-1 group"
      >
        <!-- Expand/collapse toggle -->
        <span
          class="w-4 h-4 flex items-center justify-center cursor-pointer text-muted-foreground"
          @click.stop="toggleExpand(item.id)"
        >
          <ChevronDown
            v-if="item.children.length > 0 && isExpanded(item.id)"
            class="h-4 w-4"
          />
          <ChevronRight
            v-else-if="item.children.length > 0"
            class="h-4 w-4"
          />
          <Circle
            v-else
            class="h-2 w-2 fill-current"
          />
        </span>
        <span class="font-medium">
          {{ formatNodeLabel(item) }}
        </span>

        <!-- Node Actions -->
        <div class="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            v-if="props.canEditNode(item)"
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            title="Add child unit"
            @click.stop="emit('addChild', item)"
          >
            <Plus class="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            title="Edit"
            @click.stop="emit('edit', item)"
          >
            <Pencil class="h-3.5 w-3.5" />
          </Button>
          <Button
            v-if="props.canDeleteNode(item)"
            variant="ghost"
            size="icon"
            class="h-6 w-6 text-destructive hover:text-destructive"
            title="Delete"
            @click.stop="emit('delete', item)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        v-if="item.children.length > 0 && isExpanded(item.id)"
        class="ml-4 border-l border-border"
      >
        <TreeView
          :items="item.children"
          :level="(props.level ?? 0) + 1"
          :can-edit-node="props.canEditNode"
          :can-delete-node="props.canDeleteNode"
          @add-child="(node: TreeNode) => emit('addChild', node)"
          @edit="(node: TreeNode) => emit('edit', node)"
          @delete="(node: TreeNode) => emit('delete', node)"
        />
      </div>
    </div>
  </div>
</template>
