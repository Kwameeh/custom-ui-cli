"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCommand = void 0;
const types_1 = require("../types");
const registry_loader_1 = require("../registry/registry-loader");
const error_handler_1 = require("../utils/error-handler");
const user_feedback_1 = require("../utils/user-feedback");
/**
 * Command to list available components
 */
class ListCommand {
    constructor(dependencies) {
        this.name = 'list';
        this.description = 'List all available components';
        this.registryLoader = dependencies?.registryLoader || new registry_loader_1.RegistryLoader();
        this.feedback = dependencies?.feedback || user_feedback_1.feedback;
    }
    async execute(args) {
        try {
            const options = this.parseOptions(args);
            this.feedback.info('Loading component registry...');
            // Load components with network retry
            const components = await error_handler_1.NetworkErrorHandler.withRetry(() => this.registryLoader.getAllComponents(), { operation: 'fetch component list' });
            if (Object.keys(components).length === 0) {
                this.feedback.warning('No components found in registry');
                return;
            }
            // Filter components based on options
            const filteredComponents = this.filterComponents(components, options);
            if (Object.keys(filteredComponents).length === 0) {
                this.feedback.warning('No components match the specified criteria');
                return;
            }
            // Display components
            this.displayComponents(filteredComponents, options);
            this.feedback.info(`\nFound ${Object.keys(filteredComponents).length} component(s)`);
            this.feedback.info('Use "custom-ui add <component>" to install a component');
            this.feedback.info('Use "custom-ui docs <component>" to see documentation');
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                this.feedback.error(error_handler_1.ErrorHandler.formatError(error));
                throw error;
            }
            else {
                const cliError = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.REGISTRY_ERROR, `Failed to list components: ${error instanceof Error ? error.message : 'Unknown error'}`, { originalError: error });
                this.feedback.error(error_handler_1.ErrorHandler.formatError(cliError));
                throw cliError;
            }
        }
    }
    /**
     * Filters components based on search criteria
     */
    filterComponents(components, options) {
        let filtered = { ...components };
        // Filter by search term
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            filtered = Object.fromEntries(Object.entries(filtered).filter(([name, component]) => {
                return (name.toLowerCase().includes(searchTerm) ||
                    component.metadata.description.toLowerCase().includes(searchTerm));
            }));
        }
        // Filter by category (if we had categories in the future)
        if (options.category) {
            // For now, we don't have categories, but this is where we'd filter
            this.feedback.warning('Category filtering not yet implemented');
        }
        return filtered;
    }
    /**
     * Displays components in a formatted list
     */
    displayComponents(components, options) {
        this.feedback.info('\nAvailable Components:\n');
        const componentEntries = Object.entries(components);
        if (options.verbose) {
            // Verbose output with full details
            componentEntries.forEach(([name, component]) => {
                this.displayVerboseComponent(name, component);
            });
        }
        else {
            // Compact output
            componentEntries.forEach(([name, component]) => {
                this.displayCompactComponent(name, component);
            });
        }
    }
    /**
     * Displays a component in verbose format
     */
    displayVerboseComponent(name, component) {
        console.log(`📦 ${name}`);
        console.log(`   Description: ${component.metadata.description}`);
        if (component.metadata.dependencies.length > 0) {
            console.log(`   Dependencies: ${component.metadata.dependencies.join(', ')}`);
        }
        if (component.metadata.npmDependencies.length > 0) {
            console.log(`   NPM Dependencies: ${component.metadata.npmDependencies.join(', ')}`);
        }
        console.log(`   Files: ${component.metadata.files.length} file(s)`);
        console.log('');
    }
    /**
     * Displays a component in compact format
     */
    displayCompactComponent(name, component) {
        const padding = ' '.repeat(Math.max(0, 15 - name.length));
        console.log(`  ${name}${padding} - ${component.metadata.description}`);
    }
    /**
     * Parses command line options
     */
    parseOptions(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            switch (arg) {
                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;
                case '--category':
                case '-c':
                    if (i + 1 < args.length) {
                        options.category = args[++i];
                    }
                    break;
                case '--search':
                case '-s':
                    if (i + 1 < args.length) {
                        options.search = args[++i];
                    }
                    break;
            }
        }
        return options;
    }
}
exports.ListCommand = ListCommand;
//# sourceMappingURL=list.js.map