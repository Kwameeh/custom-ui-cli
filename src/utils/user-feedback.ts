/**
 * User feedback and progress indication utilities
 */

import { UserFeedback, ProgressIndicator, ProgressOptions } from '../types';

/**
 * Console colors and icons
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  progress: '⏳'
};

/**
 * Console-based user feedback implementation
 */
export class ConsoleFeedback implements UserFeedback {

  success(message: string): void {
    console.log(`${COLORS.green}${ICONS.success} ${message}${COLORS.reset}`);
  }

  error(message: string, error?: Error): void {
    console.error(`${COLORS.red}${ICONS.error} ${message}${COLORS.reset}`);
    if (error && process.env.DEBUG) {
      console.error(`${COLORS.gray}${error.stack}${COLORS.reset}`);
    }
  }

  warning(message: string): void {
    console.warn(`${COLORS.yellow}${ICONS.warning} ${message}${COLORS.reset}`);
  }

  info(message: string): void {
    console.log(`${COLORS.blue}${ICONS.info} ${message}${COLORS.reset}`);
  }

  progress(options: ProgressOptions): ProgressIndicator {
    return new ConsoleProgressIndicator(options);
  }
}

/**
 * Console-based progress indicator
 */
class ConsoleProgressIndicator implements ProgressIndicator {
  private current = 0;
  private total: number;
  private message: string;
  private showPercentage: boolean;
  private startTime: number;

  constructor(options: ProgressOptions) {
    this.total = options.total || 100;
    this.message = options.message || 'Processing...';
    this.showPercentage = options.showPercentage !== false;
    this.startTime = Date.now();
    
    this.render();
  }

  update(current: number, message?: string): void {
    this.current = Math.min(current, this.total);
    if (message) {
      this.message = message;
    }
    this.render();
  }

  increment(message?: string): void {
    this.update(this.current + 1, message);
  }

  complete(message?: string): void {
    this.current = this.total;
    if (message) {
      this.message = message;
    }
    this.render();
    
    const duration = Date.now() - this.startTime;
    console.log(`\n${COLORS.green}✅ Completed in ${duration}ms${COLORS.reset}`);
  }

  fail(message?: string): void {
    if (message) {
      this.message = message;
    }
    console.log(`\n${COLORS.red}❌ ${this.message}${COLORS.reset}`);
  }

  private render(): void {
    const percentage = Math.round((this.current / this.total) * 100);
    const barLength = 30;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    let output = `\r${COLORS.cyan}${ICONS.progress} ${this.message}${COLORS.reset}`;
    
    if (this.showPercentage) {
      output += ` [${bar}] ${percentage}%`;
    } else {
      output += ` [${bar}] ${this.current}/${this.total}`;
    }

    process.stdout.write(output);
  }
}

/**
 * Silent feedback implementation for testing
 */
export class SilentFeedback implements UserFeedback {
  private messages: Array<{ type: string; message: string; error?: Error }> = [];

  success(message: string): void {
    this.messages.push({ type: 'success', message });
  }

  error(message: string, error?: Error): void {
    this.messages.push({ type: 'error', message, error });
  }

  warning(message: string): void {
    this.messages.push({ type: 'warning', message });
  }

  info(message: string): void {
    this.messages.push({ type: 'info', message });
  }

  progress(options: ProgressOptions): ProgressIndicator {
    return new SilentProgressIndicator(options);
  }

  getMessages(): Array<{ type: string; message: string; error?: Error }> {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }
}

/**
 * Silent progress indicator for testing
 */
class SilentProgressIndicator implements ProgressIndicator {
  private current = 0;
  private total: number;
  private message: string;
  private completed = false;
  private failed = false;

  constructor(options: ProgressOptions) {
    this.total = options.total || 100;
    this.message = options.message || 'Processing...';
  }

  update(current: number, message?: string): void {
    this.current = Math.min(current, this.total);
    if (message) {
      this.message = message;
    }
  }

  increment(message?: string): void {
    this.update(this.current + 1, message);
  }

  complete(message?: string): void {
    this.current = this.total;
    this.completed = true;
    if (message) {
      this.message = message;
    }
  }

  fail(message?: string): void {
    this.failed = true;
    if (message) {
      this.message = message;
    }
  }

  getStatus() {
    return {
      current: this.current,
      total: this.total,
      message: this.message,
      completed: this.completed,
      failed: this.failed,
      percentage: Math.round((this.current / this.total) * 100)
    };
  }
}

/**
 * Factory for creating feedback instances
 */
export class FeedbackFactory {
  static create(type: 'console' | 'silent' = 'console'): UserFeedback {
    switch (type) {
      case 'silent':
        return new SilentFeedback();
      case 'console':
      default:
        return new ConsoleFeedback();
    }
  }
}

/**
 * Global feedback instance
 */
export const feedback = FeedbackFactory.create();

/**
 * Utility functions for common feedback patterns
 */
export class FeedbackUtils {
  /**
   * Executes an operation with progress feedback
   */
  static async withProgress<T>(
    operation: (progress: ProgressIndicator) => Promise<T>,
    options: ProgressOptions,
    feedbackInstance: UserFeedback = feedback
  ): Promise<T> {
    const progress = feedbackInstance.progress(options);
    
    try {
      const result = await operation(progress);
      progress.complete();
      return result;
    } catch (error) {
      progress.fail(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Executes multiple operations with combined progress
   */
  static async withSteps<T>(
    steps: Array<{
      name: string;
      operation: () => Promise<T>;
    }>,
    feedbackInstance: UserFeedback = feedback
  ): Promise<T[]> {
    const progress = feedbackInstance.progress({
      total: steps.length,
      message: 'Starting...',
      showPercentage: false
    });

    const results: T[] = [];
    let currentStep = 0;

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        currentStep = i;
        progress.update(i, step.name);
        
        const result = await step.operation();
        results.push(result);
        
        progress.increment(`Completed: ${step.name}`);
      }

      progress.complete('All steps completed successfully');
      return results;
    } catch (error) {
      progress.fail(`Failed at step: ${steps[currentStep]?.name || 'unknown'}`);
      throw error;
    }
  }
}