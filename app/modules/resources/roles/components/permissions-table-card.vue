<script setup lang="ts">
import type { PermissionItem } from '../types'

defineOptions({ name: 'PermissionsTableCard' })

defineProps<{
  query: string
  error: unknown
  pending: boolean
  permissions: PermissionItem[]
  skeletonRows: number
  currentPage: number
  lastPage: number
}>()

const emit = defineEmits<{
  previousPage: []
  nextPage: []
  'update:query': [value: string]
}>()

const { t } = useLocale()
</script>

<template>
  <Card
    data-testid="permissions-table-card"
    class="overflow-hidden rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.82)]"
  >
    <CardHeader class="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
      <div class="space-y-1">
        <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {{ t('ui.rolesAndPermissions') }}
        </div>
        <CardTitle>{{ t('ui.permissions') }}</CardTitle>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('ui.permissionsAreSetByTheSystemAndCanOnlyBeViewedHere') }}
      </p>
    </CardHeader>
    <CardContent class="pt-5">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          data-testid="permissions-table-search"
          :model-value="query"
          :placeholder="t('ui.searchPermissions')"
          class="h-11 w-56 rounded-2xl border-border/80 bg-background/90 shadow-sm"
          @update:model-value="emit('update:query', String($event))"
        />
      </div>
      <div
        v-if="error"
        data-testid="permissions-table-error"
        class="text-sm text-destructive"
      >
        {{ t('ui.failedToLoadPermissions') }}
      </div>
      <div v-else>
        <div class="overflow-hidden rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.46))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.56),rgba(2,6,23,0.24))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('ui.name') }}</TableHead>
                <TableHead>{{ t('ui.description') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="pending">
                <TableRow
                  v-for="index in skeletonRows"
                  :key="`permission-table-skeleton-${index}`"
                  data-testid="permissions-table-skeleton-row"
                >
                  <TableCell>
                    <div class="h-4 w-32 rounded bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div class="h-4 w-56 rounded bg-muted/70 animate-pulse" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow
                  v-for="permission in permissions"
                  :key="permission.id"
                  :data-testid="`permissions-table-row-${permission.id}`"
                >
                  <TableCell>{{ permission.name }}</TableCell>
                  <TableCell>{{ permission.description }}</TableCell>
                </TableRow>
                <TableRow v-if="permissions.length === 0">
                  <TableCell
                    colspan="2"
                    data-testid="permissions-table-empty"
                    class="py-10 text-center text-muted-foreground"
                  >
                    {{ t('ui.noPermissionsAvailable') }}
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 bg-muted/10 px-6 py-4 text-sm">
      <div class="text-muted-foreground">
        {{ t('ui.page') }} {{ currentPage }} {{ t('ui.of') }} {{ lastPage }}
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="rounded-xl"
          data-testid="permissions-table-previous"
          :disabled="currentPage === 1"
          @click="emit('previousPage')"
        >
          {{ t('ui.previous') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="rounded-xl"
          data-testid="permissions-table-next"
          :disabled="currentPage >= lastPage"
          @click="emit('nextPage')"
        >
          {{ t('ui.next') }}
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>
