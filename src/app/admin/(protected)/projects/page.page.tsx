import ProjectsList from "@/components/admin/projects/ProjectsList";
import { getAdminProjects } from "@/lib/data/projects";

type ProjectsAdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProjectsAdminPage({
  searchParams,
}: ProjectsAdminPageProps) {
  const params = await searchParams;
  const projects = await getAdminProjects();

  return (
    <ProjectsList
      projects={projects}
      errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
    />
  );
}
