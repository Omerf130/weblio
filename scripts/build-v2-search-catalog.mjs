import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MCHP = "\u05DE\u05D7\u05E4\u05E9";
const MCHPT = "\u05DE\u05D7\u05E4\u05E9\u05EA";
const MISH = "\u05DE\u05D9\u05E9\u05D4\u05D5";
const TSRICH = "\u05E6\u05E8\u05D9\u05DA";
const TSRICHA = "\u05E6\u05E8\u05D9\u05DB\u05D4";
const MCHPIM = "\u05DE\u05D7\u05E4\u05E9\u05D9\u05DD";

function p(id, category, queryHe, tier, intentStrength, notes, enabled = true) {
  return { id, category, queryHe, enabled, tier, intentStrength, notes };
}

/** V2.2 core (9): evidence-backed buyer language; daily budget. */
const core = [
  p("K01", "explicit_website", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`, "core", "high", "V2.2 core — W1"),
  p("K03", "explicit_recommendation", `${MCHP} \u05D4\u05DE\u05DC\u05E6\u05D4 \u05E2\u05DC \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7`, "core", "high", "V2.2 core — W3"),
  p("K04", "explicit_quote", `${MCHP} \u05D4\u05E6\u05E2\u05EA \u05DE\u05D7\u05D9\u05E8 \u05DC\u05D1\u05E0\u05D9\u05D9\u05EA \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`, "core", "high", "V2.2 core — quote seek"),
  p("K05", "explicit_landing_page", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D3\u05E3 \u05E0\u05D7\u05D9\u05EA\u05D4 \u05DC\u05E2\u05E1\u05E7`, "core", "high", "V2.2 core — W5"),
  p("K07", "explicit_ecommerce", `${TSRICH} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D7\u05E0\u05D5\u05EA \u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8\u05D9\u05EA \u05DC\u05E2\u05E1\u05E7`, "core", "high", "V2.2 core — W7"),
  p("K08", "explicit_website", `${MCHP} \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "core", "high", "V2.2 core — Run1 explicitNeed"),
  p("K13", "explicit_landing_page", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05D3\u05E3 \u05E0\u05D7\u05D9\u05EA\u05D4 \u05DC\u05E7\u05DE\u05E4\u05D9\u05D9\u05DF \u05E4\u05E8\u05E1\u05D5\u05DD`, "core", "high", "V2.2 core — Run1 explicitNeed"),
  p("R05", "explicit_website", `${MCHP} \u05DE\u05E4\u05EA\u05D7 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05E9\u05DC \u05E2\u05E1\u05E7`, "core", "high", "V2.2 promoted — Run1 explicitNeed"),
  p("R06", "explicit_ecommerce", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05D0\u05EA\u05E8 \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA \u05D0\u05D5\u05E0\u05DC\u05D9\u05D9\u05DF`, "core", "high", "V2.2 promoted — Run1 explicitNeed"),
];

const rotating = [
  p("K02", "explicit_ecommerce", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D7\u05E0\u05D5\u05EA Shopify`, "rotating", "medium", "V2.2 demoted from core"),
  p("K06", "explicit_redesign", `${MCHPIM} ${MISH} \u05E9\u05D9\u05E2\u05E6\u05D1 \u05DE\u05D7\u05D3\u05E9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "rotating", "medium", "V2.2 rewrite + demoted from core"),
  p("K09", "explicit_website", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05EA\u05D3\u05DE\u05D9\u05EA \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "rotating", "medium", "V2.2 rewrite + demoted from core"),
  p("K10", "explicit_recommendation", `${TSRICH} \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7 \u05D7\u05D3\u05E9 \u05DE\u05D9 \u05DE\u05DE\u05DC\u05D9\u05E5 \u05E2\u05DC \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD`, "rotating", "medium", "V2.2 demoted from core"),
  p("K11", "explicit_ecommerce", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05D7\u05E0\u05D5\u05EA WooCommerce \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 demoted from core"),
  p("K12", "site_problem", `${MCHPIM} \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05E9\u05D9\u05EA\u05E7\u05DF \u05D0\u05EA\u05E8 \u05E9\u05DC\u05D0 \u05E2\u05D5\u05D1\u05D3 \u05D8\u05D5\u05D1 \u05D1\u05E0\u05D9\u05D9\u05D3 \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 rewrite + demoted from core"),
  p("K14", "site_problem", `${MCHP} ${MISH} \u05E9\u05D9\u05E9\u05D3\u05E8\u05D2 \u05DC\u05D9 \u05D0\u05EA\u05E8 WordPress \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 rewrite"),
  p("K15", "site_problem", `${MCHPIM} ${MISH} \u05DC\u05E9\u05D9\u05E4\u05D5\u05E8 \u05D0\u05EA\u05E8 \u05E2\u05E1\u05E7\u05D9 (\u05D7\u05D5\u05D5\u05D9\u05EA \u05DE\u05E9\u05EA\u05DE\u05E9)`, "rotating", "medium", "V2.2 rewrite"),
  p("R01", "explicit_website", `${MCHPT} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "PoC2 A4"),
  p("R02", "explicit_recommendation", `${MCHPT} \u05D4\u05DE\u05DC\u05E6\u05D4 \u05E2\u05DC \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "Feminine recommendation"),
  p("R03", "explicit_website", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8`, "rotating", "medium", "PoC2 A3"),
  p("R04", "explicit_recommendation", `${MISH} \u05DE\u05DB\u05D9\u05E8 \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05D0\u05DE\u05D9\u05DF`, "rotating", "medium", "PoC1 A2"),
  p("R07", "explicit_ecommerce", `${TSRICH} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D7\u05E0\u05D5\u05EA \u05D0\u05D5\u05E0\u05DC\u05D9\u05D9\u05DF \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "rotating", "medium", "V2.2 rewrite"),
  p("R08", "site_problem", `${MCHP} ${MISH} \u05E9\u05D9\u05E9\u05D3\u05E8\u05D2 \u05DC\u05D9 \u05D0\u05EA \u05D4\u05D0\u05EA\u05E8 \u05E9\u05DC \u05D4\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 rewrite"),
  p("R09", "site_problem", `${MCHP} ${MISH} \u05E9\u05D9\u05E2\u05E6\u05D1 \u05DE\u05D7\u05D3\u05E9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "rotating", "medium", "V2.2 rewrite"),
  p("R10", "site_problem", `${MCHPIM} ${MISH} \u05E9\u05D9\u05EA\u05E7\u05DF \u05D0\u05EA\u05E8 \u05E9\u05DC\u05D0 \u05E0\u05E8\u05D0\u05D4 \u05D8\u05D5\u05D1 \u05D1\u05E0\u05D9\u05D9\u05D3 \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 rewrite"),
  p("R11", "explicit_landing_page", `${MCHP} \u05D1\u05D5\u05E0\u05D4 \u05D3\u05E4\u05D9 \u05E0\u05D7\u05D9\u05EA\u05D4 \u05DC\u05E2\u05E1\u05E7\u05D9\u05DD`, "rotating", "medium", "LP builder role"),
  p("R12", "explicit_landing_page", `${MCHPT} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D3\u05E3 \u05E0\u05D7\u05D9\u05EA\u05D4`, "rotating", "medium", "PoC2 B2"),
  p("R13", "explicit_ecommerce", `${MCHP} ${MISH} \u05DC\u05D1\u05E0\u05D9\u05D9\u05EA \u05D7\u05E0\u05D5\u05EA Shopify`, "rotating", "medium", "Shopify alternate"),
  p("R14", "explicit_recommendation", `${MCHP} \u05D4\u05DE\u05DC\u05E6\u05D4 \u05E2\u05DC \u05D7\u05D1\u05E8\u05D4 \u05DC\u05D1\u05E0\u05D9\u05D9\u05EA \u05D0\u05EA\u05E8\u05D9\u05DD`, "rotating", "medium", "Company tone"),
  p("R15", "explicit_website", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05D0\u05EA\u05E8 \u05E9\u05E2\u05D5\u05D1\u05D3 \u05D8\u05D5\u05D1 \u05D2\u05DD \u05D1\u05E0\u05D9\u05D9\u05D3 \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "V2.2 rewrite"),
  p("R16", "explicit_website", `${TSRICHA} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`, "rotating", "medium", "Feminine צריכה"),
  p("R17", "specific_need", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05D0\u05EA\u05E8 \u05DC\u05E1\u05D8\u05D0\u05E8\u05D0\u05E4 \u05E7\u05D8\u05DF`, "rotating", "medium", "Startup"),
  p("R18", "explicit_website", `${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7 \u05E2\u05DD SEO`, "rotating", "medium", "V2.2 rewrite"),
  p("R19", "site_problem", `${MCHP} ${MISH} \u05DC\u05EA\u05D7\u05D6\u05D5\u05E7 \u05D0\u05EA\u05E8 \u05E2\u05E1\u05E7\u05D9`, "rotating", "medium", "V2.2 rewrite"),
  p("R20", "explicit_website", `${MCHP} \u05DE\u05E2\u05E6\u05D1 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7 \u05E9\u05DC\u05D9`, "rotating", "medium", "Designer title"),
  p("R21", "site_problem", `${MCHP} ${MISH} \u05E9\u05D9\u05EA\u05E7\u05DF \u05D0\u05EA\u05E8 \u05E2\u05E1\u05E7\u05D9 \u05E9\u05D1\u05D5\u05E8`, "rotating", "medium", "Broken site"),
  p("R22", "research", `${MCHP} \u05D4\u05DE\u05DC\u05E6\u05D4 \u05E2\u05DC \u05D1\u05D5\u05E0\u05D4 \u05D0\u05D5 \u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D4 \u05DC\u05D7\u05E0\u05D5\u05EA \u05D0\u05D5\u05E0\u05DC\u05D9\u05D9\u05DF \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`, "rotating", "medium", "V2.2 rewrite"),
];

const experimental = [
  p("X01", "research", "\u05DB\u05DE\u05D4 \u05E2\u05D5\u05DC\u05D4 \u05DC\u05D1\u05E0\u05D5\u05EA \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF", "experimental", "exploratory", "Price research"),
  p("X02", "research", "\u05D4\u05D0\u05DD \u05DB\u05D3\u05D0\u05D9 \u05DC\u05D9 \u05DB\u05D1\u05E2\u05DC \u05E2\u05E1\u05E7 \u05DC\u05D1\u05E0\u05D5\u05EA \u05D0\u05EA\u05E8 \u05D0\u05D5 \u05DC\u05D4\u05E1\u05EA\u05E4\u05E7 \u05D1\u05D0\u05D9\u05E0\u05E1\u05D8\u05D2\u05E8\u05DD", "experimental", "exploratory", "V2.2 rewrite"),
  p("X03", "possible_need", "\u05E4\u05EA\u05D7\u05EA\u05D9 \u05E2\u05E1\u05E7 \u05D7\u05D3\u05E9 \u05D4\u05D0\u05DD \u05D0\u05E0\u05D9 \u05E6\u05E8\u05D9\u05DA \u05D0\u05EA\u05E8", "experimental", "exploratory", "PoC1 E1"),
  p("X04", "possible_need", "\u05E2\u05E1\u05E7 \u05DE\u05E7\u05D5\u05DE\u05D9 \u05D1\u05DC\u05D9 \u05D0\u05EA\u05E8 \u05D4\u05D0\u05DD \u05D6\u05D4 \u05DE\u05E4\u05E8\u05D9\u05E2", "experimental", "exploratory", "PoC1 E3"),
  p("X05", "research", "\u05D0\u05D9\u05DA \u05D1\u05D5\u05D7\u05E8\u05D9\u05DD \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7", "experimental", "exploratory", "Selection guide"),
  p("X06", "research", "\u05DE\u05D4 \u05D4\u05D4\u05D1\u05D3\u05DC \u05D1\u05D9\u05DF \u05D3\u05E3 \u05E0\u05D7\u05D9\u05EA\u05D4 \u05DC\u05D0\u05EA\u05E8 \u05EA\u05D3\u05DE\u05D9\u05EA \u05DC\u05E2\u05E1\u05E7", "experimental", "exploratory", "V2.2 disabled — education", false),
  p("X07", "research", `${MCHP} \u05D7\u05D5\u05D5\u05EA \u05D3\u05E2\u05EA \u05E2\u05DC \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD`, "experimental", "exploratory", "Reviews"),
  p("X08", "research", "Wix \u05D0\u05D5 \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9 \u05DE\u05D4 \u05E2\u05D3\u05D9\u05E3 \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF", "experimental", "exploratory", "V2.2 disabled — DIY compare", false),
  p("X09", "research", "\u05DC\u05E4\u05E0\u05D9 \u05E9\u05DE\u05D6\u05DE\u05D9\u05E0\u05D9\u05DD \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8 \u2014 \u05DE\u05D7\u05E4\u05E9\u05D9\u05DD \u05D4\u05DE\u05DC\u05E6\u05D5\u05EA \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF", "experimental", "exploratory", "V2.2 disabled — pre-hire research", false),
  p(
    "X10",
    "social_experiment",
    `site:facebook.com ${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`,
    "experimental",
    "exploratory",
    "V2.2 social — Facebook K01 variant"
  ),
  p(
    "X11",
    "social_experiment",
    `site:facebook.com ${MCHP} \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA\u05E8\u05D9\u05DD \u05DC\u05E2\u05E1\u05E7 \u05E7\u05D8\u05DF`,
    "experimental",
    "exploratory",
    "V2.2 social — Facebook K08 variant"
  ),
  p(
    "X12",
    "social_experiment",
    `site:instagram.com ${MCHP} ${MISH} \u05E9\u05D9\u05D1\u05E0\u05D4 \u05DC\u05D9 \u05D0\u05EA\u05E8 \u05DC\u05E2\u05E1\u05E7`,
    "experimental",
    "exploratory",
    "V2.2 social — Instagram K01 variant"
  ),
];

const profiles = [...core, ...rotating, ...experimental];

const catalog = {
  version: 4,
  environment: "production-v2.2",
  locale: "he-IL",
  strategy: "explicit-intent-v2.2",
  catalogKind: "v2",
  profiles,
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "config/discovery/search-profiles.he.v2.prod.json");
writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Wrote ${profiles.length} profiles to ${outPath}`);
