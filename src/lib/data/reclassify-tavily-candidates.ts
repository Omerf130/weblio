import type { ReclassifyIntentCandidate, ReclassifyTimeWindow } from "@/lib/business/intents/reclassify-tavily-intents";
import { connectDB } from "@/lib/db/mongoose";
import { Intent, type IntentDocument } from "@/models/Intent";
import type { IntentClassification, IntentSourceType, IntentStatus } from "@/types/intent";

type LeanIntent = Omit<IntentDocument, keyof import("mongoose").Document> & {
  _id: import("mongoose").Types.ObjectId;
};

export async function listTavilyIntentsInDiscoveryRunWindow(
  window: ReclassifyTimeWindow
): Promise<ReclassifyIntentCandidate[]> {
  await connectDB();

  const docs = await Intent.find({
    provider: "tavily",
    discoveredAt: {
      $gte: window.startedAt,
      $lte: window.completedAt,
    },
  })
    .sort({ discoveredAt: 1 })
    .lean<LeanIntent[]>();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title || undefined,
    content: doc.content,
    provider: doc.provider,
    status: doc.status as IntentStatus,
    classification: doc.classification as IntentClassification,
    classifierVersion: doc.classifierVersion || undefined,
    discoveredAt: doc.discoveredAt,
    sourcePlatform: doc.sourcePlatform || undefined,
    sourceType: doc.sourceType as IntentSourceType | undefined,
  }));
}
