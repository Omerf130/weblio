import mongoose from "mongoose";
import {
  assertOpportunityStatusTransition,
  normalizeOpportunityListPagination,
} from "@/lib/business/opportunities/rules";
import { connectDB } from "@/lib/db/mongoose";
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput,
} from "@/lib/validations/opportunity";
import { Opportunity, type OpportunityDocument } from "@/models/Opportunity";
import type {
  AdminOpportunityDetailDto,
  AdminOpportunityDto,
  OpportunityClassification,
  OpportunityListOptions,
  OpportunityListResult,
  OpportunitySource,
  OpportunityStatus,
  OpportunitySummary,
} from "@/types/opportunity";

type LeanOpportunity = Omit<OpportunityDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toAdminOpportunityDto(doc: LeanOpportunity): AdminOpportunityDto {
  return {
    id: doc._id.toString(),
    title: doc.title,
    businessName: doc.businessName || undefined,
    contactName: doc.contactName || undefined,
    phone: doc.phone || undefined,
    email: doc.email || undefined,
    source: doc.source as OpportunitySource,
    classification: doc.classification as OpportunityClassification,
    status: doc.status as OpportunityStatus,
    sourceUrl: doc.sourceUrl || undefined,
    sourcePlatform: doc.sourcePlatform || undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    leadId: doc.leadId?.toString(),
  };
}

function toAdminOpportunityDetailDto(doc: LeanOpportunity): AdminOpportunityDetailDto {
  return {
    ...toAdminOpportunityDto(doc),
    description: doc.description || undefined,
    relevanceNote: doc.relevanceNote || undefined,
    internalNotes: doc.internalNotes ?? "",
    leadId: doc.leadId?.toString(),
    convertedAt: doc.convertedAt?.toISOString(),
    externalSourceId: doc.externalSourceId || undefined,
    intentId: doc.intentId?.toString(),
  };
}

function buildOpportunityListQuery(
  options: Pick<
    OpportunityListOptions,
    "status" | "classification" | "source" | "q"
  >
): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (options.status) {
    query.status = options.status;
  }

  if (options.classification) {
    query.classification = options.classification;
  }

  if (options.source) {
    query.source = options.source;
  }

  const search = options.q?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { title: pattern },
      { businessName: pattern },
      { contactName: pattern },
    ];
  }

  return query;
}

// ── Create ──────────────────────────────────────────────────

export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<AdminOpportunityDetailDto> {
  await connectDB();

  const doc = await Opportunity.create({
    title: input.title,
    businessName: input.businessName,
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    source: input.source,
    classification: input.classification,
    status: "new",
    sourceUrl: input.sourceUrl,
    sourcePlatform: input.sourcePlatform,
    description: input.description,
    relevanceNote: input.relevanceNote,
    internalNotes: input.internalNotes ?? "",
    externalSourceId: input.externalSourceId,
  });

  return toAdminOpportunityDetailDto(doc.toObject() as LeanOpportunity);
}

// ── Read ────────────────────────────────────────────────────

export async function getOpportunityById(
  id: string
): Promise<AdminOpportunityDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const doc = await Opportunity.findById(id).lean<LeanOpportunity | null>();
  return doc ? toAdminOpportunityDetailDto(doc) : null;
}

// ── Update ──────────────────────────────────────────────────

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<AdminOpportunityDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const existing = await Opportunity.findById(id).lean<LeanOpportunity | null>();
  if (!existing) {
    return null;
  }

  if (existing.status === "converted") {
    throw new Error("OPPORTUNITY_CONVERTED_LOCKED");
  }

  const doc = await Opportunity.findByIdAndUpdate(
    id,
    {
      $set: {
        title: input.title,
        businessName: input.businessName ?? null,
        contactName: input.contactName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        source: input.source,
        classification: input.classification,
        sourceUrl: input.sourceUrl ?? null,
        sourcePlatform: input.sourcePlatform ?? null,
        description: input.description ?? null,
        relevanceNote: input.relevanceNote ?? null,
        internalNotes: input.internalNotes ?? "",
        externalSourceId: input.externalSourceId ?? null,
      },
    },
    { new: true }
  ).lean<LeanOpportunity | null>();

  return doc ? toAdminOpportunityDetailDto(doc) : null;
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus
): Promise<AdminOpportunityDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const existing = await Opportunity.findById(id).lean<LeanOpportunity | null>();
  if (!existing) {
    return null;
  }

  const currentStatus = existing.status as OpportunityStatus;
  assertOpportunityStatusTransition(currentStatus, status);

  const doc = await Opportunity.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).lean<LeanOpportunity | null>();

  return doc ? toAdminOpportunityDetailDto(doc) : null;
}

// ── Delete ──────────────────────────────────────────────────

export async function deleteOpportunity(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectDB();

  const existing = await Opportunity.findById(id)
    .select("status")
    .lean<{ status: string } | null>();

  if (!existing) {
    return false;
  }

  if (existing.status === "converted") {
    throw new Error("OPPORTUNITY_CONVERTED_DELETE_FORBIDDEN");
  }

  const result = await Opportunity.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

// ── Paginated list ──────────────────────────────────────────

export async function getOpportunityList(
  options: OpportunityListOptions = {}
): Promise<OpportunityListResult> {
  await connectDB();

  const { page, pageSize } = normalizeOpportunityListPagination(options);
  const query = buildOpportunityListQuery(options);

  const sortField = options.sort ?? "-createdAt";
  const sortDirection = sortField.startsWith("-") ? -1 : 1;
  const sortKey = sortField.replace(/^-/, "");

  const [docs, totalItems] = await Promise.all([
    Opportunity.find(query)
      .sort({ [sortKey]: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanOpportunity[]>(),
    Opportunity.countDocuments(query),
  ]);

  return {
    items: docs.map(toAdminOpportunityDto),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 0,
  };
}

// ── Summaries ───────────────────────────────────────────────

export async function getRecentOpportunityOptions(
  limit = 50
): Promise<OpportunitySummary[]> {
  await connectDB();

  const docs = await Opportunity.find()
    .select("title businessName")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<Pick<LeanOpportunity, "_id" | "title" | "businessName">[]>();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    businessName: doc.businessName || undefined,
  }));
}

export async function getOpportunitySummaries(
  ids: string[]
): Promise<Map<string, OpportunitySummary>> {
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    return new Map();
  }

  await connectDB();

  const docs = await Opportunity.find({
    _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("title businessName")
    .lean<Pick<LeanOpportunity, "_id" | "title" | "businessName">[]>();

  const map = new Map<string, OpportunitySummary>();
  for (const doc of docs) {
    map.set(doc._id.toString(), {
      id: doc._id.toString(),
      title: doc.title,
      businessName: doc.businessName || undefined,
    });
  }
  return map;
}

export { buildOpportunityListQuery, normalizeOpportunityListPagination };
