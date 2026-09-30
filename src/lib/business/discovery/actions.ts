"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { executeTavilyDiscoveryRun } from "@/lib/business/discovery/execute-tavily-discovery-run";
import type { RunTavilyDiscoveryActionResult } from "@/types/discovery-run";

function revalidateAfterDiscoveryRun(): void {
  revalidatePath("/admin/business/intent");
  revalidatePath("/admin/business");
}

export async function runTavilyDiscoveryAction(): Promise<RunTavilyDiscoveryActionResult> {
  const admin = await requireAdmin();

  const result = await executeTavilyDiscoveryRun(admin);

  if (result.success) {
    revalidateAfterDiscoveryRun();
  }

  return result;
}
