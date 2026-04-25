<script setup lang="ts">
import IndexPage from '~/modules/dashboard/index-page.vue'

defineOptions({ name: 'IndexRoutePage' })

definePageMeta({
  path: '/app',
})

const { locale } = useLocale()
</script>

<template>
  <IndexPage :key="locale" />
</template>
