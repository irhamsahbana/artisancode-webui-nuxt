<script setup lang="ts">
import { computed } from 'vue'
import {
  buildAttendanceLogDetailSummary,
  createAttendanceLogDetailSections,
  getAttendanceLogSectionEntries,
} from './attendance-log-detail'
import {
  formatDetailValue as formatAttendanceLogDetailValue,
  getMapEmbedUrl,
  getMapsUrl,
  getSelfieUrl,
  hasLocationCoordinates,
  hasSelfie,
} from './attendance-log-format'
import type { AttendanceLogRow } from './types'

const props = defineProps<{
  row: AttendanceLogRow | null | undefined
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  openSelfie: [row: AttendanceLogRow | null | undefined]
}>()

const { t } = useLocale()
const { formatDateOnly: formatDateOnlyLabel, formatDateTime } = useDateTime()

const formatTimestamp = (value: string | null | undefined) => {
  return formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatAttendanceDate = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return formatDateOnlyLabel(value, {
    dateStyle: 'full',
  }, value)
}

const formatDetailValue = (key: string, value: unknown) => {
  return formatAttendanceLogDetailValue(key, value, {
    formatAttendanceDate,
    formatTimestamp,
    availableLabel: t('ui.available'),
  })
}

const detailSummary = computed(() => buildAttendanceLogDetailSummary(props.row, {
  t,
  formatAttendanceDate,
  formatDetailValue,
}))

const detailSections = computed(() => createAttendanceLogDetailSections(t))

const getSectionEntries = (fields: string[]) => {
  return getAttendanceLogSectionEntries(props.row, fields, {
    t,
    formatDetailValue,
  })
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:px-6 sm:py-8"
    data-testid="attendance-log-detail-dialog"
    @click.self="emit('close')"
  >
    <div class="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl">
      <div class="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div class="min-w-0">
          <div class="text-lg font-semibold sm:text-xl">
            {{ t('ui.attendanceLogDetail') }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ t('ui.reviewTheAttendanceRecordWithACleanerSummarySupportingContextAndPhotoProof') }}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-testid="attendance-log-detail-close"
          @click="emit('close')"
        >
          {{ t('ui.close') }}
        </Button>
      </div>

      <div class="grid max-h-[calc(90vh-73px)] gap-0 overflow-auto lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-5 px-5 py-5 sm:px-6">
          <div
            v-if="loading"
            class="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground"
            data-testid="attendance-log-detail-loading"
          >
            {{ t('ui.loadingAttendanceDetail') }}
          </div>

          <template v-else>
            <div class="rounded-2xl border bg-muted/20 p-4 sm:p-5">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="space-y-2">
                  <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('ui.attendanceSummary') }}
                  </div>
                  <div class="text-xl font-semibold leading-tight">
                    {{ String(row?.employee_name ?? t('ui.unknownEmployee')) }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ String(row?.employee_no ?? '-') }}
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    class="rounded-full px-3 py-1 text-xs"
                  >
                    {{ formatDetailValue('type', row?.type) }}
                  </Badge>
                  <Badge
                    variant="outline"
                    class="rounded-full px-3 py-1 text-xs"
                  >
                    {{ formatDetailValue('status', row?.status) }}
                  </Badge>
                  <Badge
                    variant="outline"
                    class="rounded-full px-3 py-1 text-xs"
                  >
                    {{ formatDetailValue('source', row?.source) }}
                  </Badge>
                </div>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  v-for="item in detailSummary"
                  :key="item.key"
                  class="rounded-xl border bg-background px-4 py-3"
                >
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {{ item.label }}
                  </div>
                  <div class="mt-1 text-sm font-medium leading-snug">
                    {{ item.value }}
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="section in detailSections"
                :key="section.id"
                class="rounded-2xl border bg-background p-4 sm:p-5"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold">
                      {{ section.title }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ section.description }}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    class="rounded-full px-2.5 py-1 text-[11px]"
                  >
                    {{ getSectionEntries(section.fields).length }}
                  </Badge>
                </div>

                <div
                  v-if="getSectionEntries(section.fields).length === 0"
                  class="mt-4 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground"
                  data-testid="attendance-log-section-empty"
                >
                  {{ t('ui.noDataAvailableInThisSection') }}
                </div>

                <div
                  v-else
                  class="mt-4 grid gap-3"
                >
                  <div
                    v-for="entry in getSectionEntries(section.fields)"
                    :key="entry.key"
                    class="grid gap-2 rounded-xl border bg-muted/20 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start"
                  >
                    <div class="text-sm font-medium text-muted-foreground">
                      {{ entry.label }}
                    </div>
                    <div
                      class="break-words text-sm leading-6 text-foreground"
                      :class="entry.multiline ? 'whitespace-pre-wrap' : ''"
                    >
                      {{ entry.value }}
                    </div>
                  </div>
                </div>

                <div
                  v-if="section.id === 'location' && hasLocationCoordinates(row)"
                  class="mt-4 space-y-3"
                  data-testid="attendance-log-location-map"
                >
                  <div class="overflow-hidden rounded-2xl border bg-background">
                    <iframe
                      :src="getMapEmbedUrl(row)"
                      class="h-64 w-full"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                      :title="t('ui.attendanceLocationMap')"
                    />
                  </div>

                  <div class="flex justify-end">
                    <a
                      :href="getMapsUrl(row)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                      data-testid="attendance-log-open-map"
                    >
                      {{ t('ui.openCoordinatesInMaps') }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="border-t bg-muted/10 px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
          <div class="sticky top-0 space-y-4">
            <div>
              <div class="text-sm font-semibold">
                {{ t('ui.photoProof') }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('ui.useThePhotoToQuicklyVerifyThatTheRecordMatchesTheEmployeeSubmission') }}
              </div>
            </div>

            <div
              v-if="loading"
              class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground"
              data-testid="attendance-log-photo-loading"
            >
              {{ t('ui.loadingPhoto') }}
            </div>
            <div
              v-else-if="hasSelfie(row)"
              class="space-y-4"
              data-testid="attendance-log-photo-proof"
            >
              <div class="overflow-hidden rounded-2xl border bg-white">
                <img
                  :src="getSelfieUrl(row)"
                  alt="Attendance photo proof"
                  class="max-h-[52vh] w-full object-contain"
                >
              </div>

              <div class="grid gap-3">
                <div class="rounded-xl border bg-background px-4 py-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {{ t('ui.photoStatus') }}
                  </div>
                  <div class="mt-1 text-sm font-medium">
                    {{ t('ui.available') }}
                  </div>
                </div>

                <Button
                  variant="outline"
                  class="w-full"
                  data-testid="attendance-log-open-selfie"
                  @click="emit('openSelfie', row)"
                >
                  {{ t('ui.openFullSize') }}
                </Button>
              </div>
            </div>
            <div
              v-else
              class="rounded-2xl border border-dashed bg-background p-6 text-sm text-muted-foreground"
              data-testid="attendance-log-photo-empty"
            >
              {{ t('ui.noPhotoProofIsAttachedToThisAttendanceLog') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
