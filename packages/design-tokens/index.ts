import raw from "./tokens.json";

export type DesignTokens = typeof raw;

export const tokens: DesignTokens = raw;

export function getColor(path: string): string {
  const parts = path.split(".");
  let current: unknown = tokens.color;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : "";
}

export function getSpacing(index: number): number {
  return tokens.spacing[index] ?? 0;
}

export type { DesignTokens as default };