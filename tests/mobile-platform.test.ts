import test from "node:test";
import assert from "node:assert/strict";
import { bearerTokenFromHeader } from "../src/lib/mobileAuth.ts";
import { normalizeMobileDeviceRegistration } from "../src/lib/mobileDevice.ts";

test("native bearer authentication accepts only a bounded token shape", () => {
  assert.equal(bearerTokenFromHeader("Bearer header.payload.signature"), "header.payload.signature");
  assert.equal(bearerTokenFromHeader("bearer header.payload.signature"), null);
  assert.equal(bearerTokenFromHeader("Bearer token with spaces"), null);
  assert.equal(bearerTokenFromHeader(["Bearer mobile_token", "Bearer ignored"]), "mobile_token");
});

test("mobile registration validates installation, platform, and Expo push token", () => {
  assert.deepEqual(normalizeMobileDeviceRegistration({
    installationId: "installation_1234567890",
    platform: "ios",
    pushToken: "ExpoPushToken[valid_token_12345]",
    appVersion: "1.0.0",
  }), {
    installationId: "installation_1234567890",
    platform: "IOS",
    pushToken: "ExpoPushToken[valid_token_12345]",
    appVersion: "1.0.0",
  });
  assert.equal(normalizeMobileDeviceRegistration({
    installationId: "short",
    platform: "IOS",
  }), null);
  assert.equal(normalizeMobileDeviceRegistration({
    installationId: "installation_1234567890",
    platform: "WINDOWS",
  }), null);
  assert.equal(normalizeMobileDeviceRegistration({
    installationId: "installation_1234567890",
    platform: "ANDROID",
    pushToken: "https://untrusted.example/token",
  }), null);
  assert.deepEqual(normalizeMobileDeviceRegistration({
    installationId: "installation_1234567890",
    platform: "ANDROID",
    appVersion: "1.0.0",
  }), {
    installationId: "installation_1234567890",
    platform: "ANDROID",
    appVersion: "1.0.0",
  });
  assert.equal(normalizeMobileDeviceRegistration({
    installationId: "installation_1234567890",
    platform: "ANDROID",
    pushToken: 123,
  }), null);
});
