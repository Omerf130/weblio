import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { getWebsiteAnalysisRunById } from "@/lib/data/website-analysis-runs";
import { getNextLeadNumber } from "@/lib/data/leads";
import type { WebsiteCheckLeadInput } from "@/lib/validations/website-check-lead";
import { Lead } from "@/models/Lead";
import { WebsiteAnalysisRun } from "@/models/WebsiteAnalysisRun";

const GENERIC_ERROR = "לא ניתן לשלוח את הפנייה כרגע.";

export class WebsiteCheckLeadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function createWebsiteCheckLeadFromAnalysis(
  input: WebsiteCheckLeadInput
): Promise<{ leadId: string }> {
  if (input.company?.trim()) {
    throw new WebsiteCheckLeadError(400, GENERIC_ERROR);
  }

  if (!mongoose.Types.ObjectId.isValid(input.analysisRunId)) {
    throw new WebsiteCheckLeadError(400, GENERIC_ERROR);
  }

  const run = await getWebsiteAnalysisRunById(input.analysisRunId);
  if (!run || (run.status !== "completed" && run.status !== "partial")) {
    throw new WebsiteCheckLeadError(400, GENERIC_ERROR);
  }

  if (run.urlNormalized !== input.websiteUrl.trim()) {
    throw new WebsiteCheckLeadError(400, GENERIC_ERROR);
  }

  await connectDB();

  if (run.leadId) {
    return { leadId: run.leadId };
  }

  const leadNumber = await getNextLeadNumber();

  const lead = await Lead.create({
    leadNumber,
    name: input.name,
    phone: input.phone,
    email: "",
    source: "websiteCheck",
    sourcePage: "/website-check",
    status: "new",
    isRead: false,
    internalNotes: "",
    qualificationStatus: "pending",
    message: `אתר שנבדק: ${run.urlNormalized}`,
  });

  const linked = await WebsiteAnalysisRun.findOneAndUpdate(
    {
      _id: input.analysisRunId,
      leadId: { $exists: false },
    },
    { $set: { leadId: lead._id } },
    { new: true }
  ).lean();

  if (!linked) {
    await Lead.deleteOne({ _id: lead._id });
    const refreshed = await getWebsiteAnalysisRunById(input.analysisRunId);
    if (refreshed?.leadId) {
      return { leadId: refreshed.leadId };
    }
    throw new WebsiteCheckLeadError(500, GENERIC_ERROR);
  }

  return { leadId: lead._id.toString() };
}
