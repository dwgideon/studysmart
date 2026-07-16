import assert from "node:assert/strict";

const baseUrl = process.argv[2]?.replace(/\/$/, "");
assert.ok(baseUrl && /^https:\/\//.test(baseUrl), "Pass an HTTPS deployment URL.");

async function check(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "error" });
  const body = await response.text();
  assert.equal(response.status, 200, `${path} returned ${response.status}: ${body.slice(0, 120)}`);
  assert.ok(response.headers.get("x-request-id"), `${path} is missing X-Request-ID`);
  return { response, body };
}

const health = await check("/api/health");
assert.equal(JSON.parse(health.body).status, "ok");
const home = await check("/");
for (const header of ["content-security-policy", "strict-transport-security", "x-content-type-options"]) {
  assert.ok(home.response.headers.get(header), `home is missing ${header}`);
}
await check("/privacy");
await check("/.well-known/security.txt");
console.log(`Deployment smoke test passed: ${baseUrl}`);
