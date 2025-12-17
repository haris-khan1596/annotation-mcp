#!/usr/bin/env node
import { startServer } from './mcp/server.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('main');

// Handle graceful shutdown
function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Main entry point
async function main(): Promise<void> {
  logger.info('Starting annotation-mcp server...');

  setupGracefulShutdown();

  try {
    await startServer();
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error({ error }, 'Unhandled error in main');
  process.exit(1);
});
