<script setup lang="ts">
import RolePermissionPicker from './role-permission-picker.vue'
import type { PermissionItem } from '../types'

defineOptions({ name: 'RoleCreateDialog' })

defineProps<{
  open: boolean
  loading: boolean
  roleName: string
  selectedPermissionIds: string[]
  permissions: PermissionItem[]
  permissionsLoading: boolean
  permissionQuery: string
  permissionSkeletonRows: number
  showPagination: boolean
  currentPage: number
  lastPage: number
}>()

const emit = defineEmits<{
  close: []
  submit: []
  togglePermission: [id: string]
  previousPage: []
  nextPage: []
  'update:roleName': [value: string]
  'update:permissionQuery': [value: string]
}>()

const { t } = useLocale()
</script>

<template>
  <div
    v-if="open"
    data-testid="role-create-dialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
  >
    <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ t('ui.createRole') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          data-testid="role-create-close"
          :disabled="loading"
          @click="emit('close')"
        >
          {{ t('ui.close') }}
        </Button>
      </div>
      <div class="mt-4 grid gap-4">
        <div class="grid gap-2">
          <Label for="role-name">{{ t('ui.roleName') }}</Label>
          <Input
            id="role-name"
            data-testid="role-name-input"
            :model-value="roleName"
            :placeholder="t('ui.roleName')"
            @update:model-value="emit('update:roleName', String($event))"
          />
        </div>
        <div class="grid gap-2">
          <Label>{{ t('ui.permissions') }}</Label>
          <RolePermissionPicker
            :query="permissionQuery"
            :permissions="permissions"
            :selected-ids="selectedPermissionIds"
            :loading="permissionsLoading"
            :skeleton-rows="permissionSkeletonRows"
            @update:query="emit('update:permissionQuery', $event)"
            @toggle-permission="emit('togglePermission', $event)"
          />
          <div
            v-if="showPagination"
            class="flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm"
          >
            <div class="text-muted-foreground">
              {{ t('ui.page') }} {{ currentPage }} {{ t('ui.of') }} {{ lastPage }}
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="role-create-previous"
                :disabled="currentPage === 1"
                @click="emit('previousPage')"
              >
                {{ t('ui.previous') }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="role-create-next"
                :disabled="currentPage >= lastPage"
                @click="emit('nextPage')"
              >
                {{ t('ui.next') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="role-create-cancel"
          :disabled="loading"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          data-testid="role-create-submit"
          :disabled="loading"
          @click="emit('submit')"
        >
          {{ loading ? t('ui.saving') : t('ui.createRole') }}
        </Button>
      </div>
    </div>
  </div>
</template>
