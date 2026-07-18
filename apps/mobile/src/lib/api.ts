import { supabase } from "./supabase";
import { mobileConfig } from "./config";
import { getInstallationId } from "./installation";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  anonymous?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!mobileConfig.apiUrl) {throw new ApiError("The StudySmart API URL is not configured.", 0, "CONFIGURATION_REQUIRED");}
  const session = options.anonymous ? null : (await supabase.auth.getSession()).data.session;
  if (!options.anonymous && !session?.access_token) {throw new ApiError("Please sign in again.", 401, "UNAUTHORIZED");}
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Installation-ID", await getInstallationId());
  if (session?.access_token) {headers.set("Authorization", `Bearer ${session.access_token}`);}
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`${mobileConfig.apiUrl}${path}`, { ...options, headers, body });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {payload = JSON.parse(text);} catch {payload = text;}
  }
  if (!response.ok) {
    const error = payload && typeof payload === "object" ? payload as { error?: string; reply?: string; code?: string } : {};
    throw new ApiError(error.error ?? error.reply ?? "StudySmart could not complete that request.", response.status, error.code);
  }
  return payload as T;
}
