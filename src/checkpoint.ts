// Progress checkpointing for resumable fetches
import fs from 'fs';
import path from 'path';
import { createLogger } from './logger.ts';

const log = createLogger('checkpoint');

export interface Checkpoint {
  identifier: string;
  monthsAgo: number;
  batchSize: number;
  cutoffDate: string;
  fetchedAt: string;
  start: number;
  posts: unknown[];
  completed: boolean;
}

export class CheckpointManager {
  private checkpointDir: string;
  private checkpointFile: string | null = null;

  constructor(outputDir: string = 'output') {
    this.checkpointDir = outputDir;
  }

  private getCheckpointPath(identifier: string): string {
    return path.join(this.checkpointDir, `${identifier}-checkpoint.json`);
  }

  /**
   * Load existing checkpoint if it exists
   */
  load(identifier: string): Checkpoint | null {
    const filePath = this.getCheckpointPath(identifier);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const checkpoint = JSON.parse(content) as Checkpoint;
      log.info({ identifier, posts: checkpoint.posts.length, start: checkpoint.start }, 'Checkpoint loaded');
      return checkpoint;
    } catch (err) {
      log.warn({ identifier, error: String(err) }, 'Failed to load checkpoint, starting fresh');
      return null;
    }
  }

  /**
   * Save progress checkpoint
   */
  save(checkpoint: Checkpoint): void {
    const filePath = this.getCheckpointPath(checkpoint.identifier);
    
    // Ensure directory exists
    fs.mkdirSync(this.checkpointDir, { recursive: true });
    
    // Write checkpoint
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));
    this.checkpointFile = filePath;
    
    log.debug({ identifier: checkpoint.identifier, posts: checkpoint.posts.length }, 'Checkpoint saved');
  }

  /**
   * Clear checkpoint after successful completion
   */
  clear(identifier: string): void {
    const filePath = this.getCheckpointPath(identifier);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.debug({ identifier }, 'Checkpoint cleared');
    }
    
    this.checkpointFile = null;
  }

  /**
   * Get the checkpoint file path (for cleanup on shutdown)
   */
  getCheckpointFile(): string | null {
    return this.checkpointFile;
  }
}

// Global checkpoint manager for shutdown handling
let activeCheckpointManager: CheckpointManager | null = null;
let activeCheckpoint: Checkpoint | null = null;

export function setActiveCheckpoint(manager: CheckpointManager | null, checkpoint: Checkpoint | null): void {
  activeCheckpointManager = manager;
  activeCheckpoint = checkpoint;
}

export function getActiveCheckpoint(): { manager: CheckpointManager | null; checkpoint: Checkpoint | null } {
  return { manager: activeCheckpointManager, checkpoint: activeCheckpoint };
}
