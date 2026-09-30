import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("discovery admin UI wiring", () => {
  it("IntentDiscoveryControl calls only runTavilyDiscoveryAction", () => {
    const source = readFileSync(
      join(root, "src/components/admin/business/intents/IntentDiscoveryControl.tsx"),
      "utf8"
    );
    assert.match(source, /runTavilyDiscoveryAction/);
    assert.doesNotMatch(source, /fetchTavily|createTavily|DISCOVERY_TAVILY|process\.env/);
    assert.doesNotMatch(source, /queryHe|maxResults|exclude_domains/);
  });

  it("disables button and shows loading label while running", () => {
    const source = readFileSync(
      join(root, "src/components/admin/business/intents/IntentDiscoveryControl.tsx"),
      "utf8"
    );
    assert.match(source, /disabled=\{running\}/);
    assert.match(source, /aria-busy=\{running\}/);
    assert.match(source, /מחפש הזדמנויות/);
    assert.match(source, /if \(running\)/);
  });

  it("refreshes route data after successful run", () => {
    const source = readFileSync(
      join(root, "src/components/admin/business/intents/IntentDiscoveryControl.tsx"),
      "utf8"
    );
    assert.match(source, /router\.refresh\(\)/);
    assert.match(source, /result\.success/);
  });

  it("IntentsManager embeds discovery control below header", () => {
    const source = readFileSync(
      join(root, "src/components/admin/business/intents/IntentsManager.tsx"),
      "utf8"
    );
    assert.match(source, /IntentDiscoveryControl/);
  });
});
