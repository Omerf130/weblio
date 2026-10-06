import type { ProjectShowcaseImageDocument } from "@/lib/projects/project-document-mapper";
import { isManagedProjectsPageShowcase } from "@/lib/storage/project-images";
import type { ProjectImageRef } from "@/lib/storage/project-images";

export type ResolveProjectsPageShowcaseInput = {
  existing?: ProjectShowcaseImageDocument | null;
  uploaded?: ProjectImageRef | null;
  removeRequested: boolean;
  showcaseAlt: string;
};

export type ResolveProjectsPageShowcaseResult =
  | { kind: "omit" }
  | { kind: "apply"; showcase: ProjectShowcaseImageDocument | null; deleteManagedKey?: string };

export function resolveProjectsPageShowcaseUpdate(
  input: ResolveProjectsPageShowcaseInput
): ResolveProjectsPageShowcaseResult {
  const previousManagedKey =
    input.existing?.storageKey && isManagedProjectsPageShowcase(input.existing.storageKey)
      ? input.existing.storageKey
      : undefined;

  if (input.uploaded) {
    return {
      kind: "apply",
      showcase: {
        url: input.uploaded.url,
        alt: input.showcaseAlt.trim(),
        ...(input.uploaded.storageKey ? { storageKey: input.uploaded.storageKey } : {}),
      },
      deleteManagedKey:
        previousManagedKey && previousManagedKey !== input.uploaded.storageKey
          ? previousManagedKey
          : undefined,
    };
  }

  if (input.removeRequested && input.existing?.url) {
    return {
      kind: "apply",
      showcase: null,
      deleteManagedKey: previousManagedKey,
    };
  }

  return { kind: "omit" };
}
