<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface OrgUnitNode {
  id: string
  code: string
  name: string
  parent_id: string | null
  category: string
}

defineOptions({ name: 'OrgUnitTreeSelect' })

const { t } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string | null
  }>(),
  {
    modelValue: null,
    placeholder: null,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void
}>()

const { apiFetch } = useApi()

type OrgUnitItem = {
  id: string
  code: string
  name: string
  parent_id: string | null
  category: string
}

const flatItems = ref<OrgUnitItem[]>([])
const loading = ref(false)

const formatOrgUnitLabel = (item: Pick<OrgUnitItem, 'name' | 'category'>) => {
  const category = item.category?.trim()
  return category ? `${item.name} (${category})` : item.name
}

const selectedPath = computed(() => {
  if (!props.modelValue) {
    return ''
  }

  const parts: string[] = []
  let current = flatItems.value.find((item) => item.id === props.modelValue)

  while (current) {
    parts.unshift(formatOrgUnitLabel(current))
    current = current.parent_id
      ? flatItems.value.find((item) => item.id === current?.parent_id)
      : undefined
  }

  return parts.join(' › ')
})

const treeItems = computed<OrgUnitNode[]>(() => flatItems.value.map((item) => ({
  id: item.id,
  code: item.code,
  name: formatOrgUnitLabel(item),
  parent_id: item.parent_id,
  category: item.category,
})))

const fetchOrgUnits = async () => {
  loading.value = true
  const resp = await apiFetch<{ items: OrgUnitItem[] }>('/org-units', {
    query: { page: 1, paginate: 1000 },
  })

  if (resp.success && resp.data) {
    flatItems.value = resp.data.items ?? []
  }

  loading.value = false
}

onMounted(() => {
  fetchOrgUnits()
})

defineExpose({ fetchOrgUnits })
</script>

<template>
  <div class="grid gap-2">
    <div
      v-if="loading"
      class="text-sm text-muted-foreground"
    >
      {{ t('common.loading') }}
    </div>
    <SearchableTreeSelect
      :model-value="modelValue"
      :items="treeItems"
      :placeholder="placeholder ?? t('company.selectOrganizationUnit')"
      :display-value="selectedPath"
      :disabled="loading"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
