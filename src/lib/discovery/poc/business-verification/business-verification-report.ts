import type {
  BusinessVerificationPocArtifact,
  ShortlistEvaluation,
  VerificationOutcome,
} from "@/lib/discovery/poc/business-verification/types";

const SECRET_PATTERNS = [/tvly-/i, /TAVILY_API_KEY/i, /AIza/i, /GOOGLE_PLACES/i, /Bearer\s+\S+/i];

export function assertBusinessVerificationReportContainsNoSecrets(text: string): void {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("BUSINESS_VERIFICATION_POC_SECRET_LEAK");
    }
  }
}

function emptyOutcomes(): Record<VerificationOutcome, number> {
  return {
    websiteConfirmed: 0,
    noWebsiteListedAndNotFound: 0,
    socialOnly: 0,
    ambiguous: 0,
    insufficientEvidence: 0,
  };
}

export function countOutcomes(rows: ShortlistEvaluation[]): Record<VerificationOutcome, number> {
  const counts = emptyOutcomes();
  for (const row of rows) {
    counts[row.verificationOutcome] += 1;
  }
  return counts;
}

function formatEvaluationBlock(row: ShortlistEvaluation): string[] {
  const lines: string[] = [];
  lines.push(`### ${row.displayName}`);
  lines.push("");
  lines.push(`- Place ID: ${row.placeId}`);
  lines.push(`- Primary type: ${row.primaryType ?? "—"}`);
  lines.push(`- Address: ${row.formattedAddress}`);
  lines.push(`- Google Maps: ${row.googleMapsUri ?? "—"}`);
  lines.push(`- Outcome: ${row.verificationOutcome}`);
  lines.push(`- Inbox eligible: ${row.inboxEligible ? "yes" : "no"}`);
  lines.push(`- Reason (HE): ${row.reasonHe}`);
  if (row.tavilyQuery) {
    lines.push(`- Tavily query: ${row.tavilyQuery}`);
  }
  if (row.tavilyError) {
    lines.push(`- Tavily error: ${row.tavilyError}`);
  }
  lines.push("- Matching explanation:");
  for (const note of row.matchingExplanation) {
    lines.push(`  - ${note}`);
  }
  lines.push("- Tavily evidence:");
  if (row.tavilyEvidence.length === 0) {
    lines.push("  - (none)");
  } else {
    for (const ev of row.tavilyEvidence) {
      lines.push(
        `  - #${ev.rank} ${ev.domain ?? "?"} [${ev.domainCategory}] score=${ev.nameMatchScore} loc=${ev.locationMentioned}`
      );
      if (ev.title) {
        lines.push(`    - title: ${ev.title}`);
      }
      if (ev.url) {
        lines.push(`    - url: ${ev.url}`);
      }
    }
  }
  lines.push(`- manualReview: ${row.manualReview === null ? "null" : row.manualReview}`);
  lines.push("");
  return lines;
}

export function buildBusinessVerificationReportMarkdown(
  artifact: BusinessVerificationPocArtifact
): string {
  const lines: string[] = [];
  lines.push("# Business Discovery Verification PoC Report");
  lines.push("");
  lines.push("## A. Configuration");
  lines.push("");
  lines.push(`- City: ${artifact.config.city}`);
  lines.push(`- Category: ${artifact.config.categoryLabel}`);
  lines.push(`- Text query: ${artifact.config.textQuery}`);
  lines.push(`- Included type: ${artifact.config.includedType}`);
  lines.push(`- Result cap: ${artifact.config.maxGoogleResults}`);
  lines.push(`- Places Text Search requests: ${artifact.google.textSearchRequests}`);
  lines.push(`- Tavily verification requests: ${artifact.tavily.verificationRequests}`);
  lines.push(`- Field mask: ${artifact.google.fieldMask}`);
  lines.push(`- Google SKU note: ${artifact.google.skuNote}`);
  lines.push("");
  lines.push("## B. Funnel metrics");
  lines.push("");
  lines.push(`- Total Google results: ${artifact.funnel.totalGoogleResults}`);
  lines.push(`- Operational: ${artifact.funnel.operational}`);
  lines.push(`- Non-operational: ${artifact.funnel.nonOperational}`);
  lines.push(`- Provider website listed: ${artifact.funnel.providerWebsiteListed}`);
  lines.push(`- Provider website not listed: ${artifact.funnel.providerWebsiteNotListed}`);
  lines.push(`- Unique shortlist after Place ID dedupe: ${artifact.funnel.uniqueShortlistAfterDedupe}`);
  lines.push(`- Category mismatch excluded: ${artifact.funnel.categoryMismatchExcluded}`);
  lines.push("");
  lines.push("## C. Verification outcomes");
  lines.push("");
  for (const [key, value] of Object.entries(artifact.outcomes)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  lines.push("## D. Final candidates (inbox-eligible)");
  lines.push("");
  if (artifact.finalCandidates.length === 0) {
    lines.push("(none)");
    lines.push("");
  } else {
    for (const row of artifact.finalCandidates) {
      lines.push(...formatEvaluationBlock(row));
    }
  }
  lines.push("## E. All evaluated shortlist rows");
  lines.push("");
  for (const row of artifact.shortlistEvaluations) {
    lines.push(...formatEvaluationBlock(row));
  }
  lines.push("## F. Cost / request accounting");
  lines.push("");
  lines.push(`- Google Places Text Search requests: ${artifact.google.textSearchRequests}`);
  lines.push(`- Tavily search requests: ${artifact.tavily.verificationRequests}`);
  lines.push(`- Tavily search depth: ${artifact.tavily.searchDepth}`);
  lines.push("- Currency cost: not computed in PoC (billing depends on Google Cloud / Tavily account).");
  lines.push("");
  lines.push(`Run at: ${artifact.runAt}`);
  lines.push("");
  return lines.join("\n");
}
