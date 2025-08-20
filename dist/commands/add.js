"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCommand = void 0;
const path = __importStar(require("path"));
const types_1 = require("../types");
const registry_loader_1 = require("../registry/registry-loader");
const config_manager_1 = require("../utils/config-manager");
const file_operations_1 = require("../utils/file-operations");
const dependency_manager_1 = require("../utils/dependency-manager");
const error_handler_1 = require("../utils/error-handler");
const user_feedback_1 = require("../utils/user-feedback");
/**
 * Command to add components to a project
 */
class AddCommand {
    constructor(dependencies) {
        this.name = 'add';
        this.description = 'Add components to your project';
        this.registryLoader = dependencies?.registryLoader || new registry_loader_1.RegistryLoader();
        this.configManager = dependencies?.configManager || new config_manager_1.ConfigManager(process.cwd());
        this.feedback = dependencies?.feedback || user_feedback_1.feedback;
    }
    async execute(args) {
        try {
            if (args.length === 0) {
                throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.INVALID_COMMAND, 'No component specified', { args });
            }
            const options = this.parseOptions(args);
            const componentNames = this.extractComponentNames(args);
            if (componentNames.length === 0) {
                throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.INVALID_COMMAND, 'No valid component names found in arguments', { args });
            }
            // Load and validate configuration first
            const config = await this.loadProjectConfig(options);
            await this.validateProject(config);
            // Execute component installation with progress tracking
            await user_feedback_1.FeedbackUtils.withSteps(componentNames.map(componentName => ({
                name: `Installing component: ${componentName}`,
                operation: async () => {
                    await this.addComponent(componentName, config, options);
                    return componentName;
                }
            })), this.feedback);
            this.feedback.success(`Successfully added ${componentNames.length} component(s): ${componentNames.join(', ')}`);
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                this.feedback.error(error_handler_1.ErrorHandler.formatError(error));
                throw error;
            }
            else {
                const cliError = error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.REGISTRY_ERROR, `Unexpected error during component installation: ${error instanceof Error ? error.message : 'Unknown error'}`, { originalError: error });
                this.feedback.error(error_handler_1.ErrorHandler.formatError(cliError));
                throw cliError;
            }
        }
    }
    /**
     * Adds a single component to the project
     */
    async addComponent(componentName, config, options) {
        try {
            this.feedback.info(`Adding component: ${componentName}`);
            // Get component from registry with network retry
            const component = await error_handler_1.NetworkErrorHandler.withRetry(async () => {
                const comp = await this.registryLoader.getComponent(componentName);
                if (!comp) {
                    throw error_handler_1.ErrorHandler.handleComponentError(componentName, new Error('Component not found in registry'));
                }
                return comp;
            }, { componentName });
            // Resolve component dependencies
            const allComponents = await error_handler_1.NetworkErrorHandler.withRetry(() => this.registryLoader.getAllComponents(), { operation: 'fetch all components' });
            const dependencyManager = new dependency_manager_1.DependencyManager(process.cwd());
            const resolvedDeps = await dependencyManager.resolveDependencies([componentName, ...component.metadata.dependencies], Object.fromEntries(Object.entries(allComponents).map(([name, comp]) => [
                name,
                { dependencies: comp.metadata.dependencies }
            ])));
            if (resolvedDeps.length > 1) {
                this.feedback.info(`Resolved dependencies: ${resolvedDeps.filter(dep => dep !== componentName).join(', ')}`);
            }
            // Install with progress tracking
            await user_feedback_1.FeedbackUtils.withProgress(async (progress) => {
                const totalSteps = resolvedDeps.length +
                    (component.metadata.npmDependencies.length > 0 && !options.skipDeps ? 1 : 0) +
                    (component.utils && component.utils.length > 0 ? 1 : 0);
                let currentStep = 0;
                // Install component dependencies first
                for (const depName of resolvedDeps) {
                    if (depName !== componentName) {
                        progress.update(currentStep++, `Installing dependency: ${depName}`);
                        const depComponent = await this.registryLoader.getComponent(depName);
                        if (depComponent) {
                            await this.installComponentFiles(depComponent, config, options, depName);
                        }
                    }
                }
                // Install the main component
                progress.update(currentStep++, `Installing component: ${componentName}`);
                await this.installComponentFiles(component, config, options, componentName);
                // Install npm dependencies
                if (!options.skipDeps && component.metadata.npmDependencies.length > 0) {
                    progress.update(currentStep++, 'Installing npm dependencies');
                    await this.installNpmDependencies(component.metadata.npmDependencies, options);
                }
                // Install utility functions if needed
                if (component.utils && component.utils.length > 0) {
                    progress.update(currentStep++, 'Installing utility functions');
                    await this.installUtilities(component.utils, config, options);
                }
                progress.complete(`Component ${componentName} installed successfully`);
            }, {
                total: 100,
                message: `Installing ${componentName}...`,
                showPercentage: true
            }, this.feedback);
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                throw error;
            }
            else {
                throw error_handler_1.ErrorHandler.handleComponentError(componentName, error);
            }
        }
    }
    /**
     * Installs component files to the project
     */
    async installComponentFiles(component, config, options, componentName) {
        const projectRoot = process.cwd();
        // Install main component file
        const componentPath = this.resolveComponentPath(component.component.path, config);
        const fullComponentPath = path.join(projectRoot, componentPath);
        await this.writeComponentFile(fullComponentPath, component.component.content, options, `${componentName} component`);
        // Install additional files from metadata
        for (const file of component.metadata.files) {
            if (file.type === 'component') {
                continue; // Already handled above
            }
            const filePath = this.resolveFilePath(file.path, config, file.type);
            const fullFilePath = path.join(projectRoot, filePath);
            await this.writeComponentFile(fullFilePath, file.content, options, `${componentName} ${file.type}`);
        }
    }
    /**
     * Installs utility functions
     */
    async installUtilities(utils, config, options) {
        for (const util of utils) {
            const utilPath = this.resolveFilePath(util.path, config, 'utility');
            const fullUtilPath = path.join(process.cwd(), utilPath);
            // Check if utility already exists
            const conflict = file_operations_1.FileOperations.checkFileConflict(fullUtilPath);
            if (conflict.exists && !options.force) {
                console.log(`⚠️  Utility ${util.path} already exists, skipping...`);
                continue;
            }
            await this.writeComponentFile(fullUtilPath, util.content, options, `utility ${path.basename(util.path)}`);
        }
    }
    /**
     * Installs npm dependencies
     */
    async installNpmDependencies(dependencies, options) {
        try {
            this.feedback.info(`Installing npm dependencies: ${dependencies.join(', ')}`);
            const dependencyManager = new dependency_manager_1.DependencyManager(process.cwd());
            // Check which dependencies are missing
            const depCheck = await dependencyManager.checkDependencies(dependencies);
            if (depCheck.conflicts.length > 0) {
                this.feedback.warning('Dependency version conflicts detected:');
                for (const conflict of depCheck.conflicts) {
                    this.feedback.warning(`  ${conflict.name}: installed ${conflict.installed}, required ${conflict.required}`);
                }
                if (!options.force) {
                    throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.DEPENDENCY_CONFLICT, 'Dependency version conflicts detected', { conflicts: depCheck.conflicts });
                }
                else {
                    this.feedback.warning('Proceeding with installation due to --force flag');
                }
            }
            if (depCheck.missing.length > 0) {
                await dependencyManager.installDependencies(depCheck.missing, {
                    silent: options.silent
                });
                this.feedback.success(`Installed ${depCheck.missing.length} npm dependencies`);
            }
            else {
                this.feedback.info('All dependencies already installed');
            }
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                throw error;
            }
            else {
                throw error_handler_1.ErrorHandler.handleDependencyError(dependencies.join(', '), error);
            }
        }
    }
    /**
     * Writes a component file with conflict handling
     */
    async writeComponentFile(filePath, content, options, description) {
        try {
            const conflict = file_operations_1.FileOperations.checkFileConflict(filePath);
            if (conflict.exists && !options.force) {
                if (options.backup) {
                    const backupPath = await file_operations_1.FileOperations.createBackup(filePath);
                    this.feedback.info(`Created backup: ${backupPath}`);
                }
                else {
                    // Prompt user for resolution
                    const resolution = await file_operations_1.FileOperations.resolveConflict(filePath, this.createPromptCallback());
                    switch (resolution.action) {
                        case 'skip':
                            this.feedback.warning(`Skipped ${description}: ${filePath}`);
                            return;
                        case 'backup':
                            this.feedback.info(`Created backup: ${resolution.backupPath}`);
                            break;
                        case 'overwrite':
                            this.feedback.warning(`Overwriting ${description}: ${filePath}`);
                            break;
                    }
                }
            }
            await file_operations_1.FileOperations.writeFile(filePath, content, {
                overwrite: true,
                createBackup: options.backup && conflict.exists
            });
            this.feedback.success(`Installed ${description}: ${path.relative(process.cwd(), filePath)}`);
        }
        catch (error) {
            throw error_handler_1.ErrorHandler.handleFileSystemError(error, filePath);
        }
    }
    /**
     * Resolves component file path based on project configuration
     */
    resolveComponentPath(componentPath, config) {
        // Replace components/ui with the configured components directory
        return componentPath.replace('components/ui', config.componentsDir);
    }
    /**
     * Resolves file path based on type and project configuration
     */
    resolveFilePath(filePath, config, type) {
        switch (type) {
            case 'utility':
                return filePath.replace('lib', config.utilsDir);
            case 'component':
                return this.resolveComponentPath(filePath, config);
            default:
                return filePath;
        }
    }
    /**
     * Loads project configuration
     */
    async loadProjectConfig(options) {
        try {
            const config = this.configManager.read();
            // Override components directory if specified in options
            if (options.componentsDir) {
                config.componentsDir = options.componentsDir;
            }
            return config;
        }
        catch (error) {
            throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.CONFIG_ERROR, 'Project not initialized or configuration is invalid', { configPath: this.configManager.getConfigPath() });
        }
    }
    /**
     * Validates project setup
     */
    async validateProject(config) {
        try {
            const projectRoot = process.cwd();
            // Check if package.json exists
            const packageJsonPath = path.join(projectRoot, 'package.json');
            if (!file_operations_1.FileOperations.checkFileConflict(packageJsonPath).exists) {
                throw error_handler_1.ErrorHandler.createError(types_1.ERROR_CODES.INVALID_PROJECT, 'package.json not found in current directory', { projectRoot, packageJsonPath });
            }
            // Ensure component directories exist
            await file_operations_1.FileOperations.ensureDirectory(path.join(projectRoot, config.componentsDir));
            await file_operations_1.FileOperations.ensureDirectory(path.join(projectRoot, config.utilsDir));
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                throw error;
            }
            else {
                throw error_handler_1.ErrorHandler.handleFileSystemError(error);
            }
        }
    }
    /**
     * Parses command line options
     */
    parseOptions(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            switch (arg) {
                case '--force':
                case '-f':
                    options.force = true;
                    break;
                case '--backup':
                case '-b':
                    options.backup = true;
                    break;
                case '--skip-deps':
                    options.skipDeps = true;
                    break;
                case '--silent':
                case '-s':
                    options.silent = true;
                    break;
                case '--components-dir':
                    if (i + 1 < args.length) {
                        options.componentsDir = args[++i];
                    }
                    break;
            }
        }
        return options;
    }
    /**
     * Extracts component names from arguments (non-option arguments)
     */
    extractComponentNames(args) {
        const components = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            // Skip options and their values
            if (arg.startsWith('-')) {
                if (arg === '--components-dir') {
                    i++; // Skip the next argument (the directory value)
                }
                continue;
            }
            components.push(arg);
        }
        return components;
    }
    /**
     * Creates a prompt callback for user interaction
     */
    createPromptCallback() {
        return async (message, choices) => {
            // In a real CLI, this would use a library like inquirer
            // For now, we'll default to 'skip' for safety
            console.log(`${message}`);
            console.log(`Choices: ${choices.join(', ')}`);
            console.log('Defaulting to "skip" - use --force to overwrite or --backup to create backups');
            return 'skip';
        };
    }
}
exports.AddCommand = AddCommand;
//# sourceMappingURL=add.js.map