import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { monitorSite } from "./check-site.js";
import { summarizePortfolio } from "./health.js";

const configPath = resolve(process.argv[2] ?? "config/sites.example.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const settings = config.settings ?? {};
const results = [];

for (const site of config.sites ?? []) {
  results.push(await monitorSite(site, settings));
}

const report = {
  generatedAt: new Date().toISOString(),
  summary: summarizePortfolio(results),
  sites: results,
};

await mkdir(resolve("reports"), { recursive: true });
await writeFile(resolve("reports/latest-report.json"), JSON.stringify(report, null, 2));

console.table(results.map((result) => ({
  site: result.name,
  status: result.status,
  score: result.score,
  response: result.responseMs ? `${result.responseMs} ms` : "unavailable",
  summary: result.summary,
})));
console.log("Report written to reports/latest-report.json");
