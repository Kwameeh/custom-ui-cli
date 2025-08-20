/**
 * Comprehensive error handling utilities for the CLI
 */

import { CLIError, ERROR_CODES, ErrorCode } from '../types';

export class ErrorHandler {
  /**
   * Creates a standardized CLI error with helpful suggestions
   */
  static createError(
    code: ErrorCode,
    message: string,
    context?: Record<string, any>
  ): CLIError {
    const suggestions = this.getSuggestions(code, context);
    return new CLIError(message, code, suggestions, context);
  }

  /**
   * Handles network-related errors with graceful fallbacks
   */
  static handleNetworkError(error: Error, context?: Record<string, any>): CLIError {
    const message = 'Failed to connect to component registry. Please check your internet connection.';
    const suggestions = [
      'Check your internet connection',
      'Try again in a few moments',
      'Use cached components if available',
      'Contact support if the issue persists'
    ];

    return new CLIError(message, ERROR_CODES.NETWORK_ERROR, suggestions, {
      originalError: error.message,
      ...context
    });
  }

  /**
   * Handles file system errors with actionable suggestions
   */
  static handleFileSystemError(error: Error, filePath?: string): CLIError {
    let message = 'File system operation failed.';
    let suggestions: string[] = [];
    let code: ErrorCode = ERROR_CODES.PERMISSION_DENIED;

    if (error.message.includes('ENOENT')) {
      message = `File or directory not found: ${filePath || 'unknown'}`;
      suggestions = [
        'Check if the file path is correct',
        'Ensure the directory exists',
        'Run the init command first if this is a new project'
      ];
    } else if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
      message = `Permission denied accessing: ${filePath || 'file'}`;
      suggestions = [
        'Run the command with appropriate permissions',
        'Check file/directory ownership',
        'Ensure the file is not locked by another process'
      ];
    } else if (error.message.includes('EEXIST')) {
      message = `File already exists: ${filePath || 'unknown'}`;
      code = ERROR_CODES.FILE_EXISTS;
      suggestions = [
        'Use --force flag to overwrite existing files',
        'Choose a different file name',
        'Remove the existing file first'
      ];
    }

    return new CLIError(message, code, suggestions, {
      originalError: error.message,
      filePath
    });
  }

  /**
   * Handles component-related errors
   */
  static handleComponentError(componentName: string, error: Error): CLIError {
    const message = `Failed to process component "${componentName}": ${error.message}`;
    const suggestions = [
      'Check if the component name is correct',
      'Run "custom-ui list" to see available components',
      'Try updating the component registry',
      'Check component dependencies'
    ];

    return new CLIError(message, ERROR_CODES.COMPONENT_NOT_FOUND, suggestions, {
      componentName,
      originalError: error.message
    });
  }

  /**
   * Handles dependency-related errors
   */
  static handleDependencyError(dependency: string, error: Error): CLIError {
    const message = `Failed to install dependency "${dependency}": ${error.message}`;
    const suggestions = [
      'Check your npm/yarn configuration',
      'Ensure you have internet connectivity',
      'Try clearing npm cache: npm cache clean --force',
      'Check if the dependency name is correct'
    ];

    return new CLIError(message, ERROR_CODES.MISSING_DEPENDENCY, suggestions, {
      dependency,
      originalError: error.message
    });
  }

  /**
   * Gets contextual suggestions based on error code
   */
  private static getSuggestions(code: ErrorCode, context?: Record<string, any>): string[] {
    switch (code) {
      case ERROR_CODES.NETWORK_ERROR:
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Use cached components if available'
        ];

      case ERROR_CODES.FILE_EXISTS:
        return [
          'Use --force flag to overwrite',
          'Choose a different location',
          'Remove existing file first'
        ];

      case ERROR_CODES.INVALID_PROJECT:
        return [
          'Run "custom-ui init" to set up the project',
          'Ensure you\'re in a React project directory',
          'Check package.json for React dependencies'
        ];

      case ERROR_CODES.MISSING_DEPENDENCY:
        return [
          'Run npm install or yarn install',
          'Check your package manager configuration',
          'Ensure internet connectivity'
        ];

      case ERROR_CODES.COMPONENT_NOT_FOUND:
        return [
          'Run "custom-ui list" to see available components',
          'Check component name spelling',
          'Update component registry'
        ];

      case ERROR_CODES.INVALID_COMMAND:
        return [
          'Run "custom-ui --help" for available commands',
          'Check command syntax',
          'Use "custom-ui docs" for examples'
        ];

      case ERROR_CODES.REGISTRY_ERROR:
        return [
          'Check internet connection',
          'Try updating the registry',
          'Contact support if issue persists'
        ];

      case ERROR_CODES.DEPENDENCY_CONFLICT:
        return [
          'Review conflicting dependencies',
          'Update package.json manually',
          'Use --force flag to override conflicts'
        ];

      case ERROR_CODES.CONFIG_ERROR:
        return [
          'Check configuration file syntax',
          'Run "custom-ui init" to reset configuration',
          'Verify all required fields are present'
        ];

      default:
        return [
          'Check the command syntax',
          'Run with --help for more information',
          'Contact support if the issue persists'
        ];
    }
  }

  /**
   * Formats error for user display
   */
  static formatError(error: CLIError): string {
    let output = `\n❌ Error: ${error.message}\n`;
    
    if (error.suggestions && error.suggestions.length > 0) {
      output += '\n💡 Suggestions:\n';
      error.suggestions.forEach((suggestion, index) => {
        output += `   ${index + 1}. ${suggestion}\n`;
      });
    }

    if (error.context && Object.keys(error.context).length > 0) {
      output += '\n📋 Context:\n';
      Object.entries(error.context).forEach(([key, value]) => {
        if (key !== 'originalError') {
          output += `   ${key}: ${value}\n`;
        }
      });
    }

    return output;
  }

  /**
   * Determines if an error is recoverable
   */
  static isRecoverable(error: CLIError): boolean {
    const recoverableErrors = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.FILE_EXISTS,
      ERROR_CODES.DEPENDENCY_CONFLICT
    ];
    
    return recoverableErrors.includes(error.code as any);
  }
}

/**
 * Network error handling with retry logic
 */
export class NetworkErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Executes a network operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.MAX_RETRIES) {
          throw ErrorHandler.handleNetworkError(lastError, {
            ...context,
            attempts: attempt
          });
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }

    throw ErrorHandler.handleNetworkError(lastError!, context);
  }

  /**
   * Checks if an error is network-related
   */
  static isNetworkError(error: Error): boolean {
    const networkErrorCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
    return networkErrorCodes.some(code => error.message.includes(code));
  }
}