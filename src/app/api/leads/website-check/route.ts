import { createWebsiteCheckLeadFromAnalysis, WebsiteCheckLeadError } from "@/lib/data/website-check-leads";
import { readWebsiteCheckJsonBody } from "@/lib/website-check/api/read-website-check-json-body";
import { safeParseWebsiteCheckLeadInput } from "@/lib/validations/website-check-lead";

export const runtime = "nodejs";

const GENERIC_PUBLIC_ERROR = "לא ניתן לשלוח את הפנייה כרגע. נסו שוב מאוחר יותר.";

export async function POST(request: Request) {
  try {
    const readResult = await readWebsiteCheckJsonBody(request);
    if (!readResult.ok) {
      return Response.json({ error: GENERIC_PUBLIC_ERROR }, { status: readResult.status });
    }

    const parsed = safeParseWebsiteCheckLeadInput(readResult.body);

    if (!parsed.success) {
      return Response.json({ error: GENERIC_PUBLIC_ERROR }, { status: 400 });
    }

    const result = await createWebsiteCheckLeadFromAnalysis(parsed.data);
    return Response.json({ success: true, leadId: result.leadId });
  } catch (error: unknown) {
    if (error instanceof WebsiteCheckLeadError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: GENERIC_PUBLIC_ERROR }, { status: 500 });
  }
}
