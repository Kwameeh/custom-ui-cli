"use strict";
/**
 * User feedback and progress indication utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackUtils = exports.feedback = exports.FeedbackFactory = exports.SilentFeedback = exports.ConsoleFeedback = void 0;
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
class ConsoleFeedback {
    success(message) {
        console.log(`${COLORS.green}${ICONS.success} ${message}${COLORS.reset}`);
    }
    error(message, error) {
        console.error(`${COLORS.red}${ICONS.error} ${message}${COLORS.reset}`);
        if (error && process.env.DEBUG) {
            console.error(`${COLORS.gray}${error.stack}${COLORS.reset}`);
        }
    }
    warning(message) {
        console.warn(`${COLORS.yellow}${ICONS.warning} ${message}${COLORS.reset}`);
    }
    info(message) {
        console.log(`${COLORS.blue}${ICONS.info} ${message}${COLORS.reset}`);
    }
    progress(options) {
        return new ConsoleProgressIndicator(options);
    }
}
exports.ConsoleFeedback = ConsoleFeedback;
/**
 * Console-based progress indicator
 */
class ConsoleProgressIndicator {
    constructor(options) {
        this.current = 0;
        this.total = options.total || 100;
        this.message = options.message || 'Processing...';
        this.showPercentage = options.showPercentage !== false;
        this.startTime = Date.now();
        this.render();
    }
    update(current, message) {
        this.current = Math.min(current, this.total);
        if (message) {
            this.message = message;
        }
        this.render();
    }
    increment(message) {
        this.update(this.current + 1, message);
    }
    complete(message) {
        this.current = this.total;
        if (message) {
            this.message = message;
        }
        this.render();
        const duration = Date.now() - this.startTime;
        console.log(`\n${COLORS.green}✅ Completed in ${duration}ms${COLORS.reset}`);
    }
    fail(message) {
        if (message) {
            this.message = message;
        }
        console.log(`\n${COLORS.red}❌ ${this.message}${COLORS.reset}`);
    }
    render() {
        const percentage = Math.round((this.current / this.total) * 100);
        const barLength = 30;
        const filledLength = Math.round((percentage / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        let output = `\r${COLORS.cyan}${ICONS.progress} ${this.message}${COLORS.reset}`;
        if (this.showPercentage) {
            output += ` [${bar}] ${percentage}%`;
        }
        else {
            output += ` [${bar}] ${this.current}/${this.total}`;
        }
        process.stdout.write(output);
    }
}
/**
 * Silent feedback implementation for testing
 */
class SilentFeedback {
    constructor() {
        this.messages = [];
    }
    success(message) {
        this.messages.push({ type: 'success', message });
    }
    error(message, error) {
        this.messages.push({ type: 'error', message, error });
    }
    warning(message) {
        this.messages.push({ type: 'warning', message });
    }
    info(message) {
        this.messages.push({ type: 'info', message });
    }
    progress(options) {
        return new SilentProgressIndicator(options);
    }
    getMessages() {
        return [...this.messages];
    }
    clear() {
        this.messages = [];
    }
}
exports.SilentFeedback = SilentFeedback;
/**
 * Silent progress indicator for testing
 */
class SilentProgressIndicator {
    constructor(options) {
        this.current = 0;
        this.completed = false;
        this.failed = false;
        this.total = options.total || 100;
        this.message = options.message || 'Processing...';
    }
    update(current, message) {
        this.current = Math.min(current, this.total);
        if (message) {
            this.message = message;
        }
    }
    increment(message) {
        this.update(this.current + 1, message);
    }
    complete(message) {
        this.current = this.total;
        this.completed = true;
        if (message) {
            this.message = message;
        }
    }
    fail(message) {
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
class FeedbackFactory {
    static create(type = 'console') {
        switch (type) {
            case 'silent':
                return new SilentFeedback();
            case 'console':
            default:
                return new ConsoleFeedback();
        }
    }
}
exports.FeedbackFactory = FeedbackFactory;
/**
 * Global feedback instance
 */
exports.feedback = FeedbackFactory.create();
/**
 * Utility functions for common feedback patterns
 */
class FeedbackUtils {
    /**
     * Executes an operation with progress feedback
     */
    static async withProgress(operation, options, feedbackInstance = exports.feedback) {
        const progress = feedbackInstance.progress(options);
        try {
            const result = await operation(progress);
            progress.complete();
            return result;
        }
        catch (error) {
            progress.fail(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Executes multiple operations with combined progress
     */
    static async withSteps(steps, feedbackInstance = exports.feedback) {
        const progress = feedbackInstance.progress({
            total: steps.length,
            message: 'Starting...',
            showPercentage: false
        });
        const results = [];
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
        }
        catch (error) {
            progress.fail(`Failed at step: ${steps[currentStep]?.name || 'unknown'}`);
            throw error;
        }
    }
}
exports.FeedbackUtils = FeedbackUtils;
//# sourceMappingURL=user-feedback.js.map