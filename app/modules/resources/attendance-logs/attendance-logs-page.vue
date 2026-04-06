<script setup lang="ts">
defineOptions({ name: 'AttendanceLogsPage' })

const route = useRoute()

const getSelfieUrl = (row: Record<string, unknown> | null | undefined) => {
  if (!row) {
    return ''
  }

  const value = row.selfie_url
  return typeof value === 'string' ? value : ''
}

const hasSelfie = (row: Record<string, unknown> | null | undefined) => getSelfieUrl(row).length > 0

const openSelfie = (row: Record<string, unknown> | null | undefined) => {
  const url = getSelfieUrl(row)
  if (!url || !import.meta.client) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

const columns = [
  { key: 'employee_no', label: 'Employee No' },
  { key: 'employee_name', label: 'Employee Name' },
  {
    key: 'type',
    label: 'Type',
    format: (value: unknown) => String(value ?? '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase()),
  },
  {
    key: 'source',
    label: 'Source',
    format: (value: unknown) => String(value ?? '').replace(/\b\w/g, char => char.toUpperCase()),
  },
  { key: 'attendance_date', label: 'Date' },
  {
    key: 'logged_at',
    label: 'Logged At',
    format: (value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) {
        return '-'
      }
      return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    },
  },
  {
    key: 'selfie_url',
    label: 'Photo Proof',
    format: (value: unknown) => (typeof value === 'string' && value.length > 0 ? 'Available' : '-'),
  },
]

const listQuery = computed(() => {
  const query = route.query
  const result: Record<string, string> = {}

  const supportedKeys = ['attendance_date', 'date_from', 'date_to', 'type', 'source', 'employee_id']
  for (const key of supportedKeys) {
    const value = query[key]
    if (typeof value === 'string' && value.length > 0) {
      result[key] = value
    }
  }

  return result
})
</script>

<template>
  <ResourceList
    title="Attendance Logs"
    endpoint="/attendance-logs"
    :extra-query="listQuery"
    :columns="columns"
    loading-variant="skeleton"
    :can-delete="false"
  >
    <template #row-actions="{ row, close }">
      <button
        v-if="hasSelfie(row)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="openSelfie(row); close()"
      >
        View Photo
      </button>
    </template>

    <template #detail="{ row, loading, close, entries, formatValue }">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
        @click.self="close"
      >
        <div class="w-full max-w-5xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-lg font-semibold">
                Attendance Log Detail
              </div>
              <div class="text-sm text-muted-foreground">
                Review the attendance record and its photo proof.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="close"
            >
              Close
            </Button>
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="rounded-xl border bg-muted/20 p-4">
              <div class="text-sm font-medium">
                Photo Proof
              </div>
              <div
                v-if="loading"
                class="mt-4 text-sm text-muted-foreground"
              >
                Loading photo...
              </div>
              <div
                v-else-if="hasSelfie(row)"
                class="mt-4 space-y-4"
              >
                <img
                  :src="getSelfieUrl(row)"
                  alt="Attendance photo proof"
                  class="max-h-[60vh] w-full rounded-lg border object-contain bg-white"
                >
                <div class="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    @click="openSelfie(row)"
                  >
                    Open Full Size
                  </Button>
                </div>
              </div>
              <div
                v-else
                class="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
              >
                No photo proof is attached to this attendance log.
              </div>
            </div>

            <div class="rounded-xl border p-4">
              <div class="text-sm font-medium">
                Record Details
              </div>
              <div class="mt-4 max-h-[60vh] overflow-auto text-sm">
                <div
                  v-if="loading"
                  class="text-muted-foreground"
                >
                  Loading...
                </div>
                <div
                  v-else-if="entries.length === 0"
                  class="text-muted-foreground"
                >
                  No detail available.
                </div>
                <div
                  v-else
                  class="space-y-3"
                >
                  <div
                    v-for="[key, value] in entries"
                    :key="String(key)"
                    class="grid grid-cols-[120px_minmax(0,1fr)] gap-3"
                  >
                    <div class="break-words text-muted-foreground">
                      {{ key }}
                    </div>
                    <div class="break-words">
                      {{ formatValue(value) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ResourceList>
</template>
