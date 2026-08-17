const DEFAULT_THRESHOLDS = Object.freeze({
  slowResponseMs: 2000,
  certificateWarningDays: 21,
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function assessSite(check, thresholds = {}) {
  const rules = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const issues = [];
  let score = 100;

  if (!check.reachable) {
    return {
      ...check,
      score: 0,
      status: "critical",
      summary: "Customers cannot reach the website.",
      issues: ["Website did not respond before the timeout."],
    };
  }

  const statusCode = finiteNumber(check.statusCode);
  const responseMs = finiteNumber(check.responseMs);
  const tlsDaysRemaining = check.tlsDaysRemaining == null
    ? null
    : finiteNumber(check.tlsDaysRemaining);
  const brokenLinks = Math.max(0, finiteNumber(check.brokenLinks));

  if (statusCode >= 500) {
    score -= 70;
    issues.push(`Website returned a server error (${statusCode}).`);
  } else if (statusCode >= 400) {
    score -= 45;
    issues.push(`Website returned an error page (${statusCode}).`);
  }

  if (responseMs > rules.slowResponseMs) {
    score -= 18;
    issues.push(`Page response took ${responseMs} ms.`);
  }

  if (tlsDaysRemaining !== null && tlsDaysRemaining < 0) {
    score -= 60;
    issues.push("Security certificate has expired.");
  } else if (tlsDaysRemaining !== null && tlsDaysRemaining <= rules.certificateWarningDays) {
    score -= 22;
    issues.push(`Security certificate expires in ${tlsDaysRemaining} days.`);
  }

  if (check.expectContactForm && !check.contactFormFound) {
    score -= 20;
    issues.push("Expected contact form was not found.");
  }

  if (brokenLinks > 0) {
    score -= Math.min(25, brokenLinks * 5);
    issues.push(`${brokenLinks} broken link${brokenLinks === 1 ? "" : "s"} detected.`);
  }

  score = Math.max(0, Math.round(score));
  const status = score < 55 ? "critical" : score < 85 ? "attention" : "healthy";
  const summary = status === "healthy"
    ? "Website is available and ready for customers."
    : status === "attention"
      ? "Website is working, but one or more items need attention."
      : "Website has a serious issue that may affect customers.";

  return { ...check, score, status, summary, issues };
}

export function summarizePortfolio(results) {
  const counts = { total: results.length, healthy: 0, attention: 0, critical: 0 };
  for (const result of results) {
    if (Object.hasOwn(counts, result.status)) counts[result.status] += 1;
  }
  return counts;
}
