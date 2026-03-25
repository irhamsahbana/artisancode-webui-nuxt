<script setup lang="ts">
defineOptions({ name: 'UsersPage' })

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
]
</script>

<template>
  <ResourceList
    title="Users"
    endpoint="/users"
    :columns="columns"
    loading-variant="skeleton"
    :can-delete="false"
  />
</template>
