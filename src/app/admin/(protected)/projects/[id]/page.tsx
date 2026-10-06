import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/projects/ProjectForm";
import { getAdminProjects, getProjectById } from "@/lib/data/projects";
import { countProjectsPageFeaturedCandidates } from "@/lib/projects/projects-page-featured-admin";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const [project, allProjects] = await Promise.all([
    getProjectById(id),
    getAdminProjects(),
  ]);

  if (!project) {
    notFound();
  }

  const projectsPageFeaturedCount =
    countProjectsPageFeaturedCandidates(allProjects);

  return (
    <ProjectForm
      project={project}
      projectsPageFeaturedCount={projectsPageFeaturedCount}
    />
  );
}
