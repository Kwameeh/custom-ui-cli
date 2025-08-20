/**
 * User feedback and progress indication utilities
 */
import { UserFeedback, ProgressIndicator, ProgressOptions } from '../types';
/**
 * Console-based user feedback implementation
 */
export declare class ConsoleFeedback implements UserFeedback {
    success(message: string): void;
    error(message: string, error?: Error): void;
    warning(message: string): void;
    info(message: string): void;
    progress(options: ProgressOptions): ProgressIndicator;
}
/**
 * Silent feedback implementation for testing
 */
export declare class SilentFeedback implements UserFeedback {
    private messages;
    success(message: string): void;
    error(message: string, error?: Error): void;
    warning(message: string): void;
    info(message: string): void;
    progress(options: ProgressOptions): ProgressIndicator;
    getMessages(): Array<{
        type: string;
        message: string;
        error?: Error;
    }>;
    clear(): void;
}
/**
 * Factory for creating feedback instances
 */
export declare class FeedbackFactory {
    static create(type?: 'console' | 'silent'): UserFeedback;
}
/**
 * Global feedback instance
 */
export declare const feedback: UserFeedback;
/**
 * Utility functions for common feedback patterns
 */
export declare class FeedbackUtils {
    /**
     * Executes an operation with progress feedback
     */
    static withProgress<T>(operation: (progress: ProgressIndicator) => Promise<T>, options: ProgressOptions, feedbackInstance?: UserFeedback): Promise<T>;
    /**
     * Executes multiple operations with combined progress
     */
    static withSteps<T>(steps: Array<{
        name: string;
        operation: () => Promise<T>;
    }>, feedbackInstance?: UserFeedback): Promise<T[]>;
}
//# sourceMappingURL=user-feedback.d.ts.map