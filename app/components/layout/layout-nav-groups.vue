<script setup lang="ts">
import type { Component } from 'vue'

type LayoutNavItem = {
  label: string
  to: string
  icon: Component
}

type LayoutNavGroup = {
  title: string
  items: LayoutNavItem[]
}

defineProps<{
  groups: LayoutNavGroup[]
  isItemActive: (path: string) => boolean
  itemKeyPrefix?: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <section
    v-for="group in groups"
    :key="`${itemKeyPrefix ?? 'nav'}-${group.title}`"
    class="pb-4"
  >
    <div class="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
      {{ group.title }}
    </div>
    <nav class="space-y-1.5 text-sm">
      <NuxtLink
        v-for="item in group.items"
        :key="`${itemKeyPrefix ?? 'nav'}-${item.to}`"
        class="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sidebar-foreground/78 transition hover:border-sidebar-border/60 hover:bg-sidebar-accent/75 hover:text-sidebar-accent-foreground"
        :class="{
          'border-sidebar-border/70 bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_18px_36px_-30px_rgba(15,23,42,0.85)] font-medium':
            isItemActive(item.to),
        }"
        :to="localePath(item.to)"
      >
        <component
          :is="item.icon"
          class="h-4 w-4 shrink-0"
          :class="{
            'text-sidebar-primary': isItemActive(item.to),
            'text-sidebar-foreground/55 group-hover:text-sidebar-foreground/80': !isItemActive(item.to),
          }"
        />
        {{ item.label }}
      </NuxtLink>
    </nav>
  </section>
</template>
