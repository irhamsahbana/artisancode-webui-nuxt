<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Badge from './badge.vue'
import Button from './button.vue'
import Card from './card.vue'
import CardContent from './card-content.vue'
import CardFooter from './card-footer.vue'
import CardHeader from './card-header.vue'
import CardTitle from './card-title.vue'

defineOptions({ name: 'UiCardStory' })

const state = reactive({
  title: 'Monthly attendance recap',
  subtitle: 'Updated 5 minutes ago',
  ctaLabel: 'Open report',
  theme: 'light' as 'light' | 'dark',
})
</script>

<template>
  <Story
    title="UI/Card"
    :layout="{ type: 'grid', width: 360 }"
  >
    <template #controls>
      <HstSelect
        v-model="state.theme"
        title="Theme"
        :options="[
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ]"
      />
      <HstText
        v-model="state.title"
        title="Title"
      />
      <HstText
        v-model="state.subtitle"
        title="Subtitle"
      />
      <HstText
        v-model="state.ctaLabel"
        title="CTA label"
      />
    </template>

    <Variant title="Summary card">
      <div
        class="rounded-3xl p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Card class="overflow-hidden">
          <CardHeader class="gap-3 bg-muted/40">
            <div class="flex items-center justify-between gap-3">
              <CardTitle>{{ state.title }}</CardTitle>
              <Badge>Stable</Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ state.subtitle }}
            </p>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-emerald-50 p-3 text-center text-emerald-900">
                <div class="text-xs uppercase tracking-[0.14em]">
                  Present
                </div>
                <div class="mt-2 text-2xl font-semibold">
                  182
                </div>
              </div>
              <div class="rounded-xl bg-amber-50 p-3 text-center text-amber-900">
                <div class="text-xs uppercase tracking-[0.14em]">
                  Late
                </div>
                <div class="mt-2 text-2xl font-semibold">
                  14
                </div>
              </div>
              <div class="rounded-xl bg-rose-50 p-3 text-center text-rose-900">
                <div class="text-xs uppercase tracking-[0.14em]">
                  Absent
                </div>
                <div class="mt-2 text-2xl font-semibold">
                  3
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter class="justify-between border-t bg-background/80">
            <span class="text-sm text-muted-foreground">Payroll locked for April</span>
            <Button
              size="sm"
              variant="outline"
            >
              {{ state.ctaLabel }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Variant>

    <Variant title="Quiet shell">
      <div
        class="rounded-3xl p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Card class="border-dashed shadow-none">
          <CardContent class="py-10 text-center text-sm text-muted-foreground">
            Waiting for live data from the next sync window.
          </CardContent>
        </Card>
      </div>
    </Variant>
  </Story>
</template>
