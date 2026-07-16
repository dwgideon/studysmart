import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" }
)
  .split("\0")
  .filter(Boolean);
const forbiddenFiles = files.filter((file) =>
  /(^|\/)\.env($|\.)|\.(pem|key|p12|pfx)$/i.test(file)
);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
  /\bsk-[A-Za-z0-9]{32,}\b/,
];
const findings = [];
for (const file of files) {
  if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|zip|gz|pdf)$/i.test(file)) {continue;}
  let content;
  try {content = readFileSync(file, "utf8");} catch {continue;}
  for (const pattern of patterns) {
    if (pattern.test(content)) {findings.push(`${file}: matches ${pattern}`);}
  }
}
if (forbiddenFiles.length || findings.length) {
  console.error([...forbiddenFiles.map((file) => `${file}: tracked secret file type`), ...findings].join("\n"));
  process.exit(1);
}
console.log(`Security scan passed for ${files.length} release-candidate files.`);
