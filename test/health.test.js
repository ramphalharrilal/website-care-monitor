import assert from "node:assert/strict";
import test from "node:test";
import { assessSite, summarizePortfolio } from "../src/health.js";

test("healthy website receives a clear customer-ready summary", () => {
  const result = assessSite({
    name: "Healthy site",
    reachable: true,
    statusCode: 200,
    responseMs: 480,
    tlsDaysRemaining: 90,
    expectContactForm: true,
    contactFormFound: true,
    brokenLinks: 0,
  });

  assert.equal(result.status, "healthy");
  assert.equal(result.score, 100);
  assert.match(result.summary, /ready for customers/i);
});

test("unreachable website becomes a critical customer-impact issue", () => {
  const result = assessSite({ name: "Offline", reachable: false });
  assert.equal(result.status, "critical");
  assert.equal(result.score, 0);
  assert.match(result.summary, /cannot reach/i);
});

test("slow response and expiring certificate require attention", () => {
  const result = assessSite({
    name: "Needs care",
    reachable: true,
    statusCode: 200,
    responseMs: 3400,
    tlsDaysRemaining: 10,
    expectContactForm: false,
    brokenLinks: 0,
  });

  assert.equal(result.status, "attention");
  assert.equal(result.issues.length, 2);
});

test("portfolio summary counts each status", () => {
  assert.deepEqual(
    summarizePortfolio([{ status: "healthy" }, { status: "attention" }, { status: "critical" }]),
    { total: 3, healthy: 1, attention: 1, critical: 1 },
  );
});
