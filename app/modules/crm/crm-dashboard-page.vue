<script setup lang="ts">
defineOptions({ name: "CrmDashboardPage" });

const { t } = useLocale();
const localePath = useLocalePath();

const cards = computed(() => [
  {
    title: t("crm.dashboard.customerDatabaseTitle"),
    description: t("crm.dashboard.customerDatabaseDescription"),
  },
  {
    title: t("crm.dashboard.importExportTitle"),
    description: t("crm.dashboard.importExportDescription"),
  },
  {
    title: t("crm.dashboard.masterDataTitle"),
    description: t("crm.dashboard.masterDataDescription"),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <Card class="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_42%),linear-gradient(135deg,rgba(255,251,235,1),rgba(255,255,255,1),rgba(224,231,255,0.8))] shadow-sm dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_35%),linear-gradient(135deg,rgba(24,24,27,1),rgba(9,9,11,1),rgba(17,24,39,1))]">
      <CardContent class="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <Badge
            variant="outline"
            class="w-fit bg-background/70 backdrop-blur"
          >
            {{ t("crm.dashboard.badge") }}
          </Badge>
          <div class="space-y-2">
            <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
              {{ t("crm.dashboard.title") }}
            </h1>
            <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
              {{ t("crm.dashboard.description") }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button
            as-child
            variant="outline"
          >
            <NuxtLink :to="localePath('/app/settings/tenant')">
              {{ t("settings.tenant.title") }}
            </NuxtLink>
          </Button>
        </div>
      </CardContent>
    </Card>

    <section class="grid gap-4 xl:grid-cols-3">
      <Card
        v-for="card in cards"
        :key="card.title"
        class="h-full"
      >
        <CardHeader class="space-y-2">
          <CardTitle class="text-base">
            {{ card.title }}
          </CardTitle>
          <p class="text-sm leading-6 text-muted-foreground">
            {{ card.description }}
          </p>
        </CardHeader>
      </Card>
    </section>

    <Card>
      <CardHeader class="space-y-2">
        <CardTitle>
          {{ t("crm.dashboard.nextStepTitle") }}
        </CardTitle>
        <p class="text-sm leading-6 text-muted-foreground">
          {{ t("crm.dashboard.nextStepDescription") }}
        </p>
      </CardHeader>
      <CardContent class="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>{{ t("crm.dashboard.nextStepCustomer") }}</p>
        <p>{{ t("crm.dashboard.nextStepImport") }}</p>
        <p>{{ t("crm.dashboard.nextStepIsolation") }}</p>
      </CardContent>
    </Card>
  </div>
</template>
