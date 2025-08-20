/**
 * Tests for error handling utilities
 */

import { ErrorHandler, NetworkErrorHandler } from '../error-handler';
import { CLIError, ERROR_CODES } from '../../types';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('should create a CLIError with correct properties', () => {
      const error = ErrorHandler.createError(
        ERROR_CODES.NETWORK_ERROR,
        'Test error message',
        { testContext: 'value' }
      );

      expect(error).toBeInstanceOf(CLIError);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(ERROR_CODES.NETWORK_ERROR);
      expect(error.context).toEqual({ testContext: 'value' });
      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.length).toBeGreaterThan(0);
    });

    it('should include appropriate suggestions for each error code', () => {
      const networkError = ErrorHandler.createError(ERROR_CODES.NETWORK_ERROR, 'Network failed');
      expect(networkError.suggestions).toContain('Check your internet connection');

      const fileError = ErrorHandler.createError(ERROR_CODES.FILE_EXISTS, 'File exists');
      expect(fileError.suggestions).toContain('Use --force flag to overwrite');

      const projectError = ErrorHandler.createError(ERROR_CODES.INVALID_PROJECT, 'Invalid project');
      expect(projectError.suggestions).toContain('Run "custom-ui init" to set up the project');
    });
  });

  describe('handleNetworkError', () => {
    it('should create network error with appropriate message and suggestions', () => {
      const originalError = new Error('ENOTFOUND registry.example.com');
      const cliError = ErrorHandler.handleNetworkError(originalError, { url: 'https://registry.example.com' });

      expect(cliError.code).toBe(ERROR_CODES.NETWORK_ERROR);
      expect(cliError.message).toContain('Failed to connect to component registry');
      expect(cliError.suggestions).toContain('Check your internet connection');
      expect(cliError.context?.originalError).toBe(originalError.message);
      expect(cliError.context?.url).toBe('https://registry.example.com');
    });
  });

  describe('handleFileSystemError', () => {
    it('should handle ENOENT errors correctly', () => {
      const originalError = new Error('ENOENT: no such file or directory');
      const cliError = ErrorHandler.handleFileSystemError(originalError, '/path/to/file');

      expect(cliError.message).toContain('File or directory not found');
      expect(cliError.suggestions).toContain('Check if the file path is correct');
      expect(cliError.context?.filePath).toBe('/path/to/file');
    });

    it('should handle permission errors correctly', () => {
      const originalError = new Error('EACCES: permission denied');
      const cliError = ErrorHandler.handleFileSystemError(originalError, '/protected/file');

      expect(cliError.code).toBe(ERROR_CODES.PERMISSION_DENIED);
      expect(cliError.message).toContain('Permission denied');
      expect(cliError.suggestions).toContain('Run the command with appropriate permissions');
    });

    it('should handle file exists errors correctly', () => {
      const originalError = new Error('EEXIST: file already exists');
      const cliError = ErrorHandler.handleFileSystemError(originalError, '/existing/file');

      expect(cliError.code).toBe(ERROR_CODES.FILE_EXISTS);
      expect(cliError.message).toContain('File already exists');
      expect(cliError.suggestions).toContain('Use --force flag to overwrite existing files');
    });
  });

  describe('handleComponentError', () => {
    it('should create component error with component context', () => {
      const originalError = new Error('Component not found in registry');
      const cliError = ErrorHandler.handleComponentError('button', originalError);

      expect(cliError.code).toBe(ERROR_CODES.COMPONENT_NOT_FOUND);
      expect(cliError.message).toContain('Failed to process component "button"');
      expect(cliError.suggestions).toContain('Check if the component name is correct');
      expect(cliError.context?.componentName).toBe('button');
    });
  });

  describe('handleDependencyError', () => {
    it('should create dependency error with dependency context', () => {
      const originalError = new Error('Package not found');
      const cliError = ErrorHandler.handleDependencyError('react', originalError);

      expect(cliError.code).toBe(ERROR_CODES.MISSING_DEPENDENCY);
      expect(cliError.message).toContain('Failed to install dependency "react"');
      expect(cliError.suggestions).toContain('Check your npm/yarn configuration');
      expect(cliError.context?.dependency).toBe('react');
    });
  });

  describe('formatError', () => {
    it('should format error with message, suggestions, and context', () => {
      const error = new CLIError(
        'Test error',
        ERROR_CODES.NETWORK_ERROR,
        ['Suggestion 1', 'Suggestion 2'],
        { key: 'value', originalError: 'Original error message' }
      );

      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain('❌ Error: Test error');
      expect(formatted).toContain('💡 Suggestions:');
      expect(formatted).toContain('1. Suggestion 1');
      expect(formatted).toContain('2. Suggestion 2');
      expect(formatted).toContain('📋 Context:');
      expect(formatted).toContain('key: value');
      expect(formatted).not.toContain('originalError:'); // Should be excluded
    });

    it('should handle error without suggestions or context', () => {
      const error = new CLIError('Simple error', ERROR_CODES.NETWORK_ERROR);
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain('❌ Error: Simple error');
      expect(formatted).not.toContain('💡 Suggestions:');
      expect(formatted).not.toContain('📋 Context:');
    });
  });

  describe('isRecoverable', () => {
    it('should identify recoverable errors', () => {
      const networkError = new CLIError('Network error', ERROR_CODES.NETWORK_ERROR);
      const fileExistsError = new CLIError('File exists', ERROR_CODES.FILE_EXISTS);
      const conflictError = new CLIError('Conflict', ERROR_CODES.DEPENDENCY_CONFLICT);

      expect(ErrorHandler.isRecoverable(networkError)).toBe(true);
      expect(ErrorHandler.isRecoverable(fileExistsError)).toBe(true);
      expect(ErrorHandler.isRecoverable(conflictError)).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      const permissionError = new CLIError('Permission denied', ERROR_CODES.PERMISSION_DENIED);
      const invalidProjectError = new CLIError('Invalid project', ERROR_CODES.INVALID_PROJECT);

      expect(ErrorHandler.isRecoverable(permissionError)).toBe(false);
      expect(ErrorHandler.isRecoverable(invalidProjectError)).toBe(false);
    });
  });
});

describe('NetworkErrorHandler', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await NetworkErrorHandler.withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await NetworkErrorHandler.withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw CLIError after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent network error'));

      await expect(NetworkErrorHandler.withRetry(operation)).rejects.toThrow(CLIError);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should include context in error after retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const context = { url: 'https://example.com' };

      try {
        await NetworkErrorHandler.withRetry(operation, context);
      } catch (error) {
        expect(error).toBeInstanceOf(CLIError);
        expect((error as CLIError).context?.url).toBe('https://example.com');
        expect((error as CLIError).context?.attempts).toBe(3);
      }
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      const enotfoundError = new Error('ENOTFOUND example.com');
      const econnrefusedError = new Error('ECONNREFUSED 127.0.0.1:3000');
      const etimedoutError = new Error('ETIMEDOUT');
      const econnresetError = new Error('ECONNRESET');

      expect(NetworkErrorHandler.isNetworkError(enotfoundError)).toBe(true);
      expect(NetworkErrorHandler.isNetworkError(econnrefusedError)).toBe(true);
      expect(NetworkErrorHandler.isNetworkError(etimedoutError)).toBe(true);
      expect(NetworkErrorHandler.isNetworkError(econnresetError)).toBe(true);
    });

    it('should not identify non-network errors', () => {
      const fileError = new Error('ENOENT: no such file');
      const permissionError = new Error('EACCES: permission denied');
      const genericError = new Error('Something went wrong');

      expect(NetworkErrorHandler.isNetworkError(fileError)).toBe(false);
      expect(NetworkErrorHandler.isNetworkError(permissionError)).toBe(false);
      expect(NetworkErrorHandler.isNetworkError(genericError)).toBe(false);
    });
  });
});