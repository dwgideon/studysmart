export function calculatePoints(seconds: number): number {
  if (seconds <= 5) return 50;
  if (seconds <= 10) return 30;
  if (seconds <= 20) return 15;
  return 5;
}
