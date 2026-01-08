type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private defaultLogLevel: LogLevel;

  constructor() {
    this.defaultLogLevel = 'info';
  }

  private currentLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    return envLevel || this.defaultLogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.currentLogLevel());
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error?.message,
        stack: error?.stack,
        name: error?.name,
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }
}

export const logger = new Logger();
