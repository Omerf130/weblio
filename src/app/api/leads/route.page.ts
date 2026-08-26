import { createWebsiteLead } from "@/lib/data/leads";
import {
  safeParseWebsiteLeadInput,
  websiteLeadInputFromFormData,
} from "@/lib/validations/lead";

export const runtime = "nodejs";

const GENERIC_PUBLIC_ERROR = "לא ניתן לשלוח את הפנייה כרגע. נסו שוב מאוחר יותר.";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = safeParseWebsiteLeadInput(websiteLeadInputFromFormData(formData));

    if (!parsed.success) {
      return Response.json({ error: GENERIC_PUBLIC_ERROR }, { status: 400 });
    }

    await createWebsiteLead(parsed.data);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: GENERIC_PUBLIC_ERROR }, { status: 500 });
  }
}
