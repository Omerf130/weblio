import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeBusinessNameTokens } from "../../src/lib/discovery/poc/business-verification/business-name-tokens";
import {
  classifyVerificationDomain,
  extractHostname,
} from "../../src/lib/discovery/poc/business-verification/verification-domain";
import {
  applyGoogleResultsCap,
  assertGoogleRequestBudget,
  buildProviderWebsiteConfirmedEvaluation,
  decideVerificationOutcome,
  dedupePlacesById,
  mapTavilyResultsToEvidence,
  providerWebsiteListed,
} from "../../src/lib/discovery/poc/business-verification/verification-matcher";
import { runBusinessVerificationPoc } from "../../src/lib/discovery/poc/business-verification/business-verification-poc-run";
import {
  HAIFA_BEAUTY_SALONS_POC_CONFIG,
  HAIFA_ELECTRICIANS_POC_CONFIG,
  PLACES_INCLUDED_TYPE_ELECTRICIAN,
} from "../../src/lib/discovery/poc/business-verification/business-verification-poc-config";
import {
  BUSINESS_VERIFICATION_PLACES_FIELD_MASK,
  buildHaifaBeautySalonsTextSearchBody,
  buildPlacesTextSearchBodyFromConfig,
} from "../../src/lib/discovery/poc/business-verification/google-places-text-search";
import {
  REGRESSION_ADIR_LEVI,
  REGRESSION_BEAUTY_HOUSE,
  REGRESSION_GABAY_BARBER,
} from "../../src/lib/discovery/poc/business-verification/business-verification-regression-fixtures";
import { assessUrlQuality } from "../../src/lib/discovery/poc/business-verification/url-quality";
import { isGenericBusinessDisplayName } from "../../src/lib/discovery/poc/business-verification/generic-business-name";
import { isPrimaryTypeAcceptedForPoc } from "../../src/lib/discovery/poc/business-verification/category-relevance";

describe("business verification domain classification", () => {
  it("classifies social, directory, booking, and app store domains", () => {
    assert.equal(classifyVerificationDomain("https://www.facebook.com/salon"), "social");
    assert.equal(classifyVerificationDomain("https://instagram.com/salon"), "social");
    assert.equal(classifyVerificationDomain("https://maps.google.com/?q=1"), "directory");
    assert.equal(classifyVerificationDomain("https://www.easy.co.il/listing"), "directory");
    assert.equal(classifyVerificationDomain("https://wolt.com/en/isr"), "marketplace");
    assert.equal(classifyVerificationDomain("https://kavanu.co/salon"), "bookingPlatform");
    assert.equal(classifyVerificationDomain("https://lee.co.il/b/abc"), "businessProfilePlatform");
    assert.equal(
      classifyVerificationDomain("https://apps.apple.com/us/app/beauty-house/id1"),
      "appStore"
    );
    assert.equal(classifyVerificationDomain("https://salon-example.co.il"), "possibleOfficial");
    assert.equal(
      classifyVerificationDomain("https://www.midrag.co.il/SpCard/Sp/21379"),
      "directory"
    );
    assert.equal(classifyVerificationDomain("https://www.pro.co.il/electricians/haifa"), "directory");
    assert.equal(
      classifyVerificationDomain(
        "https://allbeauty.co.il/listing/%D7%90%D7%95%D7%A8%D7%9C%D7%99-%D7%91%D7%A0%D7%93%D7%9C-2"
      ),
      "directory"
    );
    assert.equal(classifyVerificationDomain("https://hkn.co.il/top10/biz/42768"), "directory");
  });

  it("extractHostname normalizes hosts", () => {
    assert.equal(extractHostname("https://WWW.Example.Co.il/path"), "example.co.il");
  });
});

describe("business name normalization", () => {
  it("drops legal suffixes and stop words", () => {
    const tokens = normalizeBusinessNameTokens('Salon Dana בע"מ');
    assert.ok(tokens.includes("dana"));
    assert.equal(tokens.includes("salon"), false);
  });

  it("detects generic display names", () => {
    assert.equal(isGenericBusinessDisplayName("Beauty House"), true);
    assert.equal(isGenericBusinessDisplayName("Salon Delta"), false);
  });
});

describe("url quality", () => {
  it("marks checkout and booking profile paths as weak", () => {
    assert.equal(assessUrlQuality("https://beautyhouse.com/checkout"), "weak");
    assert.equal(assessUrlQuality("https://lee.co.il/b/3cxRw"), "weak");
    assert.equal(assessUrlQuality("https://salondelta.co.il"), "strong");
  });
});

describe("verification outcome rules", () => {
  it("websiteConfirmed short-circuit when provider lists website", () => {
    const place = {
      placeId: "p1",
      displayName: "Salon A",
      formattedAddress: "Haifa",
      websiteUri: "https://salon-a.co.il",
    };
    assert.equal(providerWebsiteListed(place), true);
    const evalRow = buildProviderWebsiteConfirmedEvaluation(place);
    assert.equal(evalRow.verificationOutcome, "websiteConfirmed");
    assert.equal(evalRow.inboxEligible, false);
  });

  it("noWebsiteListedAndNotFound when only directories returned", () => {
    const evidence = mapTavilyResultsToEvidence("Salon Beta", [
      {
        title: "Salon Beta",
        url: "https://www.easy.co.il/Salon-Beta",
        content: "Salon Beta חיפה",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "Salon Beta",
    });
    assert.equal(decision.outcome, "noWebsiteListedAndNotFound");
  });

  it("socialOnly when social matches and no official site", () => {
    const evidence = mapTavilyResultsToEvidence("Salon Gamma", [
      {
        title: "Salon Gamma",
        url: "https://www.facebook.com/salongamma",
        content: "Salon Gamma חיפה",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "Salon Gamma",
    });
    assert.equal(decision.outcome, "socialOnly");
  });

  it("websiteConfirmed from secondary official domain match", () => {
    const evidence = mapTavilyResultsToEvidence("Salon Delta", [
      {
        title: "Salon Delta - Hair Design",
        url: "https://salondelta.co.il",
        content: "Salon Delta בחיפה",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "Salon Delta",
    });
    assert.equal(decision.outcome, "websiteConfirmed");
  });

  it("ambiguous when multiple official domains match", () => {
    const evidence = mapTavilyResultsToEvidence("Salon Epsilon", [
      {
        title: "Salon Epsilon",
        url: "https://salonepsilon.co.il",
        content: "Salon Epsilon חיפה",
      },
      {
        title: "Salon Epsilon Official",
        url: "https://epsilon-salon.co.il",
        content: "Salon Epsilon חיפה",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "Salon Epsilon",
    });
    assert.equal(decision.outcome, "ambiguous");
  });

  describe("live PoC regression fixtures", () => {
    it("Beauty House must not confirm beautyhouse.com from weak evidence", () => {
      const evidence = mapTavilyResultsToEvidence(
        REGRESSION_BEAUTY_HOUSE.businessName,
        REGRESSION_BEAUTY_HOUSE.results
      );
      const decision = decideVerificationOutcome({
        providerWebsiteListed: false,
        evidence,
        businessName: REGRESSION_BEAUTY_HOUSE.businessName,
      });
      assert.notEqual(decision.outcome, "websiteConfirmed");
      assert.ok(
        evidence.some((row) => row.domain === "beautyhouse.com"),
        "fixture includes beautyhouse.com"
      );
    });

    it("Adir Levi must not treat kavanu.co as independent official website", () => {
      const evidence = mapTavilyResultsToEvidence(
        REGRESSION_ADIR_LEVI.businessName,
        REGRESSION_ADIR_LEVI.results
      );
      const decision = decideVerificationOutcome({
        providerWebsiteListed: false,
        evidence,
        businessName: REGRESSION_ADIR_LEVI.businessName,
      });
      assert.notEqual(decision.outcome, "websiteConfirmed");
      assert.equal(
        evidence.find((row) => row.domain === "kavanu.co")?.domainCategory,
        "bookingPlatform"
      );
    });

    it("Gabay Barber Shop stays ambiguous under conservative rules", () => {
      const evidence = mapTavilyResultsToEvidence(
        REGRESSION_GABAY_BARBER.businessName,
        REGRESSION_GABAY_BARBER.results
      );
      const decision = decideVerificationOutcome({
        providerWebsiteListed: false,
        evidence,
        businessName: REGRESSION_GABAY_BARBER.businessName,
      });
      assert.equal(decision.outcome, "ambiguous");
      assert.notEqual(decision.outcome, "websiteConfirmed");
    });
  });

  it("midrag.co.il alone cannot produce websiteConfirmed", () => {
    const evidence = mapTavilyResultsToEvidence("יעקב חשמלאי בחיפה 24 שעות", [
      {
        title: "יעקב - חשמלאי מומלץ באזור חיפה והסביבה",
        url: "https://www.midrag.co.il/SpCard/Sp/21379?areaId=3&serviceId=170",
        content: "638 לקוחות דירגו את יעקב בציון ממוצע 9.84. חיפה והסביבה.",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "יעקב חשמלאי בחיפה 24 שעות",
    });
    assert.notEqual(decision.outcome, "websiteConfirmed");
    assert.equal(evidence[0]?.domainCategory, "directory");
  });

  it("pro.co.il alone cannot produce websiteConfirmed", () => {
    const evidence = mapTavilyResultsToEvidence("יעקב חשמלאי בחיפה 24 שעות", [
      {
        title: "חשמלאי בחיפה » 14 חשמלאים שבדקנו ואישרנו",
        url: "https://www.pro.co.il/electricians/haifa",
        content: "חשמלאי בחיפה שירות 24 שעות",
      },
    ]);
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      evidence,
      businessName: "יעקב חשמלאי בחיפה 24 שעות",
    });
    assert.notEqual(decision.outcome, "websiteConfirmed");
    assert.equal(evidence[0]?.domainCategory, "directory");
  });

  it("insufficientEvidence on Tavily error", () => {
    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      tavilyError: "TAVILY_HTTP_500",
      evidence: [],
      businessName: "Salon Z",
    });
    assert.equal(decision.outcome, "insufficientEvidence");
  });
});

describe("dedupe and caps", () => {
  it("dedupes by place id", () => {
    const rows = dedupePlacesById([
      { placeId: "a", name: "1" },
      { placeId: "a", name: "2" },
      { placeId: "b", name: "3" },
    ]);
    assert.equal(rows.length, 2);
  });

  it("caps google results at 20", () => {
    const capped = applyGoogleResultsCap(Array.from({ length: 25 }, (_, i) => i), 20);
    assert.equal(capped.length, 20);
  });

  it("throws when google request cap exceeded", () => {
    assert.throws(() => assertGoogleRequestBudget(2, 1), /POC_GOOGLE_REQUEST_CAP_EXCEEDED/);
  });
});

describe("google request design constants", () => {
  it("uses expected field mask", () => {
    assert.match(BUSINESS_VERIFICATION_PLACES_FIELD_MASK, /websiteUri/);
  });

  it("PoC #2 uses electrician Table A type and Hebrew Haifa query", () => {
    assert.equal(PLACES_INCLUDED_TYPE_ELECTRICIAN, "electrician");
    const body = buildPlacesTextSearchBodyFromConfig(HAIFA_ELECTRICIANS_POC_CONFIG);
    assert.equal(body.pageSize, 20);
    assert.equal(body.includedType, "electrician");
    assert.equal(body.textQuery, "חשמלאים בחיפה");
    assert.equal(body.regionCode, "IL");
    assert.equal(HAIFA_ELECTRICIANS_POC_CONFIG.categoryLabel, "electricians");
  });

  it("PoC #1 beauty body builder remains available", () => {
    const body = buildHaifaBeautySalonsTextSearchBody(20);
    assert.equal(body.includedType, HAIFA_BEAUTY_SALONS_POC_CONFIG.includedType);
  });
});

describe("category relevance gate", () => {
  it("electricians PoC accepts electrician primaryType only", () => {
    assert.equal(
      isPrimaryTypeAcceptedForPoc("electrician", HAIFA_ELECTRICIANS_POC_CONFIG),
      true
    );
    assert.equal(
      isPrimaryTypeAcceptedForPoc("car_repair", HAIFA_ELECTRICIANS_POC_CONFIG),
      false
    );
  });
});

describe("runBusinessVerificationPoc (mocked providers)", () => {
  it("calls Tavily only for operational places without provider website", async () => {
    const tavilyCalls: string[] = [];
    const googleFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          places: [
            {
              id: "listed1",
              displayName: { text: "Listed Salon" },
              formattedAddress: "Haifa",
              primaryType: "beauty_salon",
              businessStatus: "OPERATIONAL",
              websiteUri: "https://listed.co.il",
            },
            {
              id: "short1",
              displayName: { text: "Short Salon" },
              formattedAddress: "Haifa",
              primaryType: "hair_salon",
              businessStatus: "OPERATIONAL",
            },
            {
              id: "short1",
              displayName: { text: "Short Salon Duplicate" },
              formattedAddress: "Haifa",
              primaryType: "hair_salon",
              businessStatus: "OPERATIONAL",
            },
            {
              id: "closed1",
              displayName: { text: "Closed Salon" },
              formattedAddress: "Haifa",
              businessStatus: "CLOSED_PERMANENTLY",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const tavilyFetch: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { query?: string };
      tavilyCalls.push(body.query ?? "");
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "Short Salon",
              url: "https://www.facebook.com/shortsalon",
              content: "Short Salon חיפה",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const { artifact } = await runBusinessVerificationPoc({
      google: { apiKey: "test-google", fetchImpl: googleFetch },
      tavily: { apiKey: "test-tavily", fetchImpl: tavilyFetch },
      config: HAIFA_BEAUTY_SALONS_POC_CONFIG,
    });

    assert.equal(artifact.google.textSearchRequests, 1);
    assert.equal(artifact.tavily.verificationRequests, 1);
    assert.equal(tavilyCalls.length, 1);
    assert.match(tavilyCalls[0] ?? "", /Short Salon/);
    assert.equal(artifact.funnel.providerWebsiteListed, 1);
    assert.equal(artifact.funnel.uniqueShortlistAfterDedupe, 1);
    assert.equal(artifact.finalCandidates.length, 1);
    assert.equal(artifact.finalCandidates[0]?.verificationOutcome, "socialOnly");
    assert.equal(artifact.finalCandidates[0]?.manualReview, null);
  });

  it("excludes car_repair from electricians shortlist with zero Tavily calls", async () => {
    const tavilyCalls: string[] = [];
    const googleFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          places: [
            {
              id: "car1",
              displayName: { text: "חשמלאות,מכונאות רכב" },
              formattedAddress: "חיפה",
              primaryType: "car_repair",
              businessStatus: "OPERATIONAL",
            },
            {
              id: "elec1",
              displayName: { text: "יעקב חשמלאי בחיפה 24 שעות" },
              formattedAddress: "פלמ\"ח 8, חיפה",
              primaryType: "electrician",
              businessStatus: "OPERATIONAL",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const tavilyFetch: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { query?: string };
      tavilyCalls.push(body.query ?? "");
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const { artifact } = await runBusinessVerificationPoc({
      google: { apiKey: "test-google", fetchImpl: googleFetch },
      tavily: { apiKey: "test-tavily", fetchImpl: tavilyFetch },
      config: HAIFA_ELECTRICIANS_POC_CONFIG,
    });

    assert.equal(artifact.funnel.categoryMismatchExcluded, 1);
    assert.equal(artifact.categoryMismatchExcluded[0]?.primaryType, "car_repair");
    assert.equal(artifact.categoryMismatchExcluded[0]?.displayName, "חשמלאות,מכונאות רכב");
    assert.equal(artifact.tavily.verificationRequests, 1);
    assert.equal(tavilyCalls.length, 1);
    assert.match(tavilyCalls[0] ?? "", /יעקב/);
  });
});
