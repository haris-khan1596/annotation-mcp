import pino, { type LoggerOptions } from 'pino';

const options: LoggerOptions = {
  name: 'annotation-mcp',
  level: process.env['LOG_LEVEL'] ?? 'info',
};

// Only use pino-pretty transport in development (requires pino-pretty to be installed)
if (process.env['NODE_ENV'] === 'development') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

export const logger = pino(options);

// Create child loggers for different modules
export function createLogger(module: string) {
  return logger.child({ module });
}
