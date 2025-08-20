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
exports.ConfigManager = exports.CONFIG_FILENAME = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../types");
exports.CONFIG_FILENAME = 'custom-ui.json';
/**
 * Manages project configuration file creation and updates
 */
class ConfigManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.configPath = path.join(projectRoot, exports.CONFIG_FILENAME);
    }
    /**
     * Checks if configuration file exists
     */
    exists() {
        return fs.existsSync(this.configPath);
    }
    /**
     * Reads the configuration file
     */
    read() {
        if (!this.exists()) {
            throw new types_1.CLIError(`Configuration file not found at ${this.configPath}`, types_1.ERROR_CODES.INVALID_PROJECT, ['Run "custom-ui init" to initialize the project configuration']);
        }
        try {
            const content = fs.readFileSync(this.configPath, 'utf-8');
            const config = JSON.parse(content);
            return this.validateConfig(config);
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to read configuration file: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT, ['Check if the configuration file is valid JSON']);
        }
    }
    /**
     * Writes configuration to file
     */
    write(config, overwrite = false) {
        if (this.exists() && !overwrite) {
            throw new types_1.CLIError(`Configuration file already exists at ${this.configPath}`, types_1.ERROR_CODES.FILE_EXISTS, ['Use --force flag to overwrite existing configuration']);
        }
        try {
            const validatedConfig = this.validateConfig(config);
            const content = JSON.stringify(validatedConfig, null, 2);
            fs.writeFileSync(this.configPath, content, 'utf-8');
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to write configuration file: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Updates existing configuration with partial updates
     */
    update(updates) {
        const currentConfig = this.read();
        const updatedConfig = { ...currentConfig, ...updates };
        this.write(updatedConfig, true);
        return updatedConfig;
    }
    /**
     * Validates configuration object
     */
    validateConfig(config) {
        const requiredFields = ['componentsDir', 'utilsDir', 'cssFramework', 'typescript', 'projectType'];
        const validCssFrameworks = ['tailwind', 'css-modules', 'styled-components'];
        const validProjectTypes = ['nextjs', 'vite', 'cra', 'generic'];
        // Check required fields
        for (const field of requiredFields) {
            if (!(field in config)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        // Validate field types and values
        if (typeof config.componentsDir !== 'string') {
            throw new Error('componentsDir must be a string');
        }
        if (typeof config.utilsDir !== 'string') {
            throw new Error('utilsDir must be a string');
        }
        if (!validCssFrameworks.includes(config.cssFramework)) {
            throw new Error(`cssFramework must be one of: ${validCssFrameworks.join(', ')}`);
        }
        if (typeof config.typescript !== 'boolean') {
            throw new Error('typescript must be a boolean');
        }
        if (!validProjectTypes.includes(config.projectType)) {
            throw new Error(`projectType must be one of: ${validProjectTypes.join(', ')}`);
        }
        return config;
    }
    /**
     * Gets the absolute path for components directory
     */
    getComponentsPath() {
        const config = this.read();
        return path.resolve(this.projectRoot, config.componentsDir);
    }
    /**
     * Gets the absolute path for utils directory
     */
    getUtilsPath() {
        const config = this.read();
        return path.resolve(this.projectRoot, config.utilsDir);
    }
    /**
     * Creates directory structure based on configuration
     */
    createDirectories() {
        const config = this.read();
        const componentsPath = path.resolve(this.projectRoot, config.componentsDir);
        const utilsPath = path.resolve(this.projectRoot, config.utilsDir);
        // Create components directory
        if (!fs.existsSync(componentsPath)) {
            fs.mkdirSync(componentsPath, { recursive: true });
        }
        // Create utils directory
        if (!fs.existsSync(utilsPath)) {
            fs.mkdirSync(utilsPath, { recursive: true });
        }
    }
    /**
     * Gets configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Creates a backup of the current configuration
     */
    backup() {
        if (!this.exists()) {
            throw new types_1.CLIError('No configuration file to backup', types_1.ERROR_CODES.INVALID_PROJECT);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.projectRoot, `${exports.CONFIG_FILENAME}.backup.${timestamp}`);
        fs.copyFileSync(this.configPath, backupPath);
        return backupPath;
    }
    /**
     * Restores configuration from backup
     */
    restore(backupPath) {
        if (!fs.existsSync(backupPath)) {
            throw new types_1.CLIError(`Backup file not found: ${backupPath}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        fs.copyFileSync(backupPath, this.configPath);
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map