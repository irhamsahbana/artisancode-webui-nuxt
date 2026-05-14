<script setup lang="ts">
import { getExportStatusVariant, toTitleCase } from './attendance-log-format'
import type { ExportJob } from './types'

defineOptions({ name: 'AttendanceLogExportsCard' })

defineProps<{
  loading: boolean
  items: ExportJob[]
  completedCount: number
  pendingCount: number
  formatTimestamp: (value: string | null | undefined) => string
}>()

const emit = defineEmits<{
  refresh: []
  download: [item: ExportJob]
}>()

const { t } = useLocale()
</script>

<template>
  <Card class="overflow-hidden border-slate-200/80 shadow-[0_20px_60px_-52px_rgba(15,23,42,0.8)] dark:border-slate-700/80 dark:bg-slate-950">
    <CardHeader class="flex flex-col gap-4 border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] dark:border-slate-700/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <CardTitle>{{ t('ui.recentExports') }}</CardTitle>
          <Badge
            variant="secondary"
            class="rounded-full px-3 py-1 text-xs"
          >
            {{ items.length }}
          </Badge>
        </div>
        <p class="text-sm leading-6 text-muted-foreground dark:text-slate-300">
          {{ t('ui.exportsFollowTheActiveFiltersAtTheTimeTheRequestIsCreatedAndWillAppearHereOnceTheFileIsReadyToDownload') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          class="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
        >
          {{ completedCount }} {{ t('ui.readyFiles') }}
        </Badge>
        <Badge
          variant="outline"
          class="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
        >
          {{ pendingCount }} {{ t('ui.inQueue') }}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          class="rounded-full px-4"
          data-testid="attendance-exports-refresh"
          :disabled="loading"
          @click="emit('refresh')"
        >
          {{ t('ui.refresh') }}
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4 pt-5">
      <div
        v-if="loading && items.length === 0"
        data-testid="attendance-exports-loading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loadingRecentExports') }}
      </div>

      <div
        v-else-if="items.length === 0"
        data-testid="attendance-exports-empty"
        class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
      >
        {{ t('ui.noExportRequestsYetStartOneFromTheExportButtonAbove') }}
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="item in items"
          :key="item.id"
          :data-testid="`attendance-export-item-${item.id}`"
          class="rounded-3xl border p-4 transition hover:border-slate-300 hover:shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)] dark:hover:border-slate-600 dark:hover:shadow-[0_20px_48px_-36px_rgba(0,0,0,0.95)]"
          :class="item.status === 'completed'
            ? 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.85),rgba(255,255,255,0.98))] dark:border-emerald-900/70 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.34),rgba(2,6,23,0.94))]'
            : item.status === 'failed' || item.status === 'expired'
              ? 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.85),rgba(255,255,255,0.98))] dark:border-rose-900/70 dark:bg-[linear-gradient(180deg,rgba(127,29,29,0.3),rgba(2,6,23,0.94))]'
              : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.98))] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.84),rgba(2,6,23,0.94))]'"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <Badge
                  :variant="getExportStatusVariant(item.status)"
                  class="rounded-full px-3 py-1"
                >
                  {{ toTitleCase(item.status) }}
                </Badge>
                <Badge
                  variant="secondary"
                  class="rounded-full px-3 py-1"
                >
                  {{ item.format.toUpperCase() }}
                </Badge>
                <span class="text-sm font-medium dark:text-slate-100">
                  {{ item.requested_by_name }}
                </span>
              </div>

              <div class="grid gap-2 text-sm text-muted-foreground dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                    {{ t('ui.requested') }}
                  </div>
                  <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ formatTimestamp(item.created_at) }}
                  </div>
                </div>
                <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                    {{ t('ui.started') }}
                  </div>
                  <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ formatTimestamp(item.started_at) }}
                  </div>
                </div>
                <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                    {{ t('ui.completed') }}
                  </div>
                  <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ formatTimestamp(item.completed_at) }}
                  </div>
                </div>
                <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                    {{ t('ui.expires') }}
                  </div>
                  <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ formatTimestamp(item.expires_at) }}
                  </div>
                </div>
              </div>

              <p
                v-if="item.error_message"
                class="text-sm text-destructive"
              >
                {{ item.error_message }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                v-if="item.download_url"
                size="sm"
                class="rounded-full px-4"
                :data-testid="`attendance-export-download-${item.id}`"
                @click="emit('download', item)"
              >
                {{ t('ui.download') }}
              </Button>
              <span
                v-else
                :data-testid="`attendance-export-waiting-${item.id}`"
                class="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
              >
                {{ item.status === 'failed' ? t('ui.generationFailed') : t('ui.waitingForFile') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
