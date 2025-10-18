/**
 * Logging utility with environment-aware log levels
 * 
 * In production: Only warn and error logs are shown
 * In development: All logs are shown
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private prefix: string;
  private showTimestamp: boolean;
  private isDevelopment: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.showTimestamp = options.timestamp ?? false;
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }
    
    parts.push(message);
    return parts.join(' ');
  }

  /**
   * Debug level - only shown in development
   * Use for detailed diagnostic information
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Info level - only shown in development
   * Use for general informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Warning level - shown in all environments
   * Use for potentially harmful situations
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  /**
   * Error level - shown in all environments
   * Use for error events that might still allow the app to continue
   */
  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }
}

// Default logger instance
export const logger = new Logger();

// Create logger with custom prefix for specific modules
export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};

// Module-specific loggers for better traceability
export const apiLogger = createLogger({ prefix: 'API' });
export const dbLogger = createLogger({ prefix: 'DB' });
export const scheduleLogger = createLogger({ prefix: 'SCHEDULE' });
