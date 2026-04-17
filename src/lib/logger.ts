type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

interface LogPayload {
  level: LogLevel;
  msg: string;
  time: string;
  [key: string]: unknown;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === 'string') return { message: err };
  try {
    return { value: JSON.parse(JSON.stringify(err)) };
  } catch {
    return { value: String(err) };
  }
}

function redact(ctx: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (
      /token|secret|password|authorization|api[-_]?key|stripe|cookie/i.test(key) &&
      typeof value === 'string'
    ) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

function emit(level: LogLevel, msg: string, ctx?: LogContext): void {
  const payload: LogPayload = {
    level,
    msg,
    time: new Date().toISOString(),
    ...(ctx ? redact(ctx) : {}),
  };

  const serialized = JSON.stringify(payload);
  const stream = level === 'error' || level === 'warn' ? console.error : console.log;
  stream(serialized);
}

export const logger = {
  debug(msg: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV === 'production') return;
    emit('debug', msg, ctx);
  },
  info(msg: string, ctx?: LogContext): void {
    emit('info', msg, ctx);
  },
  warn(msg: string, ctx?: LogContext): void {
    emit('warn', msg, ctx);
  },
  error(msg: string, err?: unknown, ctx?: LogContext): void {
    emit('error', msg, { ...(ctx ?? {}), error: err ? serializeError(err) : undefined });
  },
};
