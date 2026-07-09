import pino from 'pino';
import { Environment } from './env.js';

/**
 * Creates and configures a Pino logger instance.
 * Logger is configured based on environment variables.
 *
 * In development: pretty-printed output for readability.
 * In production: JSON output for log aggregation systems.
 */
export function createLogger(env: Environment): pino.Logger {
  const isDev = env.NODE_ENV === 'development';
  const logLevel = env.LOG_LEVEL;

  return pino(
    {
      level: logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    isDev
      ? pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        })
      : undefined
  );
}

/**
 * Get a child logger with a specific context/module name.
 * Child loggers include the binding in all log messages.
 *
 * Usage:
 *   const log = getChildLogger(logger, 'research-agent');
 *   log.info({ appName: 'Stripe' }, 'Starting research');
 */
export function getChildLogger(logger: pino.Logger, context: string): pino.Logger {
  return logger.child({ context });
}
