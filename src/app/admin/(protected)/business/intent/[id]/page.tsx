import { notFound } from "next/navigation";
import { getIntentById } from "@/lib/data/intents";
import { isValidIntentObjectId } from "@/lib/validations/intent";
import { buildIntentListHref } from "@/lib/business/intents/list-url";
import IntentDetail from "@/components/admin/business/intents/IntentDetail";

type IntentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function IntentDetailPage({
  params,
  searchParams,
}: IntentDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  if (!isValidIntentObjectId(id)) {
    notFound();
  }

  const intent = await getIntentById(id);
  if (!intent) {
    notFound();
  }

  const listReturnHref = buildIntentListHref({
    status: "new",
    classification: "inbox",
  });

  return (
    <IntentDetail
      intent={intent}
      listReturnHref={listReturnHref}
      errorMessage={query.error ? decodeURIComponent(query.error) : undefined}
    />
  );
}
