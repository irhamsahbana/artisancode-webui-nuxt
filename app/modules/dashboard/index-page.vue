<script setup lang="ts">
defineOptions({ name: 'IndexPage' })

type DashboardSummary = {
  active_employee_count: number
  checked_in_count: number
  checked_out_count: number
  pending_check_in_count: number
  pending_check_out_count: number
  late_check_in_count: number
}

type DashboardException = {
  employee_id: string
  employee_no: string
  employee_name: string
  shift_name: string | null
  first_check_in_at: string | null
  last_check_out_at: string | null
  exception_type: 'late_check_in' | 'missing_check_in' | 'missing_check_out'
}

type DashboardTrendDay = {
  attendance_date: string
  checked_in_count: number
  checked_out_count: number
  late_check_in_count: number
  missing_check_out_count: number
}

type DashboardPayload = {
  attendance_date: string
  summary: DashboardSummary
  today_exceptions: DashboardException[]
  daily_trend: DashboardTrendDay[]
}

const cards = [
  { label: 'Users', href: '/resources/users' },
  { label: 'Companies', href: '/resources/companies' },
  { label: 'Employees', href: '/resources/employees' },
  { label: 'Attendance Logs', href: '/resources/attendance-logs' },
  { label: 'Work Locations', href: '/resources/work-locations' },
  { label: 'Work Shifts', href: '/resources/work-shifts' },
  { label: 'Job Positions', href: '/resources/job-positions' },
  { label: 'Roles & Permissions', href: '/resources/roles' },
]

const trendOptions = [7, 14, 30] as const
const { user } = useAuth()
const { apiFetch } = useApi()

const today = (() => {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
})()
const selectedDate = ref(today)
const trendDays = ref<(typeof trendOptions)[number]>(7)

const canSeeOwnerDashboard = computed(() => {
  const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
  return roles.includes('owner') || roles.includes('admin')
})

const { data, pending, refresh, error } = await useAsyncData(
  'owner-attendance-dashboard',
  async () => {
    if (!canSeeOwnerDashboard.value) {
      return null
    }

    const response = await apiFetch<DashboardPayload>('/attendance-summary/owner-dashboard', {
      query: {
        date: selectedDate.value,
        trend_days: trendDays.value,
      },
    })

    return response.success ? response.data : null
  },
  { server: false, default: () => null },
)

watch([selectedDate, trendDays, canSeeOwnerDashboard], () => {
  refresh()
})

const dashboard = computed(() => data.value)
const summary = computed<DashboardSummary>(() => dashboard.value?.summary ?? {
  active_employee_count: 0,
  checked_in_count: 0,
  checked_out_count: 0,
  pending_check_in_count: 0,
  pending_check_out_count: 0,
  late_check_in_count: 0,
})

const exceptionRows = computed(() => dashboard.value?.today_exceptions ?? [])
const trendRows = computed(() => dashboard.value?.daily_trend ?? [])

const metricCards = computed(() => [
  { label: 'Active Employees', value: summary.value.active_employee_count, tone: 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100' },
  { label: 'Checked In', value: summary.value.checked_in_count, tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' },
  { label: 'Checked Out', value: summary.value.checked_out_count, tone: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100' },
  { label: 'Pending Check In', value: summary.value.pending_check_in_count, tone: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100' },
  { label: 'Pending Check Out', value: summary.value.pending_check_out_count, tone: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100' },
  { label: 'Late Check In', value: summary.value.late_check_in_count, tone: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100' },
])

const maxTrendValue = computed(() => {
  return Math.max(
    1,
    ...trendRows.value.flatMap(day => [
      day.checked_in_count,
      day.checked_out_count,
      day.late_check_in_count,
      day.missing_check_out_count,
    ]),
  )
})

const formatShortDate = (value: string) => {
  if (!value) {
    return '-'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  })
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const exceptionLabelMap: Record<DashboardException['exception_type'], string> = {
  late_check_in: 'Late check in',
  missing_check_in: 'Missing check in',
  missing_check_out: 'Missing check out',
}

const exceptionToneMap: Record<DashboardException['exception_type'], string> = {
  late_check_in: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
  missing_check_in: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  missing_check_out: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
}

const buildLogLink = (params: Record<string, string>) => ({
  path: '/resources/attendance-logs',
  query: params,
})
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="canSeeOwnerDashboard"
      class="space-y-6"
    >
      <Card class="overflow-hidden border-none bg-gradient-to-br from-amber-100 via-white to-sky-100 shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-slate-900">
        <CardContent class="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <div class="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-foreground/80 dark:bg-white/10">
              Owner Attendance Dashboard
            </div>
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold tracking-tight">
                Attendance overview for {{ dashboard?.attendance_date ?? selectedDate }}
              </h1>
              <p class="max-w-2xl text-sm text-muted-foreground">
                Keep an eye on today’s attendance health, follow short-term trends, and jump into attendance logs when the team needs closer audit.
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="attendance-date">Attendance Date</Label>
              <Input
                id="attendance-date"
                v-model="selectedDate"
                type="date"
              />
            </div>
            <div class="space-y-2">
              <Label for="trend-days">Trend Window</Label>
              <select
                id="trend-days"
                v-model.number="trendDays"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option
                  v-for="option in trendOptions"
                  :key="option"
                  :value="option"
                >
                  Last {{ option }} days
                </option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card
          v-for="item in metricCards"
          :key="item.label"
          class="border-none shadow-sm"
        >
          <CardContent class="space-y-4 p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="text-sm text-muted-foreground">
                {{ item.label }}
              </div>
              <div
                class="rounded-full px-2.5 py-1 text-xs font-medium"
                :class="item.tone"
              >
                Live
              </div>
            </div>
            <div class="text-3xl font-semibold tracking-tight">
              <span
                v-if="pending"
                class="animate-pulse text-muted-foreground"
              >...</span>
              <span v-else>{{ item.value }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card class="shadow-sm">
          <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
            <div class="space-y-1">
              <CardTitle>Attendance Trend</CardTitle>
              <p class="text-sm text-muted-foreground">
                Checked in, checked out, late check in, and missing check out counts for the last {{ trendDays }} days.
              </p>
            </div>
            <NuxtLink :to="buildLogLink({ date_from: selectedDate, date_to: selectedDate })">
              <Button
                variant="outline"
                size="sm"
              >
                Open Logs
              </Button>
            </NuxtLink>
          </CardHeader>
          <CardContent>
            <div
              v-if="pending"
              class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="item in 6"
                :key="item"
                class="h-36 animate-pulse rounded-xl bg-muted"
              />
            </div>
            <div
              v-else-if="trendRows.length === 0"
              class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground"
            >
              No trend data is available yet for the selected period.
            </div>
            <div
              v-else
              class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="day in trendRows"
                :key="day.attendance_date"
                class="rounded-2xl border bg-muted/20 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-medium">
                    {{ formatShortDate(day.attendance_date) }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ day.attendance_date }}
                  </div>
                </div>

                <div class="mt-4 space-y-3">
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span>Checked in</span>
                      <span>{{ day.checked_in_count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-muted">
                      <div
                        class="h-2 rounded-full bg-emerald-500"
                        :style="{ width: `${(day.checked_in_count / maxTrendValue) * 100}%` }"
                      />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span>Checked out</span>
                      <span>{{ day.checked_out_count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-muted">
                      <div
                        class="h-2 rounded-full bg-sky-500"
                        :style="{ width: `${(day.checked_out_count / maxTrendValue) * 100}%` }"
                      />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span>Late</span>
                      <span>{{ day.late_check_in_count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-muted">
                      <div
                        class="h-2 rounded-full bg-rose-500"
                        :style="{ width: `${(day.late_check_in_count / maxTrendValue) * 100}%` }"
                      />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span>Missing checkout</span>
                      <span>{{ day.missing_check_out_count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-muted">
                      <div
                        class="h-2 rounded-full bg-orange-500"
                        :style="{ width: `${(day.missing_check_out_count / maxTrendValue) * 100}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-sm">
          <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
            <div class="space-y-1">
              <CardTitle>Needs Attention Today</CardTitle>
              <p class="text-sm text-muted-foreground">
                Team members who are missing attendance actions or checked in late.
              </p>
            </div>
            <NuxtLink :to="buildLogLink({ attendance_date: selectedDate })">
              <Button
                variant="outline"
                size="sm"
              >
                Audit Today
              </Button>
            </NuxtLink>
          </CardHeader>
          <CardContent class="space-y-4">
            <div
              v-if="pending"
              class="space-y-3"
            >
              <div
                v-for="item in 5"
                :key="item"
                class="h-20 animate-pulse rounded-xl bg-muted"
              />
            </div>
            <div
              v-else-if="exceptionRows.length === 0"
              class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground"
            >
              No attendance exceptions for the selected day.
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="item in exceptionRows"
                :key="`${item.employee_id}-${item.exception_type}`"
                class="rounded-2xl border p-4"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-1">
                    <div class="font-medium">
                      {{ item.employee_name }}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{ item.employee_no }}<span v-if="item.shift_name"> • {{ item.shift_name }}</span>
                    </div>
                  </div>
                  <div
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="exceptionToneMap[item.exception_type]"
                  >
                    {{ exceptionLabelMap[item.exception_type] }}
                  </div>
                </div>

                <div class="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    First check in: {{ formatDateTime(item.first_check_in_at) }}
                  </div>
                  <div>
                    Last check out: {{ formatDateTime(item.last_check_out_at) }}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card class="shadow-sm">
        <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
          <div class="space-y-1">
            <CardTitle>Quick Actions</CardTitle>
            <p class="text-sm text-muted-foreground">
              Use the owner dashboard as the overview, then open resource pages for deeper operations.
            </p>
          </div>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NuxtLink
            :to="buildLogLink({ attendance_date: selectedDate })"
            class="rounded-2xl border bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <div class="text-sm font-medium">
              Attendance Logs
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              Review detailed logs for {{ selectedDate }}.
            </div>
          </NuxtLink>
          <NuxtLink
            :to="buildLogLink({ attendance_date: selectedDate, type: 'check_in' })"
            class="rounded-2xl border bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <div class="text-sm font-medium">
              Check-in Records
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              Focus on arrival records for the selected day.
            </div>
          </NuxtLink>
          <NuxtLink
            to="/resources/employees"
            class="rounded-2xl border bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <div class="text-sm font-medium">
              Employees
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              Manage employee profile and attendance assignments.
            </div>
          </NuxtLink>
          <NuxtLink
            to="/resources/work-shifts"
            class="rounded-2xl border bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <div class="text-sm font-medium">
              Work Shifts
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              Review shift timing and grace periods.
            </div>
          </NuxtLink>
        </CardContent>
      </Card>
    </div>

    <Card v-else>
      <CardHeader>
        <CardTitle>API Dashboard</CardTitle>
        <p class="text-sm text-muted-foreground">
          Quick access to the main API resources.
        </p>
      </CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="card in cards"
          :key="card.href"
        >
          <CardContent class="flex items-center justify-between">
            <div class="text-sm font-medium">
              {{ card.label }}
            </div>
            <NuxtLink :to="card.href">
              <Button
                variant="ghost"
                size="sm"
              >
                Open
              </Button>
            </NuxtLink>
          </CardContent>
        </Card>
      </CardContent>
    </Card>

    <Card
      v-if="canSeeOwnerDashboard && error"
      class="border-destructive/40"
    >
      <CardContent class="p-5 text-sm text-muted-foreground">
        The dashboard could not be refreshed just now. Please try again or inspect the attendance logs directly.
      </CardContent>
    </Card>
  </div>
</template>
