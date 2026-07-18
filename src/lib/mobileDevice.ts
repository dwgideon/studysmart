const MOBILE_PLATFORMS = new Set(["IOS", "ANDROID"]);

type MobileDeviceRegistration = {
  installationId: string;
  platform: "IOS" | "ANDROID";
  pushToken?: string | null;
  appVersion: string | null;
};

const INSTALLATION_ID = /^[A-Za-z0-9_-]{16,128}$/;
const EXPO_PUSH_TOKEN = /^(?:Expo|Exponent)PushToken\[[A-Za-z0-9_-]{8,256}\]$/;

export function normalizeMobileDeviceRegistration(
  value: unknown
): MobileDeviceRegistration | null {
  if (!value || typeof value !== "object") {return null;}
  const input = value as Record<string, unknown>;
  const installationId = typeof input.installationId === "string"
    ? input.installationId.trim()
    : "";
  const platform = typeof input.platform === "string"
    ? input.platform.trim().toUpperCase()
    : "";
  const hasPushToken = Object.prototype.hasOwnProperty.call(input, "pushToken");
  const pushToken = typeof input.pushToken === "string"
    ? input.pushToken.trim()
    : input.pushToken === null
      ? null
      : undefined;
  const appVersion = typeof input.appVersion === "string"
    ? input.appVersion.trim().slice(0, 40) || null
    : null;

  if (!INSTALLATION_ID.test(installationId) || !MOBILE_PLATFORMS.has(platform)) {
    return null;
  }
  if (hasPushToken && pushToken === undefined) {return null;}
  if (pushToken && !EXPO_PUSH_TOKEN.test(pushToken)) {return null;}
  return {
    installationId,
    platform: platform as "IOS" | "ANDROID",
    ...(hasPushToken ? { pushToken } : {}),
    appVersion,
  };
}
