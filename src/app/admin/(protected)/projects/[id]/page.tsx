import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/projects/ProjectForm";
import { getProjectById } from "@/lib/data/projects";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return <ProjectForm project={project} />;
}
