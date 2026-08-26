import { redirect } from "next/navigation";
import { getBuildYourDreamContent } from "@/lib/content/build-your-dream/get-build-your-dream-content";
import {
  getLeadIdFromCompletionCookie,
  saveLeadQualificationAction,
} from "@/lib/leads/actions";
import ThankYouPage from "../../../pages/build-your-dream/ThankYouPage";

export default async function BuildYourDreamThankYouRoute() {
  const leadId = await getLeadIdFromCompletionCookie();
  if (!leadId) {
    redirect("/build-your-dream");
  }

  const content = await getBuildYourDreamContent();

  return (
    <ThankYouPage data={content.thankYou} saveAction={saveLeadQualificationAction} />
  );
}
