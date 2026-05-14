<script setup lang="ts">
import {
  Building2,
  Check,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Save,
} from "lucide-vue-next";
import { computed, onMounted, reactive, shallowRef } from "vue";

defineOptions({ name: "TenantSettingsPage" });

type ProductId = "hr" | "crm";

type TenantProfile = {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  primary_product: ProductId;
  enabled_products: ProductId[];
  can_change_tenant_code: boolean;
};

type ProductOption = {
  id: ProductId;
  title: string;
  description: string;
};

const productOrder: ProductId[] = ["hr", "crm"];

const normalizeProduct = (value: unknown): ProductId =>
  value === "crm" ? "crm" : "hr";

const normalizeEnabledProducts = (
  primaryProduct: ProductId,
  enabledProducts: unknown[]
): ProductId[] => {
  const uniqueProducts = new Set<ProductId>();

  for (const product of enabledProducts) {
    const normalizedProduct = normalizeProduct(product);
    uniqueProducts.add(normalizedProduct);
  }

  uniqueProducts.add(primaryProduct);

  return productOrder.filter((product) => uniqueProducts.has(product));
};

const { apiFetch } = useApi();
const { refreshAccessToken } = useAuth();
const { show } = useBanner();
const { t } = useLocale();

const isLoading = shallowRef(false);
const isSaving = shallowRef(false);
const errorMessage = shallowRef("");
const tenantProfile = shallowRef<TenantProfile | null>(null);
const form = reactive<{
  primaryProduct: ProductId;
  enabledProducts: ProductId[];
}>({
  primaryProduct: "hr",
  enabledProducts: ["hr"],
});

const productOptions = computed<ProductOption[]>(() => [
  {
    id: "hr",
    title: t("settings.tenant.productHrTitle"),
    description: t("settings.tenant.productHrDescription"),
  },
  {
    id: "crm",
    title: t("settings.tenant.productCrmTitle"),
    description: t("settings.tenant.productCrmDescription"),
  },
]);

const tenantCodeStatus = computed(() => {
  if (!tenantProfile.value) {
    return "";
  }

  return tenantProfile.value.can_change_tenant_code
    ? t("settings.tenant.changeUnavailable")
    : t("settings.tenant.finalCode");
});

const syncedProfileState = computed(() => {
  if (!tenantProfile.value) {
    return null;
  }

  const primaryProduct = normalizeProduct(tenantProfile.value.primary_product);
  return {
    primaryProduct,
    enabledProducts: normalizeEnabledProducts(
      primaryProduct,
      tenantProfile.value.enabled_products
    ),
  };
});

const isDirty = computed(() => {
  if (!syncedProfileState.value) {
    return false;
  }

  return (
    syncedProfileState.value.primaryProduct !== form.primaryProduct ||
    syncedProfileState.value.enabledProducts.join("|") !==
      form.enabledProducts.join("|")
  );
});

const syncFormFromProfile = (profile: TenantProfile) => {
  const primaryProduct = normalizeProduct(profile.primary_product);
  form.primaryProduct = primaryProduct;
  form.enabledProducts = normalizeEnabledProducts(
    primaryProduct,
    profile.enabled_products
  );
};

const fetchTenantProfile = async () => {
  errorMessage.value = "";
  isLoading.value = true;
  try {
    const response = await apiFetch<TenantProfile>("/tenant/profile");
    if (!response.success || !response.data) {
      errorMessage.value = response.message || t("settings.tenant.loadFailed");
      return;
    }

    tenantProfile.value = response.data;
    syncFormFromProfile(response.data);
  } catch {
    errorMessage.value = t("settings.tenant.loadFailed");
  } finally {
    isLoading.value = false;
  }
};

const setPrimaryProduct = (product: ProductId) => {
  form.primaryProduct = product;
  form.enabledProducts = normalizeEnabledProducts(
    product,
    form.enabledProducts
  );
};

const toggleEnabledProduct = (product: ProductId) => {
  if (product === form.primaryProduct) {
    return;
  }

  if (form.enabledProducts.includes(product)) {
    form.enabledProducts = normalizeEnabledProducts(
      form.primaryProduct,
      form.enabledProducts.filter((item) => item !== product)
    );
    return;
  }

  form.enabledProducts = normalizeEnabledProducts(form.primaryProduct, [
    ...form.enabledProducts,
    product,
  ]);
};

const saveTenantConfig = async () => {
  if (!tenantProfile.value || isSaving.value) {
    return;
  }

  isSaving.value = true;
  try {
    const response = await apiFetch<TenantProfile>("/tenant/config", {
      method: "PUT",
      body: {
        primary_product: form.primaryProduct,
        enabled_products: form.enabledProducts,
      },
    });

    if (!response.success || !response.data) {
      return;
    }

    tenantProfile.value = response.data;
    syncFormFromProfile(response.data);

    const refreshResponse = await refreshAccessToken();
    if (refreshResponse.success) {
      show(t("settings.tenant.saveSuccess"), "success");
    }
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  void fetchTenantProfile();
});
</script>

<template>
  <section class="max-w-4xl space-y-6">
    <div class="space-y-2">
      <p class="text-sm font-medium text-primary">
        {{ t("layout.preferences") }}
      </p>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
        {{ t("settings.tenant.title") }}
      </h1>
      <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
        {{ t("settings.tenant.description") }}
      </p>
    </div>

    <Card class="overflow-hidden">
      <CardHeader class="space-y-3 border-b bg-muted/25">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="space-y-1">
            <CardTitle>
              {{ t("settings.tenant.cardTitle") }}
            </CardTitle>
            <p class="text-sm leading-6 text-muted-foreground">
              {{ t("settings.tenant.cardDescription") }}
            </p>
          </div>
          <Badge
            variant="outline"
            class="w-fit bg-background"
          >
            {{ t("settings.tenant.readOnlyBadge") }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-5 p-5 sm:p-6">
        <div
          v-if="isLoading"
          class="grid gap-4 sm:grid-cols-2"
        >
          <div class="h-36 rounded-lg bg-muted" />
          <div class="h-36 rounded-lg bg-muted" />
          <div class="h-24 rounded-lg bg-muted sm:col-span-2" />
        </div>

        <div
          v-else-if="tenantProfile"
          class="space-y-5"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg border bg-background p-4">
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                  <Building2
                    class="size-5"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ t("settings.tenant.organizationNameLabel") }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t("settings.tenant.organizationNameHint") }}
                  </p>
                </div>
              </div>
              <p class="break-words text-lg font-semibold">
                {{ tenantProfile.tenant_name }}
              </p>
            </div>

            <div class="rounded-lg border bg-background p-4">
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                  <KeyRound
                    class="size-5"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ t("settings.tenant.loginCodeLabel") }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t("settings.tenant.loginCodeHint") }}
                  </p>
                </div>
              </div>
              <p class="font-mono text-2xl font-semibold tracking-wide">
                {{ tenantProfile.tenant_code }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div class="flex gap-3">
              <LockKeyhole
                class="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="space-y-1">
                <p class="text-sm font-medium">
                  {{ t("settings.tenant.lockedTitle") }}
                </p>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ tenantCodeStatus }}
                </p>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ t("settings.tenant.lockedDescription") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
    </Card>

    <Card class="overflow-hidden">
      <CardHeader class="space-y-3 border-b bg-muted/25">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="space-y-1">
            <CardTitle>
              {{ t("settings.tenant.configTitle") }}
            </CardTitle>
            <p class="text-sm leading-6 text-muted-foreground">
              {{ t("settings.tenant.configDescription") }}
            </p>
          </div>
          <Badge
            variant="secondary"
            class="w-fit"
          >
            {{ t("settings.tenant.editableBadge") }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-6 p-5 sm:p-6">
        <div
          v-if="isLoading"
          class="space-y-4"
        >
          <div class="h-28 rounded-lg bg-muted" />
          <div class="h-28 rounded-lg bg-muted" />
          <div class="h-28 rounded-lg bg-muted" />
        </div>

        <div
          v-else-if="tenantProfile"
          class="space-y-6"
        >
          <div class="space-y-3">
            <div class="space-y-1">
              <h2
                class="text-sm font-semibold tracking-wide text-foreground/90 uppercase"
              >
                {{ t("settings.tenant.primaryProductLabel") }}
              </h2>
              <p class="text-sm leading-6 text-muted-foreground">
                {{ t("settings.tenant.primaryProductHint") }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="product in productOptions"
                :key="product.id"
                type="button"
                class="rounded-xl border p-4 text-left transition-colors"
                :class="
                  form.primaryProduct === product.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-primary/40'
                "
                @click="setPrimaryProduct(product.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <p class="text-base font-semibold">
                        {{ product.title }}
                      </p>
                      <Badge
                        v-if="form.primaryProduct === product.id"
                        variant="secondary"
                      >
                        {{ t("settings.tenant.primaryBadge") }}
                      </Badge>
                    </div>
                    <p class="text-sm leading-6 text-muted-foreground">
                      {{ product.description }}
                    </p>
                  </div>
                  <div
                    class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border"
                    :class="
                      form.primaryProduct === product.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-transparent'
                    "
                  >
                    <Check class="size-4" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <h2
                class="text-sm font-semibold tracking-wide text-foreground/90 uppercase"
              >
                {{ t("settings.tenant.enabledProductsLabel") }}
              </h2>
              <p class="text-sm leading-6 text-muted-foreground">
                {{ t("settings.tenant.enabledProductsHint") }}
              </p>
            </div>

            <div class="space-y-3">
              <label
                v-for="product in productOptions"
                :key="`enabled-${product.id}`"
                class="flex items-start gap-3 rounded-xl border bg-background p-4"
                :class="
                  form.enabledProducts.includes(product.id)
                    ? 'border-primary/40'
                    : 'border-border'
                "
              >
                <input
                  :checked="form.enabledProducts.includes(product.id)"
                  :disabled="product.id === form.primaryProduct || isSaving"
                  type="checkbox"
                  class="mt-1 size-4 rounded border-input text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                  @change="toggleEnabledProduct(product.id)"
                >
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium">
                      {{ product.title }}
                    </p>
                    <Badge
                      v-if="product.id === form.primaryProduct"
                      variant="outline"
                    >
                      {{ t("settings.tenant.primaryBadge") }}
                    </Badge>
                    <Badge
                      v-else-if="form.enabledProducts.includes(product.id)"
                      variant="secondary"
                    >
                      {{ t("settings.tenant.enabledBadge") }}
                    </Badge>
                  </div>
                  <p class="text-sm leading-6 text-muted-foreground">
                    {{ product.description }}
                  </p>
                </div>
              </label>
            </div>

            <p class="text-xs leading-5 text-muted-foreground">
              {{ t("settings.tenant.primaryPinnedHint") }}
            </p>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-wrap gap-3 border-t bg-muted/20 px-5 py-4 sm:px-6"
      >
        <Button
          :disabled="isLoading || isSaving || !isDirty"
          @click="saveTenantConfig"
        >
          <Save
            class="size-4"
            aria-hidden="true"
          />
          {{
            isSaving
              ? t("settings.tenant.savingAction")
              : t("settings.tenant.saveAction")
          }}
        </Button>

        <Button
          variant="outline"
          :disabled="isLoading || isSaving"
          @click="fetchTenantProfile"
        >
          <RefreshCw
            class="size-4"
            :class="{ 'animate-spin': isLoading }"
            aria-hidden="true"
          />
          {{ t("settings.tenant.refreshAction") }}
        </Button>
      </CardFooter>
    </Card>
  </section>
</template>
