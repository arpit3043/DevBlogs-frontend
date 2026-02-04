type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined)?.toLowerCase() as
    | LogLevel
    | undefined;
const CURRENT_LEVEL: LogLevel = envLevel && envLevel in LEVELS ? envLevel : "info";

function shouldLog(level: LogLevel) {
  return LEVELS[level] >= LEVELS[CURRENT_LEVEL];
}

function sanitizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;

  const clone: any = Array.isArray(payload) ? [...payload] : { ...(payload as any) };
  const redactKeys = ["password", "confirmPassword", "token"];

  for (const key of Object.keys(clone)) {
    if (redactKeys.includes(key)) {
      clone[key] = "***redacted***";
    }
  }

  return clone;
}

export const logger = {
  debug(message: string, context?: unknown) {
    if (!shouldLog("debug")) return;
    console.debug("[app]", message, sanitizePayload(context));
  },
  info(message: string, context?: unknown) {
    if (!shouldLog("info")) return;
    console.info("[app]", message, sanitizePayload(context));
  },
  warn(message: string, context?: unknown) {
    if (!shouldLog("warn")) return;
    console.warn("[app]", message, sanitizePayload(context));
  },
  error(message: string, context?: unknown) {
    if (!shouldLog("error")) return;
    console.error("[app]", message, sanitizePayload(context));
  },
};

