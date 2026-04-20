<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { localizeUiText } from '~/utils/ui-localization'

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
const { locale } = useLocale()
const { formatDateOnly, formatDateTime } = useDateTime()
const browserTimezone = ref(process.client ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '')
const uiText = (value: string) => localizeUiText(locale.value, value)
const dashboardRequestController = ref<AbortController | null>(null)

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

const { data, pending, refresh, error } = useAsyncData(
  'owner-attendance-dashboard',
  async () => {
    dashboardRequestController.value?.abort()
    dashboardRequestController.value = import.meta.client ? new AbortController() : null
    if (!canSeeOwnerDashboard.value || !browserTimezone.value) {
      return null
    }

    const response = await apiFetch<DashboardPayload>('/attendance-summary/owner-dashboard', {
      query: {
        date: selectedDate.value,
        timezone: browserTimezone.value,
        trend_days: trendDays.value,
      },
      signal: dashboardRequestController.value?.signal,
    })

    return response.success ? response.data : null
  },
  { server: false, default: () => null },
)

watch([selectedDate, trendDays, canSeeOwnerDashboard, browserTimezone], () => {
  refresh()
})

onBeforeUnmount(() => {
  dashboardRequestController.value?.abort()
})

const lastSuccessfulDashboard = ref<DashboardPayload | null>(null)
watch(
  () => data.value,
  (value) => {
    if (value) {
      lastSuccessfulDashboard.value = value
    }
  },
  { immediate: true },
)

const dashboard = computed(() => data.value ?? lastSuccessfulDashboard.value)
const showInitialSkeleton = computed(() => pending.value && !dashboard.value)
const showRefreshingState = computed(() => pending.value && !!dashboard.value)
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
  {
    label: uiText('Active Employees'),
    value: summary.value.active_employee_count,
    badgeTone: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    panelTone: 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]',
  },
  {
    label: uiText('Checked In'),
    value: summary.value.checked_in_count,
    badgeTone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    panelTone: 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] dark:border-emerald-900/70 dark:bg-[linear-gradient(180deg,rgba(6,95,70,0.3),rgba(2,6,23,0.96))]',
  },
  {
    label: uiText('Checked Out'),
    value: summary.value.checked_out_count,
    badgeTone: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
    panelTone: 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(239,249,255,0.95),rgba(255,255,255,0.98))] dark:border-sky-900/70 dark:bg-[linear-gradient(180deg,rgba(7,89,133,0.28),rgba(2,6,23,0.96))]',
  },
  {
    label: uiText('Pending Check In'),
    value: summary.value.pending_check_in_count,
    badgeTone: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    panelTone: 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,0.98))] dark:border-amber-900/70 dark:bg-[linear-gradient(180deg,rgba(146,64,14,0.28),rgba(2,6,23,0.96))]',
  },
  {
    label: uiText('Pending Check Out'),
    value: summary.value.pending_check_out_count,
    badgeTone: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
    panelTone: 'border-orange-200/80 bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,255,255,0.98))] dark:border-orange-900/70 dark:bg-[linear-gradient(180deg,rgba(154,52,18,0.28),rgba(2,6,23,0.96))]',
  },
  {
    label: uiText('Late Check In'),
    value: summary.value.late_check_in_count,
    badgeTone: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
    panelTone: 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98))] dark:border-rose-900/70 dark:bg-[linear-gradient(180deg,rgba(136,19,55,0.28),rgba(2,6,23,0.96))]',
  },
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

  return formatDateOnly(value, {
    day: '2-digit',
    month: 'short',
  })
}

const exceptionLabelMap = computed<Record<DashboardException['exception_type'], string>>(() => ({
  late_check_in: uiText('Late check in'),
  missing_check_in: uiText('Missing check in'),
  missing_check_out: uiText('Missing check out'),
}))

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
              {{ uiText('Owner Attendance Dashboard') }}
            </div>
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold tracking-tight">
                {{ uiText(`Attendance overview for ${dashboard?.attendance_date ?? selectedDate}`) }}
              </h1>
              <p class="max-w-2xl text-sm text-muted-foreground">
                {{ uiText('Keep an eye on today’s attendance health, follow short-term trends, and jump into attendance logs when the team needs closer audit.') }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ uiText('Browser timezone') }}: {{ browserTimezone || uiText('Detecting...') }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="attendance-date">{{ uiText('Attendance Date') }}</Label>
              <Input
                id="attendance-date"
                v-model="selectedDate"
                type="date"
              />
            </div>
            <div class="space-y-2">
              <Label for="trend-days">{{ uiText('Trend Window') }}</Label>
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
                  {{ uiText(`Last ${option} days`) }}
                </option>
              </select>
            </div>
            <div
              v-if="showRefreshingState"
              class="sm:col-span-2"
            >
              <div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
                {{ uiText('Refreshing attendance insights...') }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card
          v-for="item in metricCards"
          :key="item.label"
          class="overflow-hidden rounded-[26px] border shadow-[0_18px_48px_-38px_rgba(15,23,42,0.85)]"
          :class="item.panelTone"
        >
          <CardContent class="space-y-5 p-5 pt-5">
            <div class="flex items-start justify-between gap-4">
              <div class="text-sm font-medium text-foreground/72 dark:text-slate-200">
                {{ item.label }}
              </div>
              <div
                class="rounded-full px-2.5 py-1 text-xs font-medium shadow-sm"
                :class="item.badgeTone"
              >
                {{ uiText('Live') }}
              </div>
            </div>
            <div class="text-4xl font-semibold tracking-tight text-foreground dark:text-slate-50">
              <span
                v-if="showInitialSkeleton"
                class="block h-10 w-24 animate-pulse rounded-xl bg-muted"
              />
              <span v-else>{{ item.value }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card class="rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.85)]">
          <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/70 bg-muted/15">
            <div class="space-y-1">
              <CardTitle>{{ uiText('Attendance Trend') }}</CardTitle>
              <p class="text-sm text-muted-foreground">
                {{ uiText(`Checked in, checked out, late check in, and missing check out counts for the last ${trendDays} days.`) }}
              </p>
            </div>
            <NuxtLink :to="buildLogLink({ date_from: selectedDate, date_to: selectedDate })">
              <Button
                variant="outline"
                size="sm"
              >
                {{ uiText('Open Logs') }}
              </Button>
            </NuxtLink>
          </CardHeader>
          <CardContent>
            <div
              v-if="showInitialSkeleton"
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
              {{ uiText('No trend data is available yet for the selected period.') }}
            </div>
            <div
              v-else
              class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="day in trendRows"
                :key="day.attendance_date"
                class="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.85)]"
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
                      <span>{{ uiText('Checked in') }}</span>
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
                      <span>{{ uiText('Checked out') }}</span>
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
                      <span>{{ uiText('Late') }}</span>
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
                      <span>{{ uiText('Missing checkout') }}</span>
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

        <Card class="rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.85)]">
          <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/70 bg-muted/15">
            <div class="space-y-1">
              <CardTitle>{{ uiText('Needs Attention Today') }}</CardTitle>
              <p class="text-sm text-muted-foreground">
                {{ uiText('Team members who are missing attendance actions or checked in late.') }}
              </p>
            </div>
            <NuxtLink :to="buildLogLink({ attendance_date: selectedDate })">
              <Button
                variant="outline"
                size="sm"
              >
                {{ uiText('Audit Today') }}
              </Button>
            </NuxtLink>
          </CardHeader>
          <CardContent class="space-y-4">
            <div
              v-if="showInitialSkeleton"
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
              {{ uiText('No attendance exceptions for the selected day.') }}
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="item in exceptionRows"
                :key="`${item.employee_id}-${item.exception_type}`"
                class="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.8)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]"
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
                    {{ uiText('First check in') }}: {{ formatDateTime(item.first_check_in_at) }}
                  </div>
                  <div>
                    {{ uiText('Last check out') }}: {{ formatDateTime(item.last_check_out_at) }}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card class="rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.85)]">
        <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/70 bg-muted/15">
          <div class="space-y-1">
            <CardTitle>{{ uiText('Quick Actions') }}</CardTitle>
            <p class="text-sm text-muted-foreground">
              {{ uiText('Use the owner dashboard as the overview, then open resource pages for deeper operations.') }}
            </p>
          </div>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NuxtLink
            :to="buildLogLink({ attendance_date: selectedDate })"
            class="rounded-2xl border border-border/70 bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.85)]"
          >
            <div class="text-sm font-medium">
              {{ uiText('Attendance Logs') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ uiText(`Review detailed logs for ${selectedDate}.`) }}
            </div>
          </NuxtLink>
          <NuxtLink
            :to="buildLogLink({ attendance_date: selectedDate, type: 'check_in' })"
            class="rounded-2xl border border-border/70 bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.85)]"
          >
            <div class="text-sm font-medium">
              {{ uiText('Check-in Records') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ uiText('Focus on arrival records for the selected day.') }}
            </div>
          </NuxtLink>
          <NuxtLink
            to="/resources/employees"
            class="rounded-2xl border border-border/70 bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.85)]"
          >
            <div class="text-sm font-medium">
              {{ uiText('Employees') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ uiText('Manage employee profile and attendance assignments.') }}
            </div>
          </NuxtLink>
          <NuxtLink
            to="/resources/work-shifts"
            class="rounded-2xl border border-border/70 bg-muted/20 p-4 transition hover:border-primary hover:bg-primary/5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.85)]"
          >
            <div class="text-sm font-medium">
              {{ uiText('Work Shifts') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ uiText('Review shift timing and grace periods.') }}
            </div>
          </NuxtLink>
        </CardContent>
      </Card>
    </div>

    <Card v-else>
      <CardHeader>
        <CardTitle>{{ uiText('API Dashboard') }}</CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ uiText('Quick access to the main API resources.') }}
        </p>
      </CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="card in cards"
          :key="card.href"
        >
          <CardContent class="flex items-center justify-between">
            <div class="text-sm font-medium">
              {{ uiText(card.label) }}
            </div>
            <NuxtLink :to="card.href">
              <Button
                variant="ghost"
                size="sm"
              >
                {{ uiText('Open') }}
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
        {{ uiText('The dashboard could not be refreshed just now. Please try again or inspect the attendance logs directly.') }}
      </CardContent>
    </Card>
  </div>
</template>
