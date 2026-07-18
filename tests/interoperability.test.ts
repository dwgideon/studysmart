import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, serializeCsv } from "../src/lib/interoperability/csv.ts";
import { buildQtiPackage, parseQtiPackage } from "../src/lib/interoperability/qti.ts";
import { isPublicIpAddress, safeExternalHttpsUrl } from "../src/lib/interoperability/lti.ts";

test("CSV exchange preserves commas, quotes, and line breaks", () => {
  const csv = serializeCsv(["sourcedId", "title"], [
    { sourcedId: "class-1", title: "Biology, \"Cells\"\nand Energy" },
  ]);
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed, [
    { sourcedId: "class-1", title: "Biology, \"Cells\"\nand Energy" },
  ]);
});

test("QTI package round-trips multiple-choice assessment items", async () => {
  const archive = await buildQtiPackage({
    identifier: "quiz-1",
    title: "Cell biology",
    questions: [{
      question: "Which organelle produces most ATP?",
      options: { A: "Nucleus", B: "Mitochondrion", C: "Ribosome", D: "Golgi body" },
      answer: "B",
      concept: "Cellular respiration",
    }],
  });
  const imported = await parseQtiPackage(archive);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].answer, "B");
  assert.equal(imported[0].options.B, "Mitochondrion");
});

test("LTI registration rejects private-network and non-HTTPS endpoints", () => {
  assert.throws(() => safeExternalHttpsUrl("http://platform.example/login"));
  assert.throws(() => safeExternalHttpsUrl("https://127.0.0.1/jwks"));
  assert.throws(() => safeExternalHttpsUrl("https://2130706433/jwks"));
  assert.throws(() => safeExternalHttpsUrl("https://[::1]/jwks"));
  assert.throws(() => safeExternalHttpsUrl("https://[fc00::1]/jwks"));
  assert.throws(() => safeExternalHttpsUrl("https://[::ffff:7f00:1]/jwks"));
  assert.throws(() => safeExternalHttpsUrl("https://lms.example.edu:8443/jwks"));
  assert.equal(isPublicIpAddress("8.8.8.8"), true);
  assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
  assert.equal(safeExternalHttpsUrl("https://lms.example.edu/jwks").hostname, "lms.example.edu");
});
