import { findLatestDiscoveryRunForCooldown } from "@/lib/data/discovery-runs";
import { getDistinctIntentProviders, listIntents } from "@/lib/data/intents";
import { toLastDiscoveryRunHint } from "@/lib/business/discovery/discovery-run-messages";
import {
  mapIntentFiltersToListOptions,
  parseIntentListPage,
  parseIntentProviderFilter,
  resolveIntentMonitorFilters,
} from "@/lib/business/intents/list-url";
import IntentsManager from "@/components/admin/business/intents/IntentsManager";

type IntentListPageProps = {
  searchParams: Promise<{
    status?: string;
    classification?: string;
    provider?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function IntentMonitorPage({ searchParams }: IntentListPageProps) {
  const query = await searchParams;
  const { status, classification } = resolveIntentMonitorFilters(query);
  const provider = parseIntentProviderFilter(query.provider);
  const q = query.q?.trim() ?? "";
  const page = parseIntentListPage(query.page);

  const listOptions = mapIntentFiltersToListOptions({
    status,
    classification,
    provider: provider === "all" ? undefined : provider,
    q: q || undefined,
    page,
  });

  const [result, providers, latestDiscoveryRun] = await Promise.all([
    listIntents({ ...listOptions, sort: "-discoveredAt" }),
    getDistinctIntentProviders(),
    findLatestDiscoveryRunForCooldown().catch(() => null),
  ]);

  const lastDiscoveryRun = latestDiscoveryRun
    ? toLastDiscoveryRunHint(latestDiscoveryRun)
    : null;

  const hasActiveFilters =
    provider !== "all" ||
    q.length > 0 ||
    status !== "new" ||
    classification !== "inbox";

  return (
    <IntentsManager
      intents={result.items}
      status={status}
      classification={classification}
      provider={provider}
      q={q}
      providers={providers}
      pagination={{
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      }}
      hasActiveFilters={hasActiveFilters}
      lastDiscoveryRun={lastDiscoveryRun}
    />
  );
}
