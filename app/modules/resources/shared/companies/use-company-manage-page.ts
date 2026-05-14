import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from '#app'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  buildOrgUnitPayload,
  createAllowedCategoryOptions,
  createEmptyOrgUnitForm,
  getAllowedOrgUnitCategories,
  type TreeNode,
} from './company-org-unit'

export const useCompanyManagePage = () => {
  const route = useRoute()
  const router = useRouter()
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t, format } = useLocale()
  const localePath = useLocalePath()

  const companyId = computed(() => route.params.id as string)

  const editLoading = ref(false)
  const pageLoading = ref(true)
  const editForm = reactive({
    code: '',
    name: '',
  })

  const activeTab = ref<'edit' | 'orgtree'>('edit')
  const orgTreeLoading = ref(false)
  const orgTree = ref<TreeNode[]>([])

  const orgUnitDialogOpen = ref(false)
  const orgUnitDialogMode = ref<'create' | 'edit'>('create')
  const orgUnitDialogLoading = ref(false)
  const selectedParentNode = ref<TreeNode | null>(null)
  const selectedEditNode = ref<TreeNode | null>(null)
  const orgUnitForm = reactive(createEmptyOrgUnitForm())

  const getAllowedCategories = () => (
    getAllowedOrgUnitCategories(selectedParentNode.value, selectedEditNode.value)
  )

  const allowedCategoryOptions = computed(() => (
    createAllowedCategoryOptions(getAllowedCategories())
  ))
  const orgUnitParentLabel = computed(() => (
    selectedParentNode.value
      ? format('company.parentLabel', {
          name: selectedParentNode.value.name,
          category: selectedParentNode.value.category,
        })
      : ''
  ))

  const resetOrgUnitForm = () => {
    Object.assign(orgUnitForm, createEmptyOrgUnitForm())
  }

  const closeOrgUnitDialog = () => {
    orgUnitDialogOpen.value = false
    selectedParentNode.value = null
    selectedEditNode.value = null
    resetOrgUnitForm()
  }

  const loadCompany = async () => {
    pageLoading.value = true

    try {
      const response = await apiFetch<{ code: string, name: string }>(`/companies/${companyId.value}`)

      if (response.success && response.data) {
        editForm.code = response.data.code ?? ''
        editForm.name = response.data.name ?? ''
      }
    }
    finally {
      pageLoading.value = false
    }
  }

  const loadOrgUnitTree = async () => {
    orgTreeLoading.value = true
    orgTree.value = []

    try {
      const response = await apiFetch(`/org-units/tree/${companyId.value}`)

      if (response.success && response.data) {
        orgTree.value = response.data as TreeNode[]
      }
    }
    finally {
      orgTreeLoading.value = false
    }
  }

  const handleAddChild = (node: TreeNode) => {
    selectedParentNode.value = node
    selectedEditNode.value = null
    orgUnitDialogMode.value = 'create'
    resetOrgUnitForm()
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

  const submitOrgUnit = async () => {
    const payload = buildOrgUnitPayload(orgUnitForm)

    if (!payload?.code) {
      show(format('common.requiredField', { field: t('common.code') }), 'error')
      return
    }

    if (!payload?.name) {
      show(format('common.requiredField', { field: t('common.name') }), 'error')
      return
    }

    orgUnitDialogLoading.value = true

    try {
      const response = orgUnitDialogMode.value === 'create'
        ? await apiFetch('/org-units', {
            method: 'POST',
            body: payload,
          })
        : await apiFetch(`/org-units/${selectedEditNode.value?.id}`, {
            method: 'PUT',
            body: payload,
          })

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
    finally {
      orgUnitDialogLoading.value = false
    }
  }

  const submitEdit = async () => {
    const name = editForm.name.trim()

    if (!name) {
      show(format('common.requiredField', { field: t('common.name') }), 'error')
      return
    }

    editLoading.value = true

    try {
      const response = await apiFetch(`/companies/${companyId.value}`, {
        method: 'PUT',
        body: {
          name,
        },
      })

      if (response.success) {
        show(t('company.updated'), 'success')
      }
    }
    finally {
      editLoading.value = false
    }
  }

  const goBack = () => {
    router.push(localePath('/app/resources/companies'))
  }

  onMounted(() => {
    void loadCompany().catch(() => {})
  })

  return {
    activeTab,
    allowedCategoryOptions,
    closeOrgUnitDialog,
    editForm,
    editLoading,
    goBack,
    handleAddChild,
    handleDeleteNode,
    handleEditNode,
    loadOrgUnitTree,
    orgTree,
    orgTreeLoading,
    orgUnitDialogLoading,
    orgUnitDialogMode,
    orgUnitDialogOpen,
    orgUnitForm,
    orgUnitParentLabel,
    pageLoading,
    selectedParentNode,
    submitEdit,
    submitOrgUnit,
  }
}
