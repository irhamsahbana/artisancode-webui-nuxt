<script setup lang="ts">
import type { Component } from 'vue'
import { Languages } from 'lucide-vue-next'

defineProps<{
  currentLocaleBadge: string
  currentThemeIcon: Component
  currentThemeLabel: string
  isSwitchingLocale: boolean
  languageLabel: string
  preferencesLabel: string
}>()

defineEmits<{
  switchLocale: []
  toggleTheme: []
}>()
</script>

<template>
  <div class="relative min-h-screen">
    <div class="fixed right-4 top-4 z-40 flex items-center gap-2 sm:right-6 sm:top-6">
      <Button
        variant="outline"
        class="shrink-0 rounded-2xl border-slate-200 bg-white/85 px-3 text-slate-900 shadow-lg backdrop-blur-xl hover:bg-slate-100 hover:text-slate-950 dark:border-white/20 dark:bg-slate-950/60 dark:text-white dark:hover:bg-slate-900 dark:hover:text-white"
        :aria-label="languageLabel"
        :disabled="isSwitchingLocale"
        @click="$emit('switchLocale')"
      >
        <Languages class="h-4 w-4" />
        <span class="hidden sm:inline">
          {{ currentLocaleBadge }}
        </span>
      </Button>
      <Button
        variant="outline"
        class="shrink-0 rounded-2xl border-slate-200 bg-white/85 px-3 text-slate-900 shadow-lg backdrop-blur-xl hover:bg-slate-100 hover:text-slate-950 dark:border-white/20 dark:bg-slate-950/60 dark:text-white dark:hover:bg-slate-900 dark:hover:text-white"
        :aria-label="preferencesLabel"
        @click="$emit('toggleTheme')"
      >
        <component
          :is="currentThemeIcon"
          class="h-4 w-4"
        />
        <span class="hidden sm:inline">
          {{ currentThemeLabel }}
        </span>
      </Button>
    </div>
    <slot />
  </div>
</template>
