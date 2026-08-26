import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { matchesLeadSearch, parseLeadSourceFilter } from "@/lib/leads/rules";
import type { WebsiteLeadInput, LandingPageLeadInput } from "@/lib/validations/lead";
import {
  LEAD_NUMBER_COUNTER_ID,
  LeadCounter,
} from "@/models/LeadCounter";
import { Lead, type LeadDocument } from "@/models/Lead";
import type {
  AdminLeadDetailDto,
  AdminLeadDto,
  LeadSource,
  LeadStatus,
  QualificationStatus,
} from "@/types/lead";

type LeanLead = Omit<LeadDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toAdminLeadDto(lead: LeanLead): AdminLeadDto {
  return {
    id: lead._id.toString(),
    leadNumber: lead.leadNumber,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    source: lead.source as LeadSource,
    status: lead.status as LeadStatus,
    isRead: lead.isRead,
    createdAt: lead.createdAt.toISOString(),
  };
}

function toAdminLeadDetailDto(lead: LeanLead): AdminLeadDetailDto {
  return {
    ...toAdminLeadDto(lead),
    message: lead.message || undefined,
    sourcePage: lead.sourcePage,
    campaign: lead.campaign || undefined,
    internalNotes: lead.internalNotes ?? "",
    lastContactAt: lead.lastContactAt?.toISOString(),
    utm_source: lead.utm_source || undefined,
    utm_medium: lead.utm_medium || undefined,
    utm_campaign: lead.utm_campaign || undefined,
    utm_content: lead.utm_content || undefined,
    qualification: lead.qualification
      ? {
          answers: (lead.qualification.answers ?? []).map((answer) => ({
            key: answer.key,
            question: answer.question,
            answer: answer.answer,
          })),
          completedAt: lead.qualification.completedAt?.toISOString(),
        }
      : undefined,
    qualificationStatus: (lead.qualificationStatus ?? "pending") as QualificationStatus,
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function getNextLeadNumber(): Promise<number> {
  await connectDB();

  const counter = await LeadCounter.findByIdAndUpdate(
    LEAD_NUMBER_COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<{ seq: number }>();

  return counter?.seq ?? 1001;
}

export async function createWebsiteLead(
  input: WebsiteLeadInput
): Promise<AdminLeadDetailDto> {
  await connectDB();

  const leadNumber = await getNextLeadNumber();

  const lead = await Lead.create({
    leadNumber,
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: "website",
    sourcePage: "/",
    status: "new",
    isRead: false,
    internalNotes: "",
    qualificationStatus: "pending",
    ...(input.utm_source ? { utm_source: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign: input.utm_campaign } : {}),
    ...(input.utm_content ? { utm_content: input.utm_content } : {}),
  });

  return toAdminLeadDetailDto(lead.toObject() as LeanLead);
}

export async function createLandingPageLead(
  input: LandingPageLeadInput
): Promise<AdminLeadDetailDto> {
  await connectDB();

  const leadNumber = await getNextLeadNumber();

  const lead = await Lead.create({
    leadNumber,
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: "landingPage",
    sourcePage: "/build-your-dream",
    status: "new",
    isRead: false,
    internalNotes: "",
    qualificationStatus: "pending",
    ...(input.message ? { message: input.message } : {}),
    ...(input.utm_source ? { utm_source: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign: input.utm_campaign } : {}),
    ...(input.utm_content ? { utm_content: input.utm_content } : {}),
  });

  return toAdminLeadDetailDto(lead.toObject() as LeanLead);
}

export async function updateLeadQualification(
  id: string,
  answers: { key: string; question: string; answer: string }[]
): Promise<AdminLeadDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const lead = await Lead.findByIdAndUpdate(
    id,
    {
      $set: {
        qualification: {
          answers,
          completedAt: new Date(),
        },
        qualificationStatus: "completed",
      },
    },
    { new: true }
  ).lean<LeanLead | null>();

  return lead ? toAdminLeadDetailDto(lead) : null;
}

export async function getAdminLeads(options: {
  source?: string;
  q?: string;
}): Promise<AdminLeadDto[]> {
  await connectDB();

  const sourceFilter = parseLeadSourceFilter(options.source);
  const query: Record<string, unknown> = {};

  if (sourceFilter !== "all") {
    query.source = sourceFilter;
  }

  const leads = await Lead.find(query)
    .sort({ createdAt: -1 })
    .lean<LeanLead[]>();

  const searchQuery = options.q?.trim() ?? "";
  const filtered = searchQuery
    ? leads.filter((lead) => matchesLeadSearch(toAdminLeadDto(lead), searchQuery))
    : leads;

  return filtered.map(toAdminLeadDto);
}

export async function getLeadById(id: string): Promise<AdminLeadDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const lead = await Lead.findById(id).lean<LeanLead | null>();
  if (!lead) {
    return null;
  }

  return toAdminLeadDetailDto(lead);
}

export async function getUnreadLeadCount(): Promise<number> {
  await connectDB();
  return Lead.countDocuments({ isRead: false });
}

export async function markLeadRead(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectDB();

  const result = await Lead.updateOne({ _id: id }, { $set: { isRead: true } });
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

export async function markLeadUnread(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectDB();

  const result = await Lead.updateOne({ _id: id }, { $set: { isRead: false } });
  return result.modifiedCount > 0;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<AdminLeadDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const existing = await Lead.findById(id).lean<LeanLead | null>();
  if (!existing) {
    return null;
  }

  const update: Record<string, unknown> = { status };

  if (status === "contacted" && existing.status !== "contacted") {
    update.lastContactAt = new Date();
  }

  const lead = await Lead.findByIdAndUpdate(id, { $set: update }, { new: true }).lean<
    LeanLead | null
  >();

  return lead ? toAdminLeadDetailDto(lead) : null;
}

export async function updateLeadNotes(
  id: string,
  internalNotes: string
): Promise<AdminLeadDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const lead = await Lead.findByIdAndUpdate(
    id,
    { $set: { internalNotes } },
    { new: true }
  ).lean<LeanLead | null>();

  return lead ? toAdminLeadDetailDto(lead) : null;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectDB();

  const result = await Lead.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
