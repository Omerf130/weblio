import { getBuildYourDreamContent } from "@/lib/content/build-your-dream/get-build-your-dream-content";
import { createLandingPageLeadAction } from "@/lib/leads/actions";
import BuildYourDreamPage from "../../views/build-your-dream/BuildYourDreamPage";

export default async function BuildYourDreamRoute() {
  const content = await getBuildYourDreamContent();

  return (
    <BuildYourDreamPage
      content={content}
      leadFormAction={createLandingPageLeadAction}
    />
  );
}
