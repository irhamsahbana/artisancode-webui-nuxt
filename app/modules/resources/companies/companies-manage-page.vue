<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { ArrowLeft, Building2, Network } from 'lucide-vue-next'
import TreeView from '~/components/resource/tree-view.vue'

defineOptions({ name: 'CompaniesManagePage' })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show } = useBanner()
const { t, format } = useLocale()
const localePath = useLocalePath()

const companyId = computed(() => route.params.id as string)

// Edit form state
const editLoading = ref(false)
const pageLoading = ref(true)
const editForm = reactive({
  code: '',
  name: '',
})

// Org tree state
const activeTab = ref<'edit' | 'orgtree'>('edit')
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
  const response = await apiFetch<{ code: string; name: string }>(`/companies/${companyId.value}`)
  if (response.success && response.data) {
    editForm.code = response.data.code ?? ''
    editForm.name = response.data.name ?? ''
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

// Submit edit form
const submitEdit = async () => {
  const name = editForm.name.trim()
  if (!name) {
    show(format('common.requiredField', { field: t('common.name') }), 'error')
    return
  }
  editLoading.value = true
  const response = await apiFetch(`/companies/${companyId.value}`, {
    method: 'PUT',
    body: {
      name,
    },
  })
  editLoading.value = false
  if (response.success) {
    show(t('company.updated'), 'success')
  }
}

const goBack = () => {
  router.push(localePath('/app/resources/companies'))
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
              disabled
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
              :can-edit-node="(node) => node.category !== 'company'"
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
