import mongoose from "mongoose";
import { getIntentConversionBlockReason } from "@/lib/business/intents/intent-conversion-eligibility";
import {
  mapIntentToOpportunityFields,
  type IntentForOpportunityMapping,
} from "@/lib/business/intents/intent-opportunity-mapping";
import { getIntentById } from "@/lib/data/intents";
import { getOpportunityById } from "@/lib/data/opportunities";
import { connectDB } from "@/lib/db/mongoose";
import type { ConvertIntentToOpportunityInput } from "@/lib/validations/intent-opportunity-conversion";
import { Intent, type IntentDocument } from "@/models/Intent";
import { Opportunity } from "@/models/Opportunity";
import type { AdminIntentDetailDto } from "@/types/intent";
import type { AdminOpportunityDetailDto } from "@/types/opportunity";
import type { IntentClassification, IntentStatus } from "@/types/intent";

type LeanIntent = Omit<IntentDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toIntentForMapping(doc: LeanIntent): IntentForOpportunityMapping {
  return {
    id: doc._id.toString(),
    title: doc.title || undefined,
    content: doc.content,
    classification: doc.classification as IntentClassification,
    status: doc.status as IntentStatus,
    classificationReason: doc.classificationReason || undefined,
    sourcePlatform: doc.sourcePlatform || undefined,
    sourceUrl: doc.sourceUrl || undefined,
    externalId: doc.externalId || undefined,
    provider: doc.provider,
    dedupeKey: doc.dedupeKey,
    opportunityId: doc.opportunityId?.toString(),
  };
}

export type ConvertIntentToOpportunityResult = {
  opportunity: AdminOpportunityDetailDto;
  intent: AdminIntentDetailDto;
};

export async function convertIntentToOpportunity(
  input: ConvertIntentToOpportunityInput
): Promise<ConvertIntentToOpportunityResult> {
  await connectDB();

  const session = await mongoose.startSession();
  let opportunityId: string | null = null;

  try {
    await session.withTransaction(async () => {
      const intent = await Intent.findById(input.intentId)
        .session(session)
        .lean<LeanIntent | null>();

      if (!intent) {
        throw new Error("INTENT_NOT_FOUND");
      }

      const blockReason = getIntentConversionBlockReason({
        status: intent.status as IntentStatus,
        classification: intent.classification as IntentClassification,
        opportunityId: intent.opportunityId?.toString(),
      });

      if (blockReason === "already_converted") {
        throw new Error("INTENT_ALREADY_CONVERTED");
      }
      if (blockReason === "not_new" || blockReason === "not_convertible_classification") {
        throw new Error("INTENT_NOT_ELIGIBLE");
      }

      const mapped = mapIntentToOpportunityFields(toIntentForMapping(intent));
      const intentObjectId = intent._id;

      const [opportunityDoc] = await Opportunity.create(
        [
          {
            title: mapped.title,
            source: mapped.source,
            classification: mapped.classification,
            status: mapped.status,
            description: mapped.description,
            relevanceNote: mapped.relevanceNote,
            sourcePlatform: mapped.sourcePlatform,
            sourceUrl: mapped.sourceUrl,
            externalSourceId: mapped.externalSourceId,
            internalNotes: mapped.internalNotes,
            intentId: intentObjectId,
          },
        ],
        { session }
      );

      const createdOpportunityId = opportunityDoc._id;
      const convertedAt = new Date();

      const updatedIntent = await Intent.findOneAndUpdate(
        {
          _id: intentObjectId,
          status: "new",
          classification: { $in: ["explicitNeed", "possibleNeed"] },
          $or: [{ opportunityId: { $exists: false } }, { opportunityId: null }],
        },
        {
          $set: {
            status: "saved",
            opportunityId: createdOpportunityId,
            convertedAt,
          },
        },
        { session, returnDocument: "after" }
      ).lean<LeanIntent | null>();

      if (!updatedIntent) {
        throw new Error("INTENT_ALREADY_CONVERTED");
      }

      opportunityId = createdOpportunityId.toString();
    });
  } finally {
    await session.endSession();
  }

  if (!opportunityId) {
    throw new Error("CONVERSION_FAILED");
  }

  const [opportunity, intent] = await Promise.all([
    getOpportunityById(opportunityId),
    getIntentById(input.intentId),
  ]);

  if (!opportunity || !intent) {
    throw new Error("CONVERSION_FAILED");
  }

  return { opportunity, intent };
}
