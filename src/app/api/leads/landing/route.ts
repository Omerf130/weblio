import { createLandingPageLead } from "@/lib/data/leads";
import {
  createLeadCompletionToken,
  LEAD_COMPLETION_COOKIE,
} from "@/lib/leads/completion-token";
import {
  landingPageLeadInputFromFormData,
  safeParseLandingPageLeadInput,
} from "@/lib/validations/lead";

export const runtime = "nodejs";

const GENERIC_ERROR = "לא ניתן לשלוח את הפרטים כרגע. נסו שוב מאוחר יותר.";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = safeParseLandingPageLeadInput(
      landingPageLeadInputFromFormData(formData)
    );

    if (!parsed.success) {
      return Response.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const lead = await createLandingPageLead(parsed.data);
    const token = createLeadCompletionToken(lead.id);

    return new Response(JSON.stringify({ redirect: "/build-your-dream/thank-you" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${LEAD_COMPLETION_COOKIE}=${token}; Path=/build-your-dream; HttpOnly; SameSite=Lax; Max-Age=86400`,
      },
    });
  } catch {
    return Response.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
