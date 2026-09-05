import { getHomeProjects } from "@/lib/data/projects";
import { createWebsiteLeadAction } from "@/lib/leads/actions";
import HomeClient from "../components/home/HomeClient";

export default async function Page() {
  const homeProjects = await getHomeProjects();

  return (
    <HomeClient
      homeProjects={homeProjects}
      leadFormAction={createWebsiteLeadAction}
    />
  );
}
