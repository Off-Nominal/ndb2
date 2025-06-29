/**
 * Reusable logger utility for the application
 * Only logs when NODE_ENV is not "test"
 */
export class Logger {
  private code: string;

  constructor(code: string) {
    this.code = code.toUpperCase();
  }

  /**
   * Log an informational message
   */
  log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${this.code}]: ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[${this.code}]: ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[${this.code}]: ${message}`, ...args);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== "test") {
      console.debug(`[${this.code}]: ${message}`, ...args);
    }
  }
}

/**
 * Factory function to create a logger with a specific code
 */
export function createLogger(code: string): Logger {
  return new Logger(code);
}
