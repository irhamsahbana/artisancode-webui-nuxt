<script setup lang="ts">
defineOptions({ name: 'AppRoot' })

const { locale } = useLocale()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
}))
</script>

<template>
  <div v-cloak>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
