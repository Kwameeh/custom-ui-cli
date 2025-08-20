"use strict";
/**
 * Core TypeScript interfaces for the CLI package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.CLIError = void 0;
class CLIError extends Error {
    constructor(message, code, suggestions, context) {
        super(message);
        this.code = code;
        this.suggestions = suggestions;
        this.context = context;
        this.name = 'CLIError';
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            suggestions: this.suggestions,
            context: this.context,
            stack: this.stack
        };
    }
}
exports.CLIError = CLIError;
exports.ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    FILE_EXISTS: 'FILE_EXISTS',
    INVALID_PROJECT: 'INVALID_PROJECT',
    MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
    COMPONENT_NOT_FOUND: 'COMPONENT_NOT_FOUND',
    INVALID_COMMAND: 'INVALID_COMMAND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    REGISTRY_ERROR: 'REGISTRY_ERROR',
    DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
    CONFIG_ERROR: 'CONFIG_ERROR'
};
//# sourceMappingURL=types.js.map