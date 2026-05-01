<script setup lang="ts">
defineOptions({ name: 'InternalClientOwnerPermissionsDialog' })

type PermissionItem = {
  id: string
  name?: string
  description?: string
}

const props = withDefaults(defineProps<{
  open: boolean
  loading?: boolean
  saving?: boolean
  clientName?: string
  permissions: PermissionItem[]
  selectedPermissionIds: string[]
}>(), {
  loading: false,
  saving: false,
  clientName: '-',
})

const emit = defineEmits<{
  close: []
  save: []
  togglePermission: [permissionId: string]
}>()

const { t } = useLocale()
</script>

<template>
  <FormDialogShell
    v-if="props.open"
    max-width-class="max-w-3xl"
    :title="t('ui.editOwnerPermissions')"
    @close="emit('close')"
  >
    <div class="text-sm text-muted-foreground">
      {{ props.clientName }}
    </div>

    <div class="mt-5 max-h-[60vh] overflow-auto rounded-md border p-2">
      <div
        v-if="props.loading"
        class="grid gap-2"
      >
        <div
          v-for="index in 8"
          :key="`owner-permission-skeleton-${index}`"
          class="flex items-start gap-2 rounded-md px-2 py-1"
        >
          <div class="mt-1 h-4 w-4 rounded-sm bg-muted animate-pulse" />
          <div class="grid gap-1">
            <div class="h-4 w-36 rounded bg-muted animate-pulse" />
            <div class="h-3 w-56 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      </div>
      <div
        v-else-if="props.permissions.length === 0"
        class="px-2 py-8 text-center text-sm text-muted-foreground"
      >
        {{ t('ui.noPermissionsAvailable') }}
      </div>
      <div
        v-else
        class="grid gap-2"
      >
        <label
          v-for="permission in props.permissions"
          :key="permission.id"
          class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-accent"
        >
          <input
            :checked="props.selectedPermissionIds.includes(permission.id)"
            class="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="checkbox"
            :disabled="props.saving"
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

    <template #footer>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.saving"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="props.saving || props.loading"
          @click="emit('save')"
        >
          {{ props.saving ? t('ui.saving') : t('ui.saveChanges') }}
        </Button>
      </div>
    </template>
  </FormDialogShell>
</template>
