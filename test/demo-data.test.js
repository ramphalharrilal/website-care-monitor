import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assessSite } from "../src/health.js";

test("public demo scores and statuses match the production scoring rules", async () => {
  const fixture = JSON.parse(await readFile("public/demo-data.json", "utf8"));

  for (const site of fixture.sites) {
    const assessed = assessSite(site);
    assert.equal(assessed.score, site.score, `${site.name} score drifted`);
    assert.equal(assessed.status, site.status, `${site.name} status drifted`);
  }
});
