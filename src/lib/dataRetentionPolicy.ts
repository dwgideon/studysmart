export const DAY_MS = 86_400_000;

export function effectiveRetentionDays(
  personalDays: number,
  districtDays?: number | null
) {
  const personal = Math.max(30, Math.min(365, Math.round(personalDays)));
  if (districtDays === null || districtDays === undefined) {return personal;}
  return Math.min(personal, Math.max(30, Math.min(365, Math.round(districtDays))));
}

export function retentionCutoff(
  now: Date,
  personalDays: number,
  districtDays?: number | null
) {
  return new Date(
    now.getTime() - effectiveRetentionDays(personalDays, districtDays) * DAY_MS
  );
}
