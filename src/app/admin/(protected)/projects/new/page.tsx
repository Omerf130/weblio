import ProjectForm from "@/components/admin/projects/ProjectForm";
import { getAdminProjects } from "@/lib/data/projects";
import { countProjectsPageFeaturedCandidates } from "@/lib/projects/projects-page-featured-admin";

export default async function NewProjectPage() {
  const projects = await getAdminProjects();
  const projectsPageFeaturedCount =
    countProjectsPageFeaturedCandidates(projects);

  return (
    <ProjectForm projectsPageFeaturedCount={projectsPageFeaturedCount} />
  );
}
