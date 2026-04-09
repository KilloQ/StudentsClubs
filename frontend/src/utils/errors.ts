export function getErrorMessage(err: unknown, fallback = "Ошибка"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as Record<string, unknown>).message;
    if (typeof msg === "string") return msg || fallback;
  }
  return fallback;
}

