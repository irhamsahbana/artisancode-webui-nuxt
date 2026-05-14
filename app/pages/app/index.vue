<script setup lang="ts">
import IndexPage from '~/modules/dashboard/index-page.vue'
import CrmDashboardPage from '~/modules/crm/crm-dashboard-page.vue'

defineOptions({ name: 'AppIndexRoutePage' })

const { locale } = useLocale()
const { activeProduct } = useActiveProduct()
</script>

<template>
  <CrmDashboardPage
    v-if="activeProduct === 'crm'"
    :key="`${locale}-crm`"
  />
  <IndexPage
    v-else
    :key="`${locale}-hr`"
  />
</template>
