export function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return "NASA-" + segments.join("-");
}

export function generateBulkKeys(count: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) keys.push(generateKey());
  return keys;
}
