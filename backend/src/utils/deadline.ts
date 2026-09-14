export type DeadlineTone = "green" | "yellow" | "red" | "gray";

export function getDeadlineTone(deadline: Date, now = new Date()): DeadlineTone {
  if (deadline.getTime() < now.getTime()) return "gray";
  const days = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 3) return "red";
  if (days <= 7) return "yellow";
  return "green";
}

export function getLifecycleStatus(deadline: Date, currentStatus: string, now = new Date()) {
  if (["archived", "rejected", "draft", "pending"].includes(currentStatus)) {
    return currentStatus;
  }
  if (deadline.getTime() < now.getTime()) return "expired";
  const days = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return "expiring_soon";
  return "active";
}

export function parseJsonArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(value?: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
