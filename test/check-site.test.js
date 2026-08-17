import assert from "node:assert/strict";
import test from "node:test";
import { checkHttp, monitorSite } from "../src/check-site.js";

function response({ status = 200, url = "https://example.test/", body = "<html></html>" } = {}) {
  return {
    status,
    url,
    headers: { get: () => "text/html; charset=utf-8" },
    text: async () => body,
  };
}

test("HTTP check detects an expected contact form", async () => {
  const result = await checkHttp(
    { name: "Business", url: "https://example.test", expectContactForm: true },
    { fetchImpl: async () => response({ body: "<form action='/contact'></form>" }) },
  );

  assert.equal(result.reachable, true);
  assert.equal(result.contactFormFound, true);
});

test("monitor combines HTTP and certificate evidence", async () => {
  const result = await monitorSite(
    { name: "Business", url: "https://example.test", expectContactForm: false },
    {
      fetchImpl: async () => response(),
      tlsChecker: async () => ({ daysRemaining: 120 }),
    },
  );

  assert.equal(result.status, "healthy");
  assert.equal(result.tlsDaysRemaining, 120);
});
