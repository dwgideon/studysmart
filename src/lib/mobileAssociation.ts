const NATIVE_PATHS = ["/", "/study", "/tutor", "/games", "/upload", "/safety-alerts"];

const identifier = (value: string | undefined, fallback: string) =>
  value && /^[A-Za-z0-9.-]{3,160}$/.test(value) ? value : fallback;

const teamId = (value: string | undefined) =>
  value && /^[A-Z0-9]{10}$/.test(value) ? value : null;

const fingerprint = (value: string | undefined) => {
  if (!value) {return null;}
  const normalized = value.trim().toUpperCase();
  return /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(normalized) ? normalized : null;
};

export function appleAssociation(env: NodeJS.ProcessEnv = process.env) {
  const team = teamId(env.APPLE_APP_TEAM_ID);
  const bundleId = identifier(env.MOBILE_APP_BUNDLE_ID, "com.studysmart.learning");
  return {
    applinks: {
      apps: [],
      details: team ? [{ appID: `${team}.${bundleId}`, paths: NATIVE_PATHS }] : [],
    },
  };
}

export function androidAssociation(env: NodeJS.ProcessEnv = process.env) {
  const sha256 = fingerprint(env.ANDROID_APP_SHA256_CERT_FINGERPRINT);
  if (!sha256) {return [];}
  return [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: identifier(env.MOBILE_ANDROID_PACKAGE, "com.studysmart.learning"),
      sha256_cert_fingerprints: [sha256],
    },
  }];
}
