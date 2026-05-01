<script setup lang="ts">
import { ArrowLeft, Building2, Network } from 'lucide-vue-next'
import TreeView from '~/components/resource/tree-view.vue'
import CompanyOrgUnitDialog from './company-org-unit-dialog.vue'
import { useCompanyManagePage } from './use-company-manage-page'

defineOptions({ name: 'CompaniesManagePage' })
const { t } = useLocale()
const {
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
  submitEdit,
  submitOrgUnit,
} = useCompanyManagePage()
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

    <CompanyOrgUnitDialog
      v-model:form="orgUnitForm"
      :category-options="allowedCategoryOptions"
      :loading="orgUnitDialogLoading"
      :mode="orgUnitDialogMode"
      :open="orgUnitDialogOpen"
      :parent-label="orgUnitParentLabel"
      @close="closeOrgUnitDialog"
      @submit="submitOrgUnit"
    />
  </div>
</template>
