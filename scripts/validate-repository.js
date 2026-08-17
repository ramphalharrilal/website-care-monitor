import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "README.md",
  "LICENSE",
  "package.json",
  "public/index.html",
  "public/demo-data.json",
  "src/health.js",
  "src/check-site.js",
  "test/health.test.js",
  "docs/case-study.md",
];

const failures = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    failures.push(`Missing required file: ${file}`);
  }
}

const filesToInspect = ["README.md", "public/index.html", "src/check-site.js", "config/sites.example.json"];
const suspiciousPatterns = [
  /TODO/i,
  /YOUR[_ -]?(API|TOKEN|SECRET|PASSWORD)/i,
  /ghp_[a-z0-9]{20,}/i,
  /sk-[a-z0-9]{20,}/i,
];

for (const file of filesToInspect) {
  const content = await readFile(file, "utf8");
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) failures.push(`${file} matched unsafe placeholder pattern ${pattern}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Repository validation passed (${requiredFiles.length} required files checked).`);
