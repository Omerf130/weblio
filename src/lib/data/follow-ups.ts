import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { FollowUp, type FollowUpDocument } from "@/models/FollowUp";
import {
  getIsraelTodayRange,
  getIsraelDaysFromNow,
} from "@/lib/business/israel-time";
import type {
  AdminFollowUpDto,
  FollowUpListResult,
  FollowUpStatus,
} from "@/types/follow-up";
import type { CreateFollowUpInput, EditFollowUpInput } from "@/lib/validations/follow-up";

type LeanFollowUp = Omit<FollowUpDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toAdminFollowUpDto(doc: LeanFollowUp): AdminFollowUpDto {
  return {
    id: doc._id.toString(),
    title: doc.title,
    note: doc.note || undefined,
    dueAt: doc.dueAt.toISOString(),
    status: doc.status as FollowUpStatus,
    completedAt: doc.completedAt?.toISOString(),
    leadId: doc.leadId?.toString(),
    opportunityId: doc.opportunityId?.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ── Create ──────────────────────────────────────────────────

export async function createFollowUp(
  input: CreateFollowUpInput
): Promise<AdminFollowUpDto> {
  await connectDB();

  const doc = await FollowUp.create({
    title: input.title,
    note: input.note,
    dueAt: input.dueAt,
    status: "pending",
    ...(input.leadId ? { leadId: new mongoose.Types.ObjectId(input.leadId) } : {}),
    ...(input.opportunityId
      ? { opportunityId: new mongoose.Types.ObjectId(input.opportunityId) }
      : {}),
  });

  return toAdminFollowUpDto(doc.toObject() as LeanFollowUp);
}

// ── Read ────────────────────────────────────────────────────

export async function getFollowUpById(
  id: string
): Promise<AdminFollowUpDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const doc = await FollowUp.findById(id).lean<LeanFollowUp | null>();
  return doc ? toAdminFollowUpDto(doc) : null;
}

// ── Update ──────────────────────────────────────────────────

export async function updateFollowUp(
  id: string,
  input: EditFollowUpInput
): Promise<AdminFollowUpDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const doc = await FollowUp.findByIdAndUpdate(
    id,
    {
      $set: {
        title: input.title,
        note: input.note ?? null,
        dueAt: input.dueAt,
      },
    },
    { new: true }
  ).lean<LeanFollowUp | null>();

  return doc ? toAdminFollowUpDto(doc) : null;
}

// ── Status transitions ─────────────────────────────────────

export async function updateFollowUpStatus(
  id: string,
  status: FollowUpStatus
): Promise<AdminFollowUpDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const update: Record<string, unknown> = { status };

  if (status === "completed") {
    update.completedAt = new Date();
  } else {
    update.completedAt = null;
  }

  const doc = await FollowUp.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).lean<LeanFollowUp | null>();

  return doc ? toAdminFollowUpDto(doc) : null;
}

// ── Delete ──────────────────────────────────────────────────

export async function deleteFollowUp(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectDB();

  const result = await FollowUp.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

// ── Lead-specific queries ───────────────────────────────────

export async function getFollowUpsForLead(
  leadId: string
): Promise<AdminFollowUpDto[]> {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    return [];
  }

  await connectDB();

  const docs = await FollowUp.find({ leadId: new mongoose.Types.ObjectId(leadId) })
    .sort({ dueAt: 1 })
    .lean<LeanFollowUp[]>();

  return docs.map(toAdminFollowUpDto);
}

// ── Time-based queries ──────────────────────────────────────

export async function getPendingFollowUpsDueToday(
  reference = new Date()
): Promise<AdminFollowUpDto[]> {
  await connectDB();

  const { start, end } = getIsraelTodayRange(reference);

  const docs = await FollowUp.find({
    status: "pending",
    dueAt: { $gte: start, $lte: end },
  })
    .sort({ dueAt: 1 })
    .lean<LeanFollowUp[]>();

  return docs.map(toAdminFollowUpDto);
}

export async function getOverdueFollowUps(
  reference = new Date()
): Promise<AdminFollowUpDto[]> {
  await connectDB();

  const { start } = getIsraelTodayRange(reference);

  const docs = await FollowUp.find({
    status: "pending",
    dueAt: { $lt: start },
  })
    .sort({ dueAt: 1 })
    .lean<LeanFollowUp[]>();

  return docs.map(toAdminFollowUpDto);
}

export async function getUpcomingFollowUps(
  days = 7,
  reference = new Date()
): Promise<AdminFollowUpDto[]> {
  await connectDB();

  const { end: todayEnd } = getIsraelTodayRange(reference);
  const futureEnd = getIsraelDaysFromNow(days, reference);

  const docs = await FollowUp.find({
    status: "pending",
    dueAt: { $gt: todayEnd, $lte: futureEnd },
  })
    .sort({ dueAt: 1 })
    .lean<LeanFollowUp[]>();

  return docs.map(toAdminFollowUpDto);
}

export async function getCompletedFollowUps(
  limit = 20
): Promise<AdminFollowUpDto[]> {
  await connectDB();

  const docs = await FollowUp.find({ status: "completed" })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean<LeanFollowUp[]>();

  return docs.map(toAdminFollowUpDto);
}

// ── Paginated list ──────────────────────────────────────────

export type FollowUpListOptions = {
  page?: number;
  pageSize?: number;
  status?: FollowUpStatus;
  leadId?: string;
  sort?: "dueAt" | "-dueAt" | "createdAt" | "-createdAt";
};

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export async function getFollowUpList(
  options: FollowUpListOptions = {}
): Promise<FollowUpListResult> {
  await connectDB();

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));

  const query: Record<string, unknown> = {};

  if (options.status) {
    query.status = options.status;
  }

  if (options.leadId && mongoose.Types.ObjectId.isValid(options.leadId)) {
    query.leadId = new mongoose.Types.ObjectId(options.leadId);
  }

  const sortField = options.sort ?? "dueAt";
  const sortDirection = sortField.startsWith("-") ? -1 : 1;
  const sortKey = sortField.replace(/^-/, "");

  const [docs, total] = await Promise.all([
    FollowUp.find(query)
      .sort({ [sortKey]: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanFollowUp[]>(),
    FollowUp.countDocuments(query),
  ]);

  return {
    items: docs.map(toAdminFollowUpDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ── Counts ──────────────────────────────────────────────────

export async function getOverdueFollowUpCount(
  reference = new Date()
): Promise<number> {
  await connectDB();

  const { start } = getIsraelTodayRange(reference);

  return FollowUp.countDocuments({
    status: "pending",
    dueAt: { $lt: start },
  });
}

export async function getDueTodayFollowUpCount(
  reference = new Date()
): Promise<number> {
  await connectDB();

  const { start, end } = getIsraelTodayRange(reference);

  return FollowUp.countDocuments({
    status: "pending",
    dueAt: { $gte: start, $lte: end },
  });
}
