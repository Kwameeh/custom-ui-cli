"use strict";
/**
 * Tests for error handling utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_1 = require("../error-handler");
const types_1 = require("../../types");
describe('ErrorHandler', () => {
    describe('createError', () => {
        it('should create a CLIError with correct properties', () => {
            const error = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.NETWORK_ERROR, 'Test error message', { testContext: 'value' });
            expect(error).toBeInstanceOf(types_1.CLIError);
            expect(error.message).toBe('Test error message');
            expect(error.code).toBe(types_1.ERROR_CODES.NETWORK_ERROR);
            expect(error.context).toEqual({ testContext: 'value' });
            expect(error.suggestions).toBeDefined();
            expect(error.suggestions.length).toBeGreaterThan(0);
        });
        it('should include appropriate suggestions for each error code', () => {
            const networkError = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.NETWORK_ERROR, 'Network failed');
            expect(networkError.suggestions).toContain('Check your internet connection');
            const fileError = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.FILE_EXISTS, 'File exists');
            expect(fileError.suggestions).toContain('Use --force flag to overwrite');
            const projectError = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.INVALID_PROJECT, 'Invalid project');
            expect(projectError.suggestions).toContain('Run "custom-ui init" to set up the project');
        });
    });
    describe('handleNetworkError', () => {
        it('should create network error with appropriate message and suggestions', () => {
            const originalError = new Error('ENOTFOUND registry.example.com');
            const cliError = error_handler_1.ErrorHandler.handleNetworkError(originalError, { url: 'https://registry.example.com' });
            expect(cliError.code).toBe(types_1.ERROR_CODES.NETWORK_ERROR);
            expect(cliError.message).toContain('Failed to connect to component registry');
            expect(cliError.suggestions).toContain('Check your internet connection');
            expect(cliError.context?.originalError).toBe(originalError.message);
            expect(cliError.context?.url).toBe('https://registry.example.com');
        });
    });
    describe('handleFileSystemError', () => {
        it('should handle ENOENT errors correctly', () => {
            const originalError = new Error('ENOENT: no such file or directory');
            const cliError = error_handler_1.ErrorHandler.handleFileSystemError(originalError, '/path/to/file');
            expect(cliError.message).toContain('File or directory not found');
            expect(cliError.suggestions).toContain('Check if the file path is correct');
            expect(cliError.context?.filePath).toBe('/path/to/file');
        });
        it('should handle permission errors correctly', () => {
            const originalError = new Error('EACCES: permission denied');
            const cliError = error_handler_1.ErrorHandler.handleFileSystemError(originalError, '/protected/file');
            expect(cliError.code).toBe(types_1.ERROR_CODES.PERMISSION_DENIED);
            expect(cliError.message).toContain('Permission denied');
            expect(cliError.suggestions).toContain('Run the command with appropriate permissions');
        });
        it('should handle file exists errors correctly', () => {
            const originalError = new Error('EEXIST: file already exists');
            const cliError = error_handler_1.ErrorHandler.handleFileSystemError(originalError, '/existing/file');
            expect(cliError.code).toBe(types_1.ERROR_CODES.FILE_EXISTS);
            expect(cliError.message).toContain('File already exists');
            expect(cliError.suggestions).toContain('Use --force flag to overwrite existing files');
        });
    });
    describe('handleComponentError', () => {
        it('should create component error with component context', () => {
            const originalError = new Error('Component not found in registry');
            const cliError = error_handler_1.ErrorHandler.handleComponentError('button', originalError);
            expect(cliError.code).toBe(types_1.ERROR_CODES.COMPONENT_NOT_FOUND);
            expect(cliError.message).toContain('Failed to process component "button"');
            expect(cliError.suggestions).toContain('Check if the component name is correct');
            expect(cliError.context?.componentName).toBe('button');
        });
    });
    describe('handleDependencyError', () => {
        it('should create dependency error with dependency context', () => {
            const originalError = new Error('Package not found');
            const cliError = error_handler_1.ErrorHandler.handleDependencyError('react', originalError);
            expect(cliError.code).toBe(types_1.ERROR_CODES.MISSING_DEPENDENCY);
            expect(cliError.message).toContain('Failed to install dependency "react"');
            expect(cliError.suggestions).toContain('Check your npm/yarn configuration');
            expect(cliError.context?.dependency).toBe('react');
        });
    });
    describe('formatError', () => {
        it('should format error with message, suggestions, and context', () => {
            const error = new types_1.CLIError('Test error', types_1.ERROR_CODES.NETWORK_ERROR, ['Suggestion 1', 'Suggestion 2'], { key: 'value', originalError: 'Original error message' });
            const formatted = error_handler_1.ErrorHandler.formatError(error);
            expect(formatted).toContain('❌ Error: Test error');
            expect(formatted).toContain('💡 Suggestions:');
            expect(formatted).toContain('1. Suggestion 1');
            expect(formatted).toContain('2. Suggestion 2');
            expect(formatted).toContain('📋 Context:');
            expect(formatted).toContain('key: value');
            expect(formatted).not.toContain('originalError:'); // Should be excluded
        });
        it('should handle error without suggestions or context', () => {
            const error = new types_1.CLIError('Simple error', types_1.ERROR_CODES.NETWORK_ERROR);
            const formatted = error_handler_1.ErrorHandler.formatError(error);
            expect(formatted).toContain('❌ Error: Simple error');
            expect(formatted).not.toContain('💡 Suggestions:');
            expect(formatted).not.toContain('📋 Context:');
        });
    });
    describe('isRecoverable', () => {
        it('should identify recoverable errors', () => {
            const networkError = new types_1.CLIError('Network error', types_1.ERROR_CODES.NETWORK_ERROR);
            const fileExistsError = new types_1.CLIError('File exists', types_1.ERROR_CODES.FILE_EXISTS);
            const conflictError = new types_1.CLIError('Conflict', types_1.ERROR_CODES.DEPENDENCY_CONFLICT);
            expect(error_handler_1.ErrorHandler.isRecoverable(networkError)).toBe(true);
            expect(error_handler_1.ErrorHandler.isRecoverable(fileExistsError)).toBe(true);
            expect(error_handler_1.ErrorHandler.isRecoverable(conflictError)).toBe(true);
        });
        it('should identify non-recoverable errors', () => {
            const permissionError = new types_1.CLIError('Permission denied', types_1.ERROR_CODES.PERMISSION_DENIED);
            const invalidProjectError = new types_1.CLIError('Invalid project', types_1.ERROR_CODES.INVALID_PROJECT);
            expect(error_handler_1.ErrorHandler.isRecoverable(permissionError)).toBe(false);
            expect(error_handler_1.ErrorHandler.isRecoverable(invalidProjectError)).toBe(false);
        });
    });
});
describe('NetworkErrorHandler', () => {
    describe('withRetry', () => {
        it('should succeed on first attempt', async () => {
            const operation = jest.fn().mockResolvedValue('success');
            const result = await error_handler_1.NetworkErrorHandler.withRetry(operation);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });
        it('should retry on failure and eventually succeed', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue('success');
            const result = await error_handler_1.NetworkErrorHandler.withRetry(operation);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });
        it('should throw CLIError after max retries', async () => {
            const operation = jest.fn().mockRejectedValue(new Error('Persistent network error'));
            await expect(error_handler_1.NetworkErrorHandler.withRetry(operation)).rejects.toThrow(types_1.CLIError);
            expect(operation).toHaveBeenCalledTimes(3);
        });
        it('should include context in error after retries', async () => {
            const operation = jest.fn().mockRejectedValue(new Error('Network error'));
            const context = { url: 'https://example.com' };
            try {
                await error_handler_1.NetworkErrorHandler.withRetry(operation, context);
            }
            catch (error) {
                expect(error).toBeInstanceOf(types_1.CLIError);
                expect(error.context?.url).toBe('https://example.com');
                expect(error.context?.attempts).toBe(3);
            }
        });
    });
    describe('isNetworkError', () => {
        it('should identify network errors', () => {
            const enotfoundError = new Error('ENOTFOUND example.com');
            const econnrefusedError = new Error('ECONNREFUSED 127.0.0.1:3000');
            const etimedoutError = new Error('ETIMEDOUT');
            const econnresetError = new Error('ECONNRESET');
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(enotfoundError)).toBe(true);
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(econnrefusedError)).toBe(true);
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(etimedoutError)).toBe(true);
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(econnresetError)).toBe(true);
        });
        it('should not identify non-network errors', () => {
            const fileError = new Error('ENOENT: no such file');
            const permissionError = new Error('EACCES: permission denied');
            const genericError = new Error('Something went wrong');
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(fileError)).toBe(false);
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(permissionError)).toBe(false);
            expect(error_handler_1.NetworkErrorHandler.isNetworkError(genericError)).toBe(false);
        });
    });
});
//# sourceMappingURL=error-handler.test.js.map