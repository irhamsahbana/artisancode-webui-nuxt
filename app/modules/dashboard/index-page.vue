<script setup lang="ts">
defineOptions({ name: 'IndexPage' })

const cards = [
  { label: 'Users', href: '/resources/users' },
  { label: 'Companies', href: '/resources/companies' },
  { label: 'Branches', href: '/resources/branches' },
  { label: 'Categories', href: '/resources/categories' },
  { label: 'Programs', href: '/resources/programs' },
  { label: 'Students', href: '/resources/students' },
  { label: 'Teachers', href: '/resources/teachers' },
  { label: 'Enrollments', href: '/resources/enrollments' },
  { label: 'Invoices', href: '/resources/invoices' },
  { label: 'Roles & Permissions', href: '/resources/roles' },
]
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>API Dashboard</CardTitle>
        <p class="text-sm text-muted-foreground">
          Quick access to the main API resources.
        </p>
      </CardHeader>
    </Card>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="card in cards"
        :key="card.href"
      >
        <CardContent class="flex items-center justify-between">
          <div class="text-sm font-medium">
            {{ card.label }}
          </div>
          <NuxtLink :to="card.href">
            <Button
              variant="ghost"
              size="sm"
            >
              Open
            </Button>
          </NuxtLink>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
