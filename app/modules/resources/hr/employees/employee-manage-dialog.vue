<script setup lang="ts">
import type { EmployeeFormState } from './employee-form'

defineOptions({ name: 'EmployeeManageDialog' })

defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  loading: boolean
  saving: boolean
  orgUnits: Array<{ id: string; name: string; parent_id: string | null }>
  jobPositionOptions: Array<{ value: string; label: string }>
  workLocationOptions: Array<{ value: string; label: string }>
  workShiftOptions: Array<{ value: string; label: string }>
  statusOptions: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  close: []
  submit: []
}>()

const { t } = useLocale()
const form = defineModel<EmployeeFormState>('form', { required: true })
</script>

<template>
  <div v-if="open">
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="mode === 'create' ? t('ui.addEmployee') : t('ui.editEmployee')"
      :description="mode === 'create' ? '' : t('ui.keepEmployeeIdentityAssignmentAndAttendanceSetupAligned')"
      @close="emit('close')"
    >
      <div
        v-if="loading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loading2') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="emit('submit')"
      >
        <div>
          <Label for="emp-no">Employee No *</Label>
          <Input
            id="emp-no"
            v-model="form.employee_no"
            placeholder="e.g. EMP001"
            class="mt-1"
          />
        </div>

        <div>
          <Label for="emp-name">Full Name *</Label>
          <Input
            id="emp-name"
            v-model="form.full_name"
            placeholder="e.g. John Doe"
            class="mt-1"
          />
        </div>

        <div>
          <Label for="emp-email">Email *</Label>
          <Input
            id="emp-email"
            v-model="form.email"
            type="email"
            placeholder="e.g. john@example.com"
            class="mt-1"
          />
        </div>

        <div v-if="mode === 'edit'">
          <Label for="emp-password">
            {{ t('ui.resetPassword') }}
          </Label>
          <Input
            id="emp-password"
            v-model="form.password"
            type="password"
            :placeholder="t('ui.optionalLeaveBlankToKeepCurrentPassword')"
            class="mt-1"
          />
        </div>

        <div>
          <Label>{{ t('ui.organizationUnit') }}</Label>
          <SearchableTreeSelect
            v-model="form.org_unit_id"
            :items="orgUnits"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search org units..."
            class="mt-1"
          />
        </div>

        <div>
          <Label>{{ t('ui.jobPosition') }}</Label>
          <SearchableSelect
            v-model="form.job_position_id"
            :options="jobPositionOptions"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search job positions..."
            class="mt-1"
          />
        </div>

        <div>
          <Label>{{ t('ui.workLocation') }}</Label>
          <SearchableSelect
            v-model="form.location_id"
            :options="workLocationOptions"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search work locations..."
            class="mt-1"
          />
        </div>

        <div>
          <Label>{{ t('ui.workShift') }} *</Label>
          <SearchableSelect
            v-model="form.shift_id"
            :options="workShiftOptions"
            :placeholder="t('ui.selectWorkShift')"
            search-placeholder="Search work shifts..."
            class="mt-1"
          />
        </div>

        <div>
          <Label>Status *</Label>
          <SearchableSelect
            v-model="form.status"
            :options="statusOptions"
            :placeholder="t('ui.selectStatus')"
            search-placeholder="Search status..."
            class="mt-1"
          />
        </div>

        <div>
          <Label for="emp-join">Join Date</Label>
          <Input
            id="emp-join"
            v-model="form.join_date"
            type="date"
            class="mt-1"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="saving"
            @click="emit('close')"
          >
            {{ t('ui.cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="saving"
            type="submit"
          >
            {{ saving ? t('ui.saving') : (mode === 'create' ? t('ui.create') : t('ui.update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>
