export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
