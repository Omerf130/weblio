import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  getAdminPageTitle,
  isAdminNavItemActive,
} from "../../src/lib/admin/nav-config";

describe("admin navigation groups", () => {
  it("has at least two groups", () => {
    assert.ok(ADMIN_NAV_GROUPS.length >= 2);
  });

  it("first group has no label (main group)", () => {
    assert.equal(ADMIN_NAV_GROUPS[0].label, undefined);
  });

  it("business group has a label", () => {
    const business = ADMIN_NAV_GROUPS.find((g) => g.id === "business");
    assert.ok(business);
    assert.equal(business!.label, "עסקי");
  });

  it("business group contains overview and follow-ups", () => {
    const business = ADMIN_NAV_GROUPS.find((g) => g.id === "business");
    assert.ok(business);

    const ids = business!.items.map((i) => i.id);
    assert.ok(ids.includes("business-overview"));
    assert.ok(ids.includes("follow-ups"));
  });

  it("business group does NOT contain future items", () => {
    const business = ADMIN_NAV_GROUPS.find((g) => g.id === "business");
    assert.ok(business);

    const ids = business!.items.map((i) => i.id);
    assert.ok(!ids.includes("opportunities"));
    assert.ok(!ids.includes("intent"));
    assert.ok(!ids.includes("intent-monitor"));
    assert.ok(!ids.includes("marketing"));
    assert.ok(!ids.includes("ai-marketing"));
  });

  it("no items have comingSoon flag", () => {
    for (const item of ADMIN_NAV_ITEMS) {
      assert.equal(
        item.comingSoon,
        undefined,
        `${item.id} should not have comingSoon`
      );
    }
  });

  it("flattenned ADMIN_NAV_ITEMS contains all items from all groups", () => {
    const allGroupItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
    assert.equal(ADMIN_NAV_ITEMS.length, allGroupItems.length);

    for (let i = 0; i < allGroupItems.length; i++) {
      assert.equal(ADMIN_NAV_ITEMS[i].id, allGroupItems[i].id);
    }
  });
});

describe("admin navigation existing items unchanged", () => {
  it("contains original main navigation items", () => {
    const mainGroup = ADMIN_NAV_GROUPS.find((g) => g.id === "main");
    assert.ok(mainGroup);

    const ids = mainGroup!.items.map((i) => i.id);
    assert.ok(ids.includes("dashboard"));
    assert.ok(ids.includes("leads"));
    assert.ok(ids.includes("projects"));
    assert.ok(ids.includes("landing-page"));
  });

  it("dashboard still points to /admin", () => {
    const dashboard = ADMIN_NAV_ITEMS.find((i) => i.id === "dashboard");
    assert.ok(dashboard);
    assert.equal(dashboard!.href, "/admin");
  });

  it("leads still points to /admin/leads", () => {
    const leads = ADMIN_NAV_ITEMS.find((i) => i.id === "leads");
    assert.ok(leads);
    assert.equal(leads!.href, "/admin/leads");
  });
});

describe("business route matching", () => {
  it("overview is active on /admin/business", () => {
    const overview = ADMIN_NAV_ITEMS.find((i) => i.id === "business-overview");
    assert.ok(overview);
    assert.equal(isAdminNavItemActive("/admin/business", overview!), true);
  });

  it("follow-ups is active on /admin/business/follow-ups", () => {
    const followUps = ADMIN_NAV_ITEMS.find((i) => i.id === "follow-ups");
    assert.ok(followUps);
    assert.equal(isAdminNavItemActive("/admin/business/follow-ups", followUps!), true);
  });

  it("overview is NOT active on /admin/business/follow-ups", () => {
    const overview = ADMIN_NAV_ITEMS.find((i) => i.id === "business-overview");
    assert.ok(overview);
    assert.equal(isAdminNavItemActive("/admin/business/follow-ups", overview!), false);
  });

  it("getAdminPageTitle returns business overview title", () => {
    assert.equal(getAdminPageTitle("/admin/business"), "סקירה עסקית");
  });

  it("getAdminPageTitle returns follow-ups title", () => {
    assert.equal(getAdminPageTitle("/admin/business/follow-ups"), "מעקבים");
  });

  it("dashboard is NOT active on /admin/business", () => {
    const dashboard = ADMIN_NAV_ITEMS.find((i) => i.id === "dashboard");
    assert.ok(dashboard);
    assert.equal(isAdminNavItemActive("/admin/business", dashboard!), false);
  });
});
