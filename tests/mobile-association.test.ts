import assert from "node:assert/strict";
import test from "node:test";
import { androidAssociation, appleAssociation } from "../src/lib/mobileAssociation.ts";

test("mobile association files stay empty until store credentials are configured", () => {
  assert.deepEqual(appleAssociation({} as NodeJS.ProcessEnv).applinks.details, []);
  assert.deepEqual(androidAssociation({} as NodeJS.ProcessEnv), []);
});

test("mobile association files expose only native routes with validated identities", () => {
  const env = {
    APPLE_APP_TEAM_ID: "A1B2C3D4E5",
    MOBILE_APP_BUNDLE_ID: "com.studysmart.learning",
    MOBILE_ANDROID_PACKAGE: "com.studysmart.learning",
    ANDROID_APP_SHA256_CERT_FINGERPRINT: Array.from({ length: 32 }, () => "AA").join(":"),
  } as NodeJS.ProcessEnv;
  const apple = appleAssociation(env);
  const android = androidAssociation(env);
  assert.equal(apple.applinks.details[0]?.appID, "A1B2C3D4E5.com.studysmart.learning");
  assert.deepEqual(apple.applinks.details[0]?.paths, ["/", "/study", "/tutor", "/games", "/upload", "/safety-alerts"]);
  assert.equal(android[0]?.target.package_name, "com.studysmart.learning");
  assert.equal(android[0]?.target.sha256_cert_fingerprints.length, 1);
});
