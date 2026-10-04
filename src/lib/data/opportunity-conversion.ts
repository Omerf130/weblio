import mongoose from "mongoose";
import {
  buildLeadInternalNotesFromOpportunity,
  buildLeadMessageFromOpportunity,
} from "@/lib/business/opportunities/conversion-mapping";
import { getNextLeadNumber } from "@/lib/data/leads";
import { connectDB } from "@/lib/db/mongoose";
import type { ConvertOpportunityToLeadInput } from "@/lib/validations/opportunity-conversion";
import { FollowUp } from "@/models/FollowUp";
import { Lead, type LeadDocument } from "@/models/Lead";
import { Opportunity, type OpportunityDocument } from "@/models/Opportunity";
import type { OperationalOpportunityStatusCount } from "@/types/business";
import type { AdminLeadDetailDto } from "@/types/lead";

type LeanLead = Omit<LeadDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

type LeanOpportunity = Omit<OpportunityDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toAdminLeadDetailDto(lead: LeanLead): AdminLeadDetailDto {
  return {
    id: lead._id.toString(),
    leadNumber: lead.leadNumber,
    name: lead.name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    source: lead.source as AdminLeadDetailDto["source"],
    status: lead.status as AdminLeadDetailDto["status"],
    isRead: lead.isRead,
    createdAt: lead.createdAt.toISOString(),
    message: lead.message || undefined,
    sourcePage: lead.sourcePage,
    internalNotes: lead.internalNotes ?? "",
    qualificationStatus: lead.qualificationStatus as AdminLeadDetailDto["qualificationStatus"],
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function convertOpportunityToLead(
  input: ConvertOpportunityToLeadInput
): Promise<AdminLeadDetailDto> {
  await connectDB();

  const session = await mongoose.startSession();
  let createdLead: AdminLeadDetailDto | null = null;

  try {
    await session.withTransaction(async () => {
      const opportunity = await Opportunity.findById(input.opportunityId)
        .session(session)
        .lean<LeanOpportunity | null>();

      if (!opportunity) {
        throw new Error("OPPORTUNITY_NOT_FOUND");
      }

      if (opportunity.status === "converted" || opportunity.leadId) {
        throw new Error("OPPORTUNITY_ALREADY_CONVERTED");
      }

      const leadNumber = await getNextLeadNumber(session);
      const message = buildLeadMessageFromOpportunity({
        description: opportunity.description || undefined,
        relevanceNote: opportunity.relevanceNote || undefined,
        sourceUrl: opportunity.sourceUrl || undefined,
      });
      const internalNotes = buildLeadInternalNotesFromOpportunity(
        { internalNotes: opportunity.internalNotes ?? "" },
        input.opportunityId
      );

      const leadPayload: Record<string, unknown> = {
        leadNumber,
        name: input.name,
        source: "opportunity",
        sourcePage: `/admin/business/opportunities/${input.opportunityId}`,
        status: "new",
        isRead: false,
        internalNotes,
        qualificationStatus: "pending",
      };

      if (input.phone) {
        leadPayload.phone = input.phone;
      }
      if (input.email) {
        leadPayload.email = input.email;
      }
      if (message) {
        leadPayload.message = message;
      }

      const [leadDoc] = await Lead.create([leadPayload], { session });
      const leadId = leadDoc._id;

      const updatedOpportunity = await Opportunity.findOneAndUpdate(
        {
          _id: input.opportunityId,
          status: { $ne: "converted" },
          $or: [{ leadId: { $exists: false } }, { leadId: null }],
        },
        {
          $set: {
            status: "converted",
            leadId,
            convertedAt: new Date(),
          },
        },
        { session, new: true }
      ).lean();

      if (!updatedOpportunity) {
        throw new Error("OPPORTUNITY_ALREADY_CONVERTED");
      }

      await FollowUp.updateMany(
        {
          opportunityId: new mongoose.Types.ObjectId(input.opportunityId),
          $or: [{ leadId: { $exists: false } }, { leadId: null }],
        },
        { $set: { leadId } },
        { session }
      );

      createdLead = toAdminLeadDetailDto(leadDoc.toObject() as LeanLead);
    });
  } finally {
    await session.endSession();
  }

  if (!createdLead) {
    throw new Error("CONVERSION_FAILED");
  }

  return createdLead;
}

export async function getOpportunitySummaryByLeadId(
  leadId: string
): Promise<{ id: string; title: string } | null> {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    return null;
  }

  await connectDB();

  const doc = await Opportunity.findOne({ leadId })
    .select("title")
    .lean<{ _id: mongoose.Types.ObjectId; title: string } | null>();

  if (!doc) {
    return null;
  }

  return { id: doc._id.toString(), title: doc.title };
}

export async function countNewOpportunities(): Promise<number> {
  await connectDB();
  return Opportunity.countDocuments({ status: "new" });
}

export async function countNewOpportunitiesLast7Days(
  since: Date
): Promise<number> {
  await connectDB();
  return Opportunity.countDocuments({
    status: "new",
    createdAt: { $gte: since },
  });
}

export async function countActiveOpportunities(): Promise<number> {
  await connectDB();
  return Opportunity.countDocuments({
    status: { $in: ["new", "researching", "contacted"] },
  });
}

const OPERATIONAL_OPPORTUNITY_STATUSES = ["new", "researching", "contacted"] as const;

export async function countOperationalOpportunityStatuses(): Promise<
  OperationalOpportunityStatusCount[]
> {
  await connectDB();
  const rows = await Opportunity.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $in: [...OPERATIONAL_OPPORTUNITY_STATUSES] } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = new Map(rows.map((row) => [row._id, row.count]));
  return OPERATIONAL_OPPORTUNITY_STATUSES.map((status) => ({
    status,
    count: byStatus.get(status) ?? 0,
  }));
}
