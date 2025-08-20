"use strict";
/**
 * Demo script to showcase error handling and user feedback systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoErrorHandling = demoErrorHandling;
const error_handler_1 = require("./error-handler");
const user_feedback_1 = require("./user-feedback");
const types_1 = require("../types");
/**
 * Demo function that simulates various error scenarios
 */
async function demoErrorHandling() {
    const feedback = user_feedback_1.FeedbackFactory.create('console');
    feedback.info('Starting error handling and user feedback demo...');
    // Demo 1: Network error with retry
    feedback.info('\n--- Demo 1: Network Error with Retry ---');
    try {
        await error_handler_1.NetworkErrorHandler.withRetry(async () => {
            // Simulate network failure that eventually succeeds
            const random = Math.random();
            if (random < 0.7) {
                throw new Error('ENOTFOUND registry.example.com');
            }
            return 'Network operation succeeded';
        });
        feedback.success('Network operation completed successfully');
    }
    catch (error) {
        feedback.error('Network operation failed after retries', error);
    }
    // Demo 2: Progress tracking with steps
    feedback.info('\n--- Demo 2: Progress Tracking ---');
    try {
        await user_feedback_1.FeedbackUtils.withSteps([
            {
                name: 'Initializing project',
                operation: async () => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return 'initialized';
                }
            },
            {
                name: 'Loading components',
                operation: async () => {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    return 'loaded';
                }
            },
            {
                name: 'Installing dependencies',
                operation: async () => {
                    await new Promise(resolve => setTimeout(resolve, 600));
                    return 'installed';
                }
            }
        ], feedback);
    }
    catch (error) {
        feedback.error('Step execution failed', error);
    }
    // Demo 3: Error formatting and suggestions
    feedback.info('\n--- Demo 3: Error Formatting ---');
    try {
        throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.COMPONENT_NOT_FOUND, 'Component "super-button" not found in registry', { componentName: 'super-button', registry: 'https://registry.example.com' });
    }
    catch (error) {
        const formatted = error_handler_1.ErrorHandler.formatError(error);
        console.log(formatted);
    }
    // Demo 4: File system error handling
    feedback.info('\n--- Demo 4: File System Error Handling ---');
    try {
        const fsError = new Error('ENOENT: no such file or directory, open \'/nonexistent/path\'');
        throw error_handler_1.ErrorHandler.handleFileSystemError(fsError, '/nonexistent/path');
    }
    catch (error) {
        const formatted = error_handler_1.ErrorHandler.formatError(error);
        console.log(formatted);
    }
    // Demo 5: Progress with custom operation
    feedback.info('\n--- Demo 5: Custom Progress Operation ---');
    try {
        const result = await user_feedback_1.FeedbackUtils.withProgress(async (progress) => {
            for (let i = 0; i <= 100; i += 10) {
                progress.update(i, `Processing item ${i / 10 + 1}/11`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return 'Processing complete';
        }, {
            total: 100,
            message: 'Processing items...',
            showPercentage: true
        }, feedback);
        feedback.success(`Operation result: ${result}`);
    }
    catch (error) {
        feedback.error('Progress operation failed', error);
    }
    feedback.success('\nDemo completed successfully!');
}
// Run demo if this file is executed directly
if (require.main === module) {
    demoErrorHandling().catch(console.error);
}
//# sourceMappingURL=demo-error-handling.js.map