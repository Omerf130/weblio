import { getProjectsPageProjects } from "@/lib/data/projects";
import Projects from "../../pages/projects/Projects";

export default async function ProjectsRoute() {
  const projects = await getProjectsPageProjects();

  return <Projects projects={projects} />;
}
