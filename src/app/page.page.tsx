import { getHomeProjects } from "@/lib/data/projects";
import HomeClient from "../components/home/HomeClient";

export default async function Page() {
  const homeProjects = await getHomeProjects();

  return <HomeClient homeProjects={homeProjects} />;
}
