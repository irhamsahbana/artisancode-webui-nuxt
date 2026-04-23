<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { ArrowLeft, Building2, Network, Settings } from 'lucide-vue-next'
import TreeView from '~/components/resource/tree-view.vue'
import { getTimezoneOptions } from '~/utils/timezone-options'

defineOptions({ name: 'CompaniesManagePage' })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show } = useBanner()
const { t, format, locale } = useLocale()
const localePath = useLocalePath()

const companyId = computed(() => route.params.id as string)

// Edit form state
const editLoading = ref(false)
const pageLoading = ref(true)
const editForm = reactive({
  code: '',
  name: '',
})

// Config form state
const configLoading = ref(false)
const configForm = reactive({
  attendance_radius_meters: 50,
  attendance_check_in_start: '08:00',
  attendance_check_in_end: '09:00',
  attendance_check_out_start: '17:00',
  attendance_check_out_end: '23:59',
  leave_allowance_annual: 12,
  overtime_rate_multiplier: 1.5,
  preferred_language: 'id',
  supported_languages: ['id', 'en'],
  timezone: 'Asia/Makassar',
  date_format: 'YYYY-MM-DD',
  time_format: 'HH:mm:ss',
})

const updateConfigNumber = (
  key: 'attendance_radius_meters' | 'leave_allowance_annual' | 'overtime_rate_multiplier',
  value: string | number,
) => {
  const nextValue = Number(value)
  configForm[key] = Number.isFinite(nextValue) ? nextValue : 0
}

// Org tree state
const activeTab = ref<'edit' | 'orgtree' | 'config'>('edit')
const orgTreeLoading = ref(false)

interface TreeNode {
  id: string
  code: string
  name: string
  category: string
  children: TreeNode[]
}

const orgTree = ref<TreeNode[]>([])

// Org unit dialog state
const orgUnitDialogOpen = ref(false)
const orgUnitDialogMode = ref<'create' | 'edit'>('create')
const orgUnitDialogLoading = ref(false)
const selectedParentNode = ref<TreeNode | null>(null)
const selectedEditNode = ref<TreeNode | null>(null)

const orgUnitForm = reactive({
  code: '',
  name: '',
  category: 'division',
  parent_id: '',
})

const categoryHierarchy: Record<string, string[]> = {
  company: ['branch'],
  branch: ['division'],
  division: ['department', 'division'],
  department: ['unit', 'department'],
  unit: ['unit'],
}

// Load company data
const loadCompany = async () => {
  pageLoading.value = true
  const response = await apiFetch<{ code: string; name: string; config: Record<string, unknown> }>(`/companies/${companyId.value}`)
  if (response.success && response.data) {
    editForm.code = response.data.code ?? ''
    editForm.name = response.data.name ?? ''
    // Populate config form from API response
    const cfg = response.data.config ?? {}
    if (cfg.attendance_radius_meters != null) configForm.attendance_radius_meters = Number(cfg.attendance_radius_meters)
    if (cfg.attendance_check_in_start) configForm.attendance_check_in_start = String(cfg.attendance_check_in_start)
    if (cfg.attendance_check_in_end) configForm.attendance_check_in_end = String(cfg.attendance_check_in_end)
    if (cfg.attendance_check_out_start) configForm.attendance_check_out_start = String(cfg.attendance_check_out_start)
    if (cfg.attendance_check_out_end) configForm.attendance_check_out_end = String(cfg.attendance_check_out_end)
    if (cfg.leave_allowance_annual != null) configForm.leave_allowance_annual = Number(cfg.leave_allowance_annual)
    if (cfg.overtime_rate_multiplier != null) configForm.overtime_rate_multiplier = Number(cfg.overtime_rate_multiplier)
    if (cfg.preferred_language) configForm.preferred_language = String(cfg.preferred_language)
    if (Array.isArray(cfg.supported_languages) && cfg.supported_languages.length > 0) {
      configForm.supported_languages = cfg.supported_languages.map(item => String(item))
    }
    if (cfg.timezone) configForm.timezone = String(cfg.timezone)
    if (cfg.date_format) configForm.date_format = String(cfg.date_format)
    if (cfg.time_format) configForm.time_format = String(cfg.time_format)
  }
  pageLoading.value = false
}

// Load org unit tree
const loadOrgUnitTree = async () => {
  orgTreeLoading.value = true
  orgTree.value = []
  const response = await apiFetch(`/org-units/tree/${companyId.value}`)
  if (response.success && response.data) {
    orgTree.value = response.data as TreeNode[]
  }
  orgTreeLoading.value = false
}

// Get allowed categories based on parent (create) or current node (edit)
const getAllowedCategories = () => {
  // When adding child — based on parent node's category
  if (selectedParentNode.value) {
    return categoryHierarchy[selectedParentNode.value.category] || ['unit']
  }
  // When editing — based on the node's own category, include it and same-level options
  if (selectedEditNode.value) {
    return categoryHierarchy[selectedEditNode.value.category] || ['unit']
  }
  return ['division']
}

const allowedCategoryOptions = computed(() => {
  return getAllowedCategories().map((cat) => ({
    value: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  }))
})

// Org unit CRUD handlers
const handleAddChild = (node: TreeNode) => {
  selectedParentNode.value = node
  selectedEditNode.value = null
  orgUnitDialogMode.value = 'create'
  orgUnitForm.code = ''
  orgUnitForm.name = ''
  orgUnitForm.category = getAllowedCategories()[0] || 'unit'
  orgUnitForm.parent_id = node.id
  orgUnitDialogOpen.value = true
}

const handleEditNode = (node: TreeNode) => {
  selectedParentNode.value = null
  selectedEditNode.value = node
  orgUnitDialogMode.value = 'edit'
  orgUnitForm.code = node.code || ''
  orgUnitForm.name = node.name
  orgUnitForm.category = node.category
  orgUnitForm.parent_id = ''
  orgUnitDialogOpen.value = true
}

const handleDeleteNode = async (node: TreeNode) => {
  if (!confirm(format('company.deleteOrgUnitConfirm', { name: node.name }))) {
    return
  }
  const response = await apiFetch(`/org-units/${node.id}`, {
    method: 'DELETE',
  })
  if (response.success) {
    show(t('company.orgUnitDeleted'), 'success')
    await loadOrgUnitTree()
  }
}

const closeOrgUnitDialog = () => {
  orgUnitDialogOpen.value = false
  selectedParentNode.value = null
  selectedEditNode.value = null
  orgUnitForm.code = ''
  orgUnitForm.name = ''
  orgUnitForm.category = 'division'
  orgUnitForm.parent_id = ''
}

const submitOrgUnit = async () => {
  const code = orgUnitForm.code.trim()
  if (!code) {
    show(format('common.requiredField', { field: t('common.code') }), 'error')
    return
  }

  const name = orgUnitForm.name.trim()
  if (!name) {
    show(format('common.requiredField', { field: t('common.name') }), 'error')
    return
  }

  const payload: Record<string, unknown> = {
    code,
    name,
    category: orgUnitForm.category,
  }

  if (orgUnitForm.parent_id) {
    payload.parent_id = orgUnitForm.parent_id
  }

  orgUnitDialogLoading.value = true

  let response
  if (orgUnitDialogMode.value === 'create') {
    response = await apiFetch('/org-units', {
      method: 'POST',
      body: payload,
    })
  } else {
    response = await apiFetch(`/org-units/${selectedEditNode.value?.id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  orgUnitDialogLoading.value = false

  if (response.success) {
    show(
      orgUnitDialogMode.value === 'create'
        ? t('company.orgUnitCreated')
        : t('company.orgUnitUpdated'),
      'success',
    )
    closeOrgUnitDialog()
    await loadOrgUnitTree()
  }
}

// Submit config form
const submitConfig = async () => {
  if (!configForm.supported_languages.includes(configForm.preferred_language)) {
    show(t('company.supportedLanguagesMustIncludePreferred'), 'error')
    return
  }

  configLoading.value = true
  const response = await apiFetch(`/companies/${companyId.value}`, {
    method: 'PUT',
    body: {
      code: editForm.code,
      name: editForm.name,
      config: { ...configForm },
    },
  })
  configLoading.value = false
  if (response.success) {
    show(t('company.configurationUpdated'), 'success')
  }
}

const languageOptions = computed(() => [
  { value: 'id', label: t('common.indonesian') },
  { value: 'en', label: t('common.english') },
])

const timezoneOptions = computed(() => getTimezoneOptions(locale.value))

const toggleSupportedLanguage = (language: 'id' | 'en', checked: boolean) => {
  if (checked) {
    if (!configForm.supported_languages.includes(language)) {
      configForm.supported_languages = [...configForm.supported_languages, language]
    }
    return
  }

  if (configForm.supported_languages.length === 1) {
    return
  }

  configForm.supported_languages = configForm.supported_languages.filter(item => item !== language)
  if (!configForm.supported_languages.includes(configForm.preferred_language)) {
    configForm.preferred_language = configForm.supported_languages[0] || 'id'
  }
}

// Submit edit form
const submitEdit = async () => {
  const name = editForm.name.trim()
  if (!name) {
    show(format('common.requiredField', { field: t('common.name') }), 'error')
    return
  }
  const code = editForm.code.trim()
  if (!code) {
    show(format('common.requiredField', { field: t('common.code') }), 'error')
    return
  }

  editLoading.value = true
  const response = await apiFetch(`/companies/${companyId.value}`, {
    method: 'PUT',
    body: {
      code,
      name,
      config: { ...configForm },
    },
  })
  editLoading.value = false
  if (response.success) {
    show(t('company.updated'), 'success')
  }
}

const goBack = () => {
  router.push(localePath('/resources/companies'))
}

onMounted(async () => {
  await loadCompany()
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        @click="goBack"
      >
        <ArrowLeft class="mr-1 h-4 w-4" />
        {{ t('company.backToList') }}
      </Button>
      <div>
        <h1 class="text-xl font-semibold">
          {{ editForm.name || t('company.company') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('company.manageDescription') }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b pb-2">
      <Button
        :variant="activeTab === 'edit' ? 'default' : 'ghost'"
        size="sm"
        @click="activeTab = 'edit'"
      >
        <Building2 class="mr-2 h-4 w-4" />
        {{ t('company.companyDetails') }}
      </Button>
      <Button
        :variant="activeTab === 'orgtree' ? 'default' : 'ghost'"
        size="sm"
        @click="activeTab = 'orgtree'; loadOrgUnitTree()"
      >
        <Network class="mr-2 h-4 w-4" />
        {{ t('company.organizationStructure') }}
      </Button>
      <Button
        :variant="activeTab === 'config' ? 'default' : 'ghost'"
        size="sm"
        @click="activeTab = 'config'"
      >
        <Settings class="mr-2 h-4 w-4" />
        {{ t('company.configuration') }}
      </Button>
    </div>

    <!-- Loading -->
    <div
      v-if="pageLoading"
      class="text-sm text-muted-foreground py-8"
    >
      {{ t('company.loading') }}
    </div>

    <template v-else>
      <!-- Edit Tab -->
      <Card v-if="activeTab === 'edit'">
        <CardHeader>
          <CardTitle>{{ t('company.editCompany') }}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label for="company-code">{{ t('company.companyCode') }}</Label>
            <Input
              id="company-code"
              v-model="editForm.code"
              :placeholder="t('company.companyCode')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="company-name">{{ t('company.companyName') }}</Label>
            <Input
              id="company-name"
              v-model="editForm.name"
              :placeholder="t('company.companyName')"
            />
          </div>
        </CardContent>
        <CardFooter class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="goBack"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="editLoading"
            @click="submitEdit"
          >
            {{ editLoading ? t('common.saving') : t('common.saveChanges') }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Config Tab -->
      <Card v-if="activeTab === 'config'">
        <CardHeader>
          <CardTitle>{{ t('company.companyConfiguration') }}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-6">
          <!-- Attendance Settings -->
          <div>
            <h3 class="text-sm font-semibold mb-3">
              {{ t('company.attendance') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <Label for="cfg-radius">{{ t('company.attendanceRadius') }}</Label>
                <Input
                  id="cfg-radius"
                  :model-value="String(configForm.attendance_radius_meters)"
                  type="number"
                  min="0"
                  placeholder="50"
                  @update:model-value="updateConfigNumber('attendance_radius_meters', $event)"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-leave">{{ t('company.leaveAllowance') }}</Label>
                <Input
                  id="cfg-leave"
                  :model-value="String(configForm.leave_allowance_annual)"
                  type="number"
                  min="0"
                  placeholder="12"
                  @update:model-value="updateConfigNumber('leave_allowance_annual', $event)"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-checkin-start">{{ t('company.checkInStart') }}</Label>
                <Input
                  id="cfg-checkin-start"
                  v-model="configForm.attendance_check_in_start"
                  type="time"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-checkin-end">{{ t('company.checkInEnd') }}</Label>
                <Input
                  id="cfg-checkin-end"
                  v-model="configForm.attendance_check_in_end"
                  type="time"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-checkout-start">{{ t('company.checkOutStart') }}</Label>
                <Input
                  id="cfg-checkout-start"
                  v-model="configForm.attendance_check_out_start"
                  type="time"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-checkout-end">{{ t('company.checkOutEnd') }}</Label>
                <Input
                  id="cfg-checkout-end"
                  v-model="configForm.attendance_check_out_end"
                  type="time"
                />
              </div>
            </div>
          </div>

          <!-- Overtime Settings -->
          <div>
            <h3 class="text-sm font-semibold mb-3">
              {{ t('company.overtime') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <Label for="cfg-overtime">{{ t('company.overtimeRateMultiplier') }}</Label>
                <Input
                  id="cfg-overtime"
                  :model-value="String(configForm.overtime_rate_multiplier)"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="1.5"
                  @update:model-value="updateConfigNumber('overtime_rate_multiplier', $event)"
                />
              </div>
            </div>
          </div>

          <!-- Locale Settings -->
          <div>
            <h3 class="text-sm font-semibold mb-3">
              {{ t('company.locale') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="grid gap-2 sm:col-span-3">
                <h4 class="text-sm font-medium">
                  {{ t('company.languageSection') }}
                </h4>
                <p class="text-xs text-muted-foreground">
                  {{ t('company.languageHint') }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="cfg-preferred-language">{{ t('company.preferredLanguage') }}</Label>
                <SearchableSelect
                  id="cfg-preferred-language"
                  v-model="configForm.preferred_language"
                  :options="languageOptions"
                  :placeholder="t('common.selectLanguage')"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label>{{ t('company.supportedLanguages') }}</Label>
                <div class="flex flex-wrap gap-4 rounded-md border p-3">
                  <label
                    v-for="option in languageOptions"
                    :key="option.value"
                    class="flex items-center gap-2 text-sm"
                  >
                    <input
                      :checked="configForm.supported_languages.includes(option.value)"
                      type="checkbox"
                      @change="toggleSupportedLanguage(option.value as 'id' | 'en', ($event.target as HTMLInputElement).checked)"
                    >
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
              <div class="grid gap-2">
                <Label for="cfg-timezone">{{ t('company.timezone') }}</Label>
                <SearchableSelect
                  id="cfg-timezone"
                  v-model="configForm.timezone"
                  :options="timezoneOptions"
                  :placeholder="t('company.timezone')"
                  :search-placeholder="`${t('common.search')} ${t('company.timezone').toLowerCase()}`"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-date-format">{{ t('company.dateFormat') }}</Label>
                <Input
                  id="cfg-date-format"
                  v-model="configForm.date_format"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div class="grid gap-2">
                <Label for="cfg-time-format">{{ t('company.timeFormat') }}</Label>
                <Input
                  id="cfg-time-format"
                  v-model="configForm.time_format"
                  placeholder="HH:mm:ss"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="activeTab = 'edit'"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="configLoading"
            @click="submitConfig"
          >
            {{ configLoading ? t('common.saving') : t('common.saveConfiguration') }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Org Tree Tab -->
      <Card v-if="activeTab === 'orgtree'">
        <CardHeader>
          <CardTitle>{{ t('company.organizationStructure') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            v-if="orgTreeLoading"
            class="text-sm text-muted-foreground py-4"
          >
            {{ t('company.organizationStructureLoading') }}
          </div>
          <div
            v-else-if="orgTree.length === 0"
            class="text-sm text-muted-foreground py-4"
          >
            {{ t('company.organizationStructureEmpty') }}
          </div>
          <div v-else>
            <TreeView
              :items="orgTree"
              :can-delete-node="(node) => node.category !== 'company'"
              @add-child="handleAddChild"
              @edit="handleEditNode"
              @delete="handleDeleteNode"
            />
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Org Unit Create/Edit Dialog -->
    <div
      v-if="orgUnitDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
      @click.self="closeOrgUnitDialog"
    >
      <div class="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">
            {{ orgUnitDialogMode === 'create' ? t('company.createOrganizationUnit') : t('company.editOrganizationUnit') }}
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="orgUnitDialogLoading"
            @click="closeOrgUnitDialog"
          >
            {{ t('common.close') }}
          </Button>
        </div>
        <div class="mt-4 grid gap-4 text-sm">
          <div class="grid gap-2">
            <Label for="org-unit-code">{{ t('company.organizationUnitCode') }}</Label>
            <Input
              id="org-unit-code"
              v-model="orgUnitForm.code"
              :placeholder="t('company.organizationUnitCodePlaceholder')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="org-unit-name">{{ t('company.organizationUnitName') }}</Label>
            <Input
              id="org-unit-name"
              v-model="orgUnitForm.name"
              :placeholder="t('company.organizationUnitNamePlaceholder')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="org-unit-category">{{ t('company.organizationUnitCategory') }}</Label>
            <SearchableSelect
              id="org-unit-category"
              v-model="orgUnitForm.category"
              :options="allowedCategoryOptions"
              :placeholder="t('common.selectCategory')"
            />
          </div>
          <div
            v-if="selectedParentNode"
            class="text-muted-foreground text-xs"
          >
            {{ format('company.parentLabel', { name: selectedParentNode.name, category: selectedParentNode.category }) }}
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="orgUnitDialogLoading"
            @click="closeOrgUnitDialog"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="orgUnitDialogLoading"
            @click="submitOrgUnit"
          >
            {{ orgUnitDialogLoading ? t('common.saving') : (orgUnitDialogMode === 'create' ? t('common.create') : t('common.save')) }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
