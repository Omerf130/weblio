import type { DiscoveryProviderSearchResult } from "@/lib/discovery/providers/types";

import type { PocInspectionTotals, PocTopDomainEntry } from "@/lib/discovery/poc/poc-inspection";

export type TavilyPocRunArtifact = {
  runAt: string;
  provider: "tavily";
  catalogVersion: number;
  pocVersion?: number;
  strategy?: string;
  profileCount: number;
  maxResultsPerQuery: number;
  apiSearchRequests: number;
  inspection?: PocInspectionTotals & { topDomains: PocTopDomainEntry[] };
  totals: {
    rawResults: number;
    mappedRows: number;
    validationPassed: number;
    validationFailed: number;
    skipped: number;
    duplicateWithinProfile: number;
    duplicateAcrossProfiles: number;
    profileErrors: number;
  };
  profiles: DiscoveryProviderSearchResult[];
};

const SECRET_PATTERNS = [/tvly-/i, /TAVILY_API_KEY/i, /Bearer\s+\S+/i];

export function assertReportContainsNoSecrets(text: string): void {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("POC_REPORT_SECRET_LEAK");
    }
  }
}

function validationLabel(
  validation: DiscoveryProviderSearchResult["rows"][number]["validation"]
): string {
  if (validation.ok) {
    return "ok";
  }
  return validation.issues.join("; ");
}

export function buildTavilyPocReportMarkdown(artifact: TavilyPocRunArtifact): string {
  const lines: string[] = [];

  lines.push("# Tavily Discovery PoC Report");
  lines.push("");
  lines.push(`- Run at: ${artifact.runAt}`);
  lines.push(`- Provider: ${artifact.provider}`);
  if (artifact.pocVersion !== undefined) {
    lines.push(`- PoC version: ${artifact.pocVersion}`);
  }
  if (artifact.strategy) {
    lines.push(`- Strategy: ${artifact.strategy}`);
  }
  lines.push(`- Profiles: ${artifact.profileCount}`);
  lines.push(`- Max results per query: ${artifact.maxResultsPerQuery}`);
  lines.push(`- API search requests: ${artifact.apiSearchRequests}`);
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`- Raw results: ${artifact.totals.rawResults}`);
  lines.push(`- Mapped rows: ${artifact.totals.mappedRows}`);
  lines.push(`- Validation passed: ${artifact.totals.validationPassed}`);
  lines.push(`- Validation failed: ${artifact.totals.validationFailed}`);
  lines.push(`- Skipped/unmapped: ${artifact.totals.skipped}`);
  lines.push(`- Duplicate within profile: ${artifact.totals.duplicateWithinProfile}`);
  lines.push(`- Duplicate across profiles: ${artifact.totals.duplicateAcrossProfiles}`);
  lines.push(`- Profile-level errors: ${artifact.totals.profileErrors}`);
  lines.push("");

  for (const profile of artifact.profiles) {
    lines.push(`## Profile ${profile.profileId}`);
    lines.push("");
    lines.push(`- Query: ${profile.query}`);
    lines.push(`- Raw results: ${profile.rawResultCount}`);
    if (profile.error) {
      lines.push(`- Error: ${profile.error}`);
    }
    lines.push("");

    if (profile.rows.length === 0) {
      lines.push("_No rows._");
      lines.push("");
      continue;
    }

    for (const row of profile.rows) {
      lines.push(`### #${row.rank} ${row.title ?? "(no title)"}`);
      lines.push("");
      if (row.url) {
        lines.push(`- URL: ${row.url}`);
      }
      if (row.domain) {
        lines.push(`- Domain: ${row.domain}`);
      }
      if (row.rank !== undefined) {
        lines.push(`- Rank: ${row.rank}`);
      }
      if (row.score !== undefined) {
        lines.push(`- Tavily score: ${row.score}`);
      }
      if (row.domainCategory) {
        lines.push(`- Domain category (deterministic): ${row.domainCategory}`);
      }
      if (row.publishedAt) {
        lines.push(`- Published: ${row.publishedAt}`);
      }
      lines.push(`- Validation: ${validationLabel(row.validation)}`);
      if (row.skipReason) {
        lines.push(`- Skip/mapping: ${row.skipReason}`);
      }
      const dupStatus =
        row.duplicateWithinProfile || row.duplicateAcrossProfiles ? "duplicate" : "unique";
      lines.push(`- Duplicate status: ${dupStatus}`);
      lines.push(
        `- Duplicates: within=${row.duplicateWithinProfile ? "yes" : "no"}, across=${row.duplicateAcrossProfiles ? "yes" : "no"}`
      );
      if (row.snippet) {
        lines.push("");
        lines.push("```");
        lines.push(row.snippet.slice(0, 1200));
        lines.push("```");
      }
      lines.push("");
    }
  }

  if (artifact.inspection) {
    const ins = artifact.inspection;
    lines.push("## Inspection totals (deterministic domain labels)");
    lines.push("");
    lines.push(`- Unique URLs: ${ins.uniqueUrls}`);
    lines.push(`- Duplicate URL rows: ${ins.duplicateUrlRows}`);
    lines.push(`- Unique domains: ${ins.uniqueDomains}`);
    lines.push(`- Social: ${ins.social}`);
    lines.push(`- Forum/community: ${ins.forumCommunity}`);
    lines.push(`- Video: ${ins.video}`);
    lines.push(`- Service/business-site (heuristic): ${ins.serviceBusinessSite}`);
    lines.push(`- Other: ${ins.other}`);
    lines.push("");
    if (ins.topDomains.length > 0) {
      lines.push("### Top domains by occurrence");
      lines.push("");
      for (const entry of ins.topDomains) {
        lines.push(`- ${entry.domain}: ${entry.count}`);
      }
      lines.push("");
    }
  }

  if (artifact.pocVersion === 2) {
    lines.push("## Manual comparison vs PoC #1");
    lines.push("");
    lines.push(
      "Compare this run with a PoC #1 artifact under `artifacts/discovery-poc/<timestamp>/` (same Tavily settings: 12 profiles × 5 results)."
    );
    lines.push("");
    lines.push("| Metric | PoC #2 (this run) | PoC #1 (fill from prior report) |");
    lines.push("| --- | ---: | ---: |");
    lines.push(`| Profiles | ${artifact.profileCount} | |`);
    lines.push(`| API requests | ${artifact.apiSearchRequests} | |`);
    lines.push(`| Raw results | ${artifact.totals.rawResults} | |`);
    if (artifact.inspection) {
      lines.push(`| Unique URLs | ${artifact.inspection.uniqueUrls} | |`);
      lines.push(`| Duplicate URL rows | ${artifact.inspection.duplicateUrlRows} | |`);
      lines.push(`| Domains | ${artifact.inspection.uniqueDomains} | |`);
      lines.push(`| Social results | ${artifact.inspection.social} | |`);
      lines.push(`| Forum/community results | ${artifact.inspection.forumCommunity} | |`);
      lines.push(`| Video results | ${artifact.inspection.video} | |`);
      lines.push(
        `| Service/business-site (heuristic) | ${artifact.inspection.serviceBusinessSite} | |`
      );
      lines.push(`| Other | ${artifact.inspection.other} | |`);
    }
    lines.push("");
    lines.push(
      "**Question:** Did the explicit-intent query strategy surface more user-generated / demand-side content than PoC #1? Compare social + forum/community counts against service/business-site and review top domains manually. No automatic quality score."
    );
    lines.push("");
  }

  const markdown = lines.join("\n");
  assertReportContainsNoSecrets(markdown);
  return markdown;
}

export function computeTavilyPocTotals(
  profiles: DiscoveryProviderSearchResult[]
): TavilyPocRunArtifact["totals"] {
  let rawResults = 0;
  let mappedRows = 0;
  let validationPassed = 0;
  let validationFailed = 0;
  let skipped = 0;
  let duplicateWithinProfile = 0;
  let duplicateAcrossProfiles = 0;
  let profileErrors = 0;

  for (const profile of profiles) {
    if (profile.error) {
      profileErrors += 1;
    }
    rawResults += profile.rawResultCount;
    for (const row of profile.rows) {
      mappedRows += 1;
      if (row.validation.ok) {
        validationPassed += 1;
      } else {
        validationFailed += 1;
      }
      if (row.skipReason) {
        skipped += 1;
      }
      if (row.duplicateWithinProfile) {
        duplicateWithinProfile += 1;
      }
      if (row.duplicateAcrossProfiles) {
        duplicateAcrossProfiles += 1;
      }
    }
  }

  return {
    rawResults,
    mappedRows,
    validationPassed,
    validationFailed,
    skipped,
    duplicateWithinProfile,
    duplicateAcrossProfiles,
    profileErrors,
  };
}
