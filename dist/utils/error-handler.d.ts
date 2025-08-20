/**
 * Comprehensive error handling utilities for the CLI
 */
import { CLIError, ErrorCode } from '../types';
export declare class ErrorHandler {
    /**
     * Creates a standardized CLI error with helpful suggestions
     */
    static createError(code: ErrorCode, message: string, context?: Record<string, any>): CLIError;
    /**
     * Handles network-related errors with graceful fallbacks
     */
    static handleNetworkError(error: Error, context?: Record<string, any>): CLIError;
    /**
     * Handles file system errors with actionable suggestions
     */
    static handleFileSystemError(error: Error, filePath?: string): CLIError;
    /**
     * Handles component-related errors
     */
    static handleComponentError(componentName: string, error: Error): CLIError;
    /**
     * Handles dependency-related errors
     */
    static handleDependencyError(dependency: string, error: Error): CLIError;
    /**
     * Gets contextual suggestions based on error code
     */
    private static getSuggestions;
    /**
     * Formats error for user display
     */
    static formatError(error: CLIError): string;
    /**
     * Determines if an error is recoverable
     */
    static isRecoverable(error: CLIError): boolean;
}
/**
 * Network error handling with retry logic
 */
export declare class NetworkErrorHandler {
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    /**
     * Executes a network operation with retry logic
     */
    static withRetry<T>(operation: () => Promise<T>, context?: Record<string, any>): Promise<T>;
    /**
     * Checks if an error is network-related
     */
    static isNetworkError(error: Error): boolean;
}
//# sourceMappingURL=error-handler.d.ts.map