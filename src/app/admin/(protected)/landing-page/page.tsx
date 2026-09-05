import { getBuildYourDreamLandingAdminState } from "@/lib/data/build-your-dream-landing";
import LandingPageEditorLoader from "@/components/admin/landing-page/LandingPageEditorLoader";

export default async function AdminLandingPageRoute() {
  const { content, lastSavedAt, isPersisted } = await getBuildYourDreamLandingAdminState();

  return (
    <LandingPageEditorLoader
      initialContent={content}
      lastSavedAt={lastSavedAt}
      isPersisted={isPersisted}
    />
  );
}