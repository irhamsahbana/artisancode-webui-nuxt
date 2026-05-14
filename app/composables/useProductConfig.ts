import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Clock3,
  CreditCard,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-vue-next";

type LayoutNavItem = {
  label: string;
  to: string;
  icon: Component;
};

type LayoutNavGroup = {
  title: string;
  items: LayoutNavItem[];
};

type ProductConfig = {
  appName: string;
  navGroups: LayoutNavGroup[];
};

export const useProductConfig = () => {
  const { t } = useLocale();
  const { enabledProducts, hasCrmProduct, hasHrProduct, primaryProduct } =
    useProductMode();
  const { activeProduct } = useActiveProduct();

  const config = computed<ProductConfig>(() => {
    const navGroups: LayoutNavGroup[] = [
      {
        title: t("layout.main"),
        items: [{ label: t("layout.dashboard"), to: "/app", icon: LayoutGrid }],
      },
      {
        title: t("layout.billing"),
        items: [
          {
            label: t("billing.nav.payments"),
            to: "/app/billing/payments",
            icon: CreditCard,
          },
        ],
      },
      {
        title: t("layout.resources"),
        items: [
          {
            label: t("layout.companies"),
            to: "/app/resources/companies",
            icon: Building2,
          },
        ],
      },
    ];

    if (hasHrProduct.value && activeProduct.value === "hr") {
      navGroups[2]?.items.push(
        {
          label: t("layout.employees"),
          to: "/app/resources/employees",
          icon: Users,
        },
        {
          label: t("layout.attendanceLogs"),
          to: "/app/resources/attendance-logs",
          icon: ClipboardList,
        },
        {
          label: t("layout.jobPositions"),
          to: "/app/resources/job-positions",
          icon: BriefcaseBusiness,
        },
        {
          label: t("layout.workLocations"),
          to: "/app/resources/work-locations",
          icon: MapPin,
        },
        {
          label: t("layout.workShifts"),
          to: "/app/resources/work-shifts",
          icon: Clock3,
        },
        {
          label: t("layout.rolesPermissions"),
          to: "/app/resources/roles",
          icon: ShieldCheck,
        }
      );
    }

    if (hasCrmProduct.value && activeProduct.value === "crm") {
      navGroups.push({
        title: t("layout.crm"),
        items: [
          {
            label: t("ui.customers"),
            to: "/app/resources/customers",
            icon: Users,
          },
          {
            label: t("ui.customerTypes"),
            to: "/app/resources/customer-types",
            icon: ShieldCheck,
          },
          {
            label: t("ui.segments"),
            to: "/app/resources/segments",
            icon: ShieldCheck,
          },
          {
            label: t("ui.areas"),
            to: "/app/resources/areas",
            icon: ShieldCheck,
          },
          {
            label: t("ui.relationshipStatuses"),
            to: "/app/resources/relationship-statuses",
            icon: ShieldCheck,
          },
        ],
      });
    }

    navGroups.push({
      title: t("layout.account"),
      items: [
        {
          label: t("settings.tenant.title"),
          to: "/app/settings/tenant",
          icon: ShieldCheck,
        },
      ],
    });

    let appName = "ArtisanCode";
    if (enabledProducts.value.length === 1) {
      appName =
        primaryProduct.value === "crm" ? "Wikabeton CRM" : "ArtisanCode HR";
    }

    return {
      appName,
      navGroups,
    };
  });

  const productAppName = computed(() => config.value.appName);
  const navGroups = computed(() => config.value.navGroups);

  return {
    activeProduct,
    navGroups,
    productAppName,
    primaryProduct,
  };
};
