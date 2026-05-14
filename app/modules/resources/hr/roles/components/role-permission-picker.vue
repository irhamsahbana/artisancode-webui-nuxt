<script setup lang="ts">
import type { PermissionItem } from '../types'

defineOptions({ name: 'RolePermissionPicker' })

withDefaults(
  defineProps<{
    permissions: PermissionItem[]
    selectedIds: string[]
    loading?: boolean
    skeletonRows?: number
  }>(),
  {
    loading: false,
    skeletonRows: 1,
  },
)

const query = defineModel<string>('query', { required: true })

const emit = defineEmits<{
  togglePermission: [id: string]
}>()

const { t } = useLocale()
</script>

<template>
  <div class="grid gap-2">
    <Input
      v-model="query"
      data-testid="permission-search"
      :placeholder="t('ui.searchPermissions')"
    />
    <div
      class="max-h-72 overflow-auto rounded-md border p-2"
      :class="loading ? 'pointer-events-none opacity-60' : ''"
    >
      <div
        v-if="loading"
        class="grid gap-2"
      >
        <div
          v-for="index in skeletonRows"
          :key="`permission-skeleton-${index}`"
          class="flex items-start gap-2 rounded-md px-2 py-1"
        >
          <div class="mt-1 h-4 w-4 rounded-sm bg-muted animate-pulse" />
          <div class="grid gap-1">
            <div class="h-4 w-32 rounded bg-muted animate-pulse" />
            <div class="h-3 w-44 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      </div>
      <div
        v-else-if="permissions.length === 0"
        data-testid="permission-empty"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.noPermissionsFound') }}
      </div>
      <div
        v-else
        class="grid gap-2"
      >
        <label
          v-for="permission in permissions"
          :key="permission.id"
          :data-testid="`permission-option-${permission.id}`"
          class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-accent"
        >
          <input
            :checked="selectedIds.includes(permission.id)"
            :data-testid="`permission-checkbox-${permission.id}`"
            class="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="checkbox"
            @change="emit('togglePermission', permission.id)"
          >
          <div class="grid">
            <span class="text-sm font-medium">
              {{ permission.name }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ permission.description || '-' }}
            </span>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
