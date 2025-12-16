import pino from 'pino';

export const logger = pino({
  name: 'annotation-mcp',
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport:
    process.env['NODE_ENV'] === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Create child loggers for different modules
export function createLogger(module: string) {
  return logger.child({ module });
}
