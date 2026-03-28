<script setup lang="ts">
defineOptions({ name: 'AttendanceLogsPage' })

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
]
</script>

<template>
  <ResourceList
    title="Attendance Logs"
    endpoint="/attendance-logs"
    :columns="columns"
    loading-variant="skeleton"
    :can-delete="false"
  />
</template>
