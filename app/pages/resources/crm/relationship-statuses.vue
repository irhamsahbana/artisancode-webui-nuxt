<script setup lang="ts">
import CategoriesPage from '~/modules/resources/crm/categories/categories-page.vue'

defineOptions({ name: 'RelationshipStatusesRoutePage' })

definePageMeta({
  path: '/app/resources/relationship-statuses/:id?',
})
</script>

<template>
  <CategoriesPage category-group="relationship_status" />
</template>
