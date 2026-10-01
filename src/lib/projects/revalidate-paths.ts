import { revalidatePath } from "next/cache";

export function revalidateProjectPaths(): void {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}
