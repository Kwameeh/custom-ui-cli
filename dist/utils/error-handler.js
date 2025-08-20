"use strict";
/**
 * Comprehensive error handling utilities for the CLI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkErrorHandler = exports.ErrorHandler = void 0;
const types_1 = require("../types");
class ErrorHandler {
    /**
     * Creates a standardized CLI error with helpful suggestions
     */
    static createError(code, message, context) {
        const suggestions = this.getSuggestions(code, context);
        return new types_1.CLIError(message, code, suggestions, context);
    }
    /**
     * Handles network-related errors with graceful fallbacks
     */
    static handleNetworkError(error, context) {
        const message = 'Failed to connect to component registry. Please check your internet connection.';
        const suggestions = [
            'Check your internet connection',
            'Try again in a few moments',
            'Use cached components if available',
            'Contact support if the issue persists'
        ];
        return new types_1.CLIError(message, types_1.ERROR_CODES.NETWORK_ERROR, suggestions, {
            originalError: error.message,
            ...context
        });
    }
    /**
     * Handles file system errors with actionable suggestions
     */
    static handleFileSystemError(error, filePath) {
        let message = 'File system operation failed.';
        let suggestions = [];
        let code = types_1.ERROR_CODES.PERMISSION_DENIED;
        if (error.message.includes('ENOENT')) {
            message = `File or directory not found: ${filePath || 'unknown'}`;
            suggestions = [
                'Check if the file path is correct',
                'Ensure the directory exists',
                'Run the init command first if this is a new project'
            ];
        }
        else if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
            message = `Permission denied accessing: ${filePath || 'file'}`;
            suggestions = [
                'Run the command with appropriate permissions',
                'Check file/directory ownership',
                'Ensure the file is not locked by another process'
            ];
        }
        else if (error.message.includes('EEXIST')) {
            message = `File already exists: ${filePath || 'unknown'}`;
            code = types_1.ERROR_CODES.FILE_EXISTS;
            suggestions = [
                'Use --force flag to overwrite existing files',
                'Choose a different file name',
                'Remove the existing file first'
            ];
        }
        return new types_1.CLIError(message, code, suggestions, {
            originalError: error.message,
            filePath
        });
    }
    /**
     * Handles component-related errors
     */
    static handleComponentError(componentName, error) {
        const message = `Failed to process component "${componentName}": ${error.message}`;
        const suggestions = [
            'Check if the component name is correct',
            'Run "custom-ui list" to see available components',
            'Try updating the component registry',
            'Check component dependencies'
        ];
        return new types_1.CLIError(message, types_1.ERROR_CODES.COMPONENT_NOT_FOUND, suggestions, {
            componentName,
            originalError: error.message
        });
    }
    /**
     * Handles dependency-related errors
     */
    static handleDependencyError(dependency, error) {
        const message = `Failed to install dependency "${dependency}": ${error.message}`;
        const suggestions = [
            'Check your npm/yarn configuration',
            'Ensure you have internet connectivity',
            'Try clearing npm cache: npm cache clean --force',
            'Check if the dependency name is correct'
        ];
        return new types_1.CLIError(message, types_1.ERROR_CODES.MISSING_DEPENDENCY, suggestions, {
            dependency,
            originalError: error.message
        });
    }
    /**
     * Gets contextual suggestions based on error code
     */
    static getSuggestions(code, context) {
        switch (code) {
            case types_1.ERROR_CODES.NETWORK_ERROR:
                return [
                    'Check your internet connection',
                    'Try again in a few moments',
                    'Use cached components if available'
                ];
            case types_1.ERROR_CODES.FILE_EXISTS:
                return [
                    'Use --force flag to overwrite',
                    'Choose a different location',
                    'Remove existing file first'
                ];
            case types_1.ERROR_CODES.INVALID_PROJECT:
                return [
                    'Run "custom-ui init" to set up the project',
                    'Ensure you\'re in a React project directory',
                    'Check package.json for React dependencies'
                ];
            case types_1.ERROR_CODES.MISSING_DEPENDENCY:
                return [
                    'Run npm install or yarn install',
                    'Check your package manager configuration',
                    'Ensure internet connectivity'
                ];
            case types_1.ERROR_CODES.COMPONENT_NOT_FOUND:
                return [
                    'Run "custom-ui list" to see available components',
                    'Check component name spelling',
                    'Update component registry'
                ];
            case types_1.ERROR_CODES.INVALID_COMMAND:
                return [
                    'Run "custom-ui --help" for available commands',
                    'Check command syntax',
                    'Use "custom-ui docs" for examples'
                ];
            case types_1.ERROR_CODES.REGISTRY_ERROR:
                return [
                    'Check internet connection',
                    'Try updating the registry',
                    'Contact support if issue persists'
                ];
            case types_1.ERROR_CODES.DEPENDENCY_CONFLICT:
                return [
                    'Review conflicting dependencies',
                    'Update package.json manually',
                    'Use --force flag to override conflicts'
                ];
            case types_1.ERROR_CODES.CONFIG_ERROR:
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
    static formatError(error) {
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
    static isRecoverable(error) {
        const recoverableErrors = [
            types_1.ERROR_CODES.NETWORK_ERROR,
            types_1.ERROR_CODES.FILE_EXISTS,
            types_1.ERROR_CODES.DEPENDENCY_CONFLICT
        ];
        return recoverableErrors.includes(error.code);
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * Network error handling with retry logic
 */
class NetworkErrorHandler {
    /**
     * Executes a network operation with retry logic
     */
    static async withRetry(operation, context) {
        let lastError;
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
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
        throw ErrorHandler.handleNetworkError(lastError, context);
    }
    /**
     * Checks if an error is network-related
     */
    static isNetworkError(error) {
        const networkErrorCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
        return networkErrorCodes.some(code => error.message.includes(code));
    }
}
exports.NetworkErrorHandler = NetworkErrorHandler;
NetworkErrorHandler.MAX_RETRIES = 3;
NetworkErrorHandler.RETRY_DELAY = 1000; // 1 second
//# sourceMappingURL=error-handler.js.map