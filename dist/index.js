#!/usr/bin/env node
"use strict";
/**
 * Main CLI entry point for custom-ui
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const init_1 = require("./commands/init");
const add_1 = require("./commands/add");
const list_1 = require("./commands/list");
const docs_1 = require("./commands/docs");
const types_1 = require("./types");
/**
 * Main CLI application class
 */
class CustomUICLI {
    constructor() {
        this.program = new commander_1.Command();
        this.initCommand = new init_1.InitCommand();
        this.addCommand = new add_1.AddCommand();
        this.listCommand = new list_1.ListCommand();
        this.docsCommand = new docs_1.DocsCommand();
        this.setupProgram();
        this.setupCommands();
        this.setupErrorHandling();
    }
    /**
     * Sets up the main program configuration
     */
    setupProgram() {
        this.program
            .name('custom-ui')
            .description('CLI tool for installing and managing custom UI components')
            .version('1.0.0')
            .option('-v, --verbose', 'Enable verbose output')
            .option('--no-color', 'Disable colored output')
            .helpOption('-h, --help', 'Display help for command');
        // Global error handling for unknown commands
        this.program.on('command:*', (operands) => {
            const unknownCommand = operands[0];
            console.error(chalk_1.default.red(`Unknown command: ${unknownCommand}`));
            console.error(chalk_1.default.yellow('Run "custom-ui --help" to see available commands'));
            process.exit(1);
        });
    }
    /**
     * Sets up all CLI commands with proper routing
     */
    setupCommands() {
        // Init command
        this.program
            .command('init')
            .description(this.initCommand.description)
            .option('-f, --force', 'Overwrite existing configuration')
            .option('--skip-deps', 'Skip dependency installation')
            .option('--components-dir <dir>', 'Custom components directory')
            .option('--utils-dir <dir>', 'Custom utils directory')
            .action(async (options, command) => {
            await this.executeCommand(this.initCommand, this.buildArgs(options, command));
        });
        // Add command
        this.program
            .command('add')
            .description(this.addCommand.description)
            .argument('[components...]', 'Component names to add')
            .option('-f, --force', 'Overwrite existing files')
            .option('-b, --backup', 'Create backup of existing files')
            .option('--skip-deps', 'Skip npm dependency installation')
            .option('-s, --silent', 'Suppress output during installation')
            .option('--components-dir <dir>', 'Custom components directory')
            .action(async (components, options, command) => {
            const args = [...components, ...this.buildArgs(options, command)];
            await this.executeCommand(this.addCommand, args);
        });
        // List command
        this.program
            .command('list')
            .description(this.listCommand.description)
            .option('-v, --verbose', 'Show detailed component information')
            .option('-c, --category <category>', 'Filter by category')
            .option('-s, --search <term>', 'Search components by name or description')
            .action(async (options, command) => {
            await this.executeCommand(this.listCommand, this.buildArgs(options, command));
        });
        // Docs command
        this.program
            .command('docs')
            .description(this.docsCommand.description)
            .argument('[component]', 'Component name to show documentation for')
            .option('--format <format>', 'Output format (text, json)', 'text')
            .option('--examples', 'Show usage examples')
            .action(async (component, options, command) => {
            const args = component ? [component, ...this.buildArgs(options, command)] : this.buildArgs(options, command);
            await this.executeCommand(this.docsCommand, args);
        });
        // Help command (explicit)
        this.program
            .command('help')
            .description('Display help information')
            .argument('[command]', 'Command to show help for')
            .action((command) => {
            if (command) {
                this.program.outputHelp({ error: false });
            }
            else {
                this.showGeneralHelp();
            }
        });
    }
    /**
     * Sets up global error handling
     */
    setupErrorHandling() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error(chalk_1.default.red('Uncaught Exception:'), error.message);
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack);
            }
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error(chalk_1.default.red('Unhandled Rejection at:'), promise, chalk_1.default.red('reason:'), reason);
            process.exit(1);
        });
        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            console.log(chalk_1.default.yellow('\nOperation cancelled by user'));
            process.exit(130); // Standard exit code for SIGINT
        });
        // Handle SIGTERM
        process.on('SIGTERM', () => {
            console.log(chalk_1.default.yellow('\nOperation terminated'));
            process.exit(143); // Standard exit code for SIGTERM
        });
    }
    /**
     * Executes a command with proper error handling and exit codes
     */
    async executeCommand(command, args) {
        try {
            await command.execute(args);
            process.exit(0); // Success
        }
        catch (error) {
            const exitCode = this.handleCommandError(error);
            process.exit(exitCode);
        }
    }
    /**
     * Handles command errors and returns appropriate exit codes
     */
    handleCommandError(error) {
        if (error instanceof types_1.CLIError) {
            // Don't log the error again if it's already been handled by the command
            // The command should have already displayed the error message
            return this.getExitCodeForError(error.code);
        }
        else {
            // Unexpected error
            console.error(chalk_1.default.red('An unexpected error occurred:'));
            console.error(chalk_1.default.red(error.message));
            if (process.env.NODE_ENV === 'development' && error.stack) {
                console.error(chalk_1.default.gray(error.stack));
            }
            return 1; // General error
        }
    }
    /**
     * Maps error codes to appropriate exit codes
     */
    getExitCodeForError(errorCode) {
        switch (errorCode) {
            case types_1.ERROR_CODES.NETWORK_ERROR:
                return 2; // Network/connectivity issues
            case types_1.ERROR_CODES.FILE_EXISTS:
                return 3; // File conflicts
            case types_1.ERROR_CODES.INVALID_PROJECT:
                return 4; // Invalid project setup
            case types_1.ERROR_CODES.MISSING_DEPENDENCY:
                return 5; // Missing dependencies
            case types_1.ERROR_CODES.COMPONENT_NOT_FOUND:
                return 6; // Component not found
            case types_1.ERROR_CODES.INVALID_COMMAND:
                return 7; // Invalid command usage
            case types_1.ERROR_CODES.PERMISSION_DENIED:
                return 8; // Permission issues
            case types_1.ERROR_CODES.REGISTRY_ERROR:
                return 9; // Registry/API issues
            case types_1.ERROR_CODES.DEPENDENCY_CONFLICT:
                return 10; // Dependency conflicts
            case types_1.ERROR_CODES.CONFIG_ERROR:
                return 11; // Configuration issues
            default:
                return 1; // General error
        }
    }
    /**
     * Builds command arguments from options and command object
     */
    buildArgs(options, command) {
        const args = [];
        // Convert options to command line arguments
        Object.entries(options).forEach(([key, value]) => {
            if (value === true) {
                // Boolean flags
                args.push(`--${key}`);
            }
            else if (value !== false && value !== undefined) {
                // Options with values
                args.push(`--${key}`, String(value));
            }
        });
        return args;
    }
    /**
     * Shows general help information
     */
    showGeneralHelp() {
        console.log(chalk_1.default.blue('Custom UI Component Library CLI\n'));
        console.log('Usage: custom-ui <command> [options]\n');
        console.log('Commands:');
        console.log('  init                 Initialize custom-ui in your project');
        console.log('  add <components...>  Add components to your project');
        console.log('  list                 List all available components');
        console.log('  docs [component]     Show component documentation');
        console.log('  help [command]       Display help for command\n');
        console.log('Global Options:');
        console.log('  -v, --verbose        Enable verbose output');
        console.log('  --no-color          Disable colored output');
        console.log('  -h, --help          Display help for command\n');
        console.log('Examples:');
        console.log('  custom-ui init                    # Initialize in current project');
        console.log('  custom-ui add button input        # Add button and input components');
        console.log('  custom-ui list --verbose          # List all components with details');
        console.log('  custom-ui docs button             # Show button component documentation\n');
        console.log('For more information, visit: https://github.com/custom-ui/cli');
    }
    /**
     * Runs the CLI application
     */
    run() {
        // Check if no arguments provided
        if (process.argv.length <= 2) {
            this.showGeneralHelp();
            return;
        }
        // Parse and execute commands
        this.program.parse(process.argv);
    }
}
// Create and run the CLI application
const cli = new CustomUICLI();
cli.run();
//# sourceMappingURL=index.js.map