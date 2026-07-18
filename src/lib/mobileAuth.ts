export function bearerTokenFromHeader(
  header: string | string[] | undefined
): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || value.length > 8_200) {return null;}
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(value);
  return match?.[1] ?? null;
}
