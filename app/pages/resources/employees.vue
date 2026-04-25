<script setup lang="ts">
import EmployeesPage from '~/modules/resources/employees/employees-page.vue'

defineOptions({ name: 'EmployeesRoutePage' })

definePageMeta({
  path: '/app/resources/employees',
})
</script>

<template>
  <EmployeesPage />
</template>
