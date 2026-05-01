<script setup lang="ts">
import type { OrgUnitOption } from './org-unit-form-config'

defineOptions({ name: 'OrgUnitDetailForm' })

const props = defineProps<{
  name: string
  category: string
  parentId: string
  categoryOptions: OrgUnitOption[]
  parentOptions: OrgUnitOption[]
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:category': [value: string]
  'update:parentId': [value: string]
}>()
</script>

<template>
  <div class="grid max-w-xl gap-4">
    <div class="grid gap-2">
      <Label for="org-name">Name</Label>
      <Input
        id="org-name"
        :model-value="props.name"
        placeholder="Org Unit Name"
        @update:model-value="emit('update:name', String($event))"
      />
    </div>

    <div class="grid gap-2">
      <Label for="org-category">Category</Label>
      <SearchableSelect
        id="org-category"
        :model-value="props.category"
        :options="props.categoryOptions"
        placeholder="Select category"
        @update:model-value="emit('update:category', String($event))"
      />
    </div>

    <div class="grid gap-2">
      <Label for="org-parent">Parent Org Unit (Optional)</Label>
      <SearchableSelect
        id="org-parent"
        :model-value="props.parentId"
        :options="props.parentOptions"
        placeholder="Select parent org unit"
        @update:model-value="emit('update:parentId', String($event))"
      />
    </div>
  </div>
</template>
