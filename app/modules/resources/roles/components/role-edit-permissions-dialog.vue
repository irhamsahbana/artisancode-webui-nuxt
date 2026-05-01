<script setup lang="ts">
import RolePermissionPicker from './role-permission-picker.vue'
import type { PermissionItem } from '../types'

defineOptions({ name: 'RoleEditPermissionsDialog' })

defineProps<{
  loading: boolean
  saving: boolean
  permissions: PermissionItem[]
  selectedPermissionIds: string[]
  permissionQuery: string
}>()

const emit = defineEmits<{
  close: []
  save: []
  togglePermission: [id: string]
  'update:permissionQuery': [value: string]
}>()

const { t } = useLocale()
</script>

<template>
  <div
    data-testid="role-edit-permissions-dialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-5xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ t('ui.editRolePermissions') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          data-testid="role-edit-close"
          :disabled="saving || loading"
          @click="emit('close')"
        >
          {{ t('ui.close') }}
        </Button>
      </div>
      <div class="mt-4 max-h-[70vh] overflow-auto">
        <div class="grid gap-4 text-sm">
          <div
            v-if="loading"
            class="text-muted-foreground"
          >
            {{ t('ui.loading2') }}
          </div>
          <div
            v-else
            class="grid gap-4"
          >
            <div class="grid gap-2">
              <Label>{{ t('ui.permissions') }}</Label>
              <RolePermissionPicker
                :query="permissionQuery"
                :permissions="permissions"
                :selected-ids="selectedPermissionIds"
                @update:query="emit('update:permissionQuery', $event)"
                @toggle-permission="emit('togglePermission', $event)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="role-edit-cancel"
          :disabled="saving || loading"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          data-testid="role-edit-save"
          :disabled="saving || loading"
          @click="emit('save')"
        >
          {{ saving ? t('ui.saving') : t('ui.saveChanges') }}
        </Button>
      </div>
    </div>
  </div>
</template>
