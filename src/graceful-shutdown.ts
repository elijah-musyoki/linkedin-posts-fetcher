// Graceful shutdown handling
import { createLogger } from './logger.ts';
import { getActiveCheckpoint } from './checkpoint.ts';

const log = createLogger('shutdown');

let isShuttingDown = false;

export function isShuttingDownRequested(): boolean {
  return isShuttingDown;
}

export function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      log.warn('Forcing immediate exit');
      process.exit(1);
    }
    
    isShuttingDown = true;
    log.info({ signal }, 'Shutdown requested, saving progress...');
    
    // Save checkpoint if active
    const { manager, checkpoint } = getActiveCheckpoint();
    if (manager && checkpoint) {
      log.info({ identifier: checkpoint.identifier, posts: checkpoint.posts.length }, 'Saving checkpoint before shutdown');
      manager.save(checkpoint);
      console.log(`\n💾 Progress saved: ${checkpoint.posts.length} posts fetched`);
      console.log(`   Run again to resume from where you left off`);
    }
    
    log.info('Shutdown complete');
    process.exit(0);
  };

  // Handle SIGTERM (kill command, docker stop, etc.)
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    log.error({ error: err.message, stack: err.stack }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    log.error({ reason: String(reason) }, 'Unhandled rejection');
    shutdown('unhandledRejection');
  });

  log.debug('Graceful shutdown handlers registered');
}
