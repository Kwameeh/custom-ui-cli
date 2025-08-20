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
exports.RegistryLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../types");
class RegistryLoader {
    constructor(registryPath) {
        this.cachedRegistry = null;
        this.registryPath = registryPath || path.join(__dirname, 'registry.json');
    }
    /**
     * Load the component registry from JSON file
     */
    async loadRegistry() {
        try {
            if (this.cachedRegistry) {
                return this.cachedRegistry;
            }
            const registryContent = await fs.promises.readFile(this.registryPath, 'utf-8');
            const registry = JSON.parse(registryContent);
            // Validate the registry structure
            this.validateRegistry(registry);
            this.cachedRegistry = registry;
            return registry;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new types_1.CLIError('Invalid registry JSON format', types_1.ERROR_CODES.INVALID_PROJECT, ['Check the registry.json file for syntax errors']);
            }
            if (error.code === 'ENOENT') {
                throw new types_1.CLIError('Registry file not found', types_1.ERROR_CODES.NETWORK_ERROR, ['Ensure the registry.json file exists', 'Try reinstalling the package']);
            }
            throw error;
        }
    }
    /**
     * Get a specific component from the registry
     */
    async getComponent(componentName) {
        const registry = await this.loadRegistry();
        return registry.components[componentName] || null;
    }
    /**
     * Get all available component names
     */
    async getComponentNames() {
        const registry = await this.loadRegistry();
        return Object.keys(registry.components);
    }
    /**
     * Get component metadata only (without full content)
     */
    async getComponentMetadata(componentName) {
        const component = await this.getComponent(componentName);
        return component?.metadata || null;
    }
    /**
     * Get all components with their metadata
     */
    async getAllComponents() {
        const registry = await this.loadRegistry();
        return registry.components;
    }
    /**
     * Get utility functions from the registry
     */
    async getUtils() {
        const registry = await this.loadRegistry();
        return registry.utils;
    }
    /**
     * Clear the cached registry (useful for testing or updates)
     */
    clearCache() {
        this.cachedRegistry = null;
    }
    /**
     * Validate the registry structure
     */
    validateRegistry(registry) {
        if (!registry || typeof registry !== 'object') {
            throw new types_1.CLIError('Invalid registry structure: must be an object', types_1.ERROR_CODES.INVALID_PROJECT);
        }
        if (!registry.components || typeof registry.components !== 'object') {
            throw new types_1.CLIError('Invalid registry structure: missing components object', types_1.ERROR_CODES.INVALID_PROJECT);
        }
        if (!registry.utils || typeof registry.utils !== 'object') {
            throw new types_1.CLIError('Invalid registry structure: missing utils object', types_1.ERROR_CODES.INVALID_PROJECT);
        }
        // Validate each component
        for (const [componentName, component] of Object.entries(registry.components)) {
            this.validateComponent(componentName, component);
        }
        // Validate utils
        for (const [utilName, util] of Object.entries(registry.utils)) {
            this.validateUtil(utilName, util);
        }
    }
    /**
     * Validate a single component structure
     */
    validateComponent(componentName, component) {
        if (!component.metadata) {
            throw new types_1.CLIError(`Invalid component ${componentName}: missing metadata`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        this.validateComponentMetadata(componentName, component.metadata);
        if (!component.component || !component.component.path || !component.component.content) {
            throw new types_1.CLIError(`Invalid component ${componentName}: missing component definition`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        // Validate optional utils array
        if (component.utils) {
            if (!Array.isArray(component.utils)) {
                throw new types_1.CLIError(`Invalid component ${componentName}: utils must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
            }
            component.utils.forEach((util, index) => {
                this.validateComponentFile(`${componentName}.utils[${index}]`, util);
            });
        }
        // Validate optional types array
        if (component.types) {
            if (!Array.isArray(component.types)) {
                throw new types_1.CLIError(`Invalid component ${componentName}: types must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
            }
            component.types.forEach((type, index) => {
                this.validateComponentFile(`${componentName}.types[${index}]`, type);
            });
        }
        // Validate optional examples array
        if (component.examples && !Array.isArray(component.examples)) {
            throw new types_1.CLIError(`Invalid component ${componentName}: examples must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Validate component metadata structure
     */
    validateComponentMetadata(componentName, metadata) {
        const requiredFields = ['name', 'description', 'dependencies', 'files', 'npmDependencies'];
        for (const field of requiredFields) {
            if (!(field in metadata)) {
                throw new types_1.CLIError(`Invalid component ${componentName}: missing metadata field '${field}'`, types_1.ERROR_CODES.INVALID_PROJECT);
            }
        }
        if (!Array.isArray(metadata.dependencies)) {
            throw new types_1.CLIError(`Invalid component ${componentName}: dependencies must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        if (!Array.isArray(metadata.files)) {
            throw new types_1.CLIError(`Invalid component ${componentName}: files must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        if (!Array.isArray(metadata.npmDependencies)) {
            throw new types_1.CLIError(`Invalid component ${componentName}: npmDependencies must be an array`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        // Validate each file in metadata
        metadata.files.forEach((file, index) => {
            this.validateComponentFile(`${componentName}.metadata.files[${index}]`, file);
        });
    }
    /**
     * Validate component file structure
     */
    validateComponentFile(context, file) {
        const requiredFields = ['path', 'content', 'type'];
        for (const field of requiredFields) {
            if (!(field in file)) {
                throw new types_1.CLIError(`Invalid file in ${context}: missing field '${field}'`, types_1.ERROR_CODES.INVALID_PROJECT);
            }
        }
        const validTypes = ['component', 'utility', 'type'];
        if (!validTypes.includes(file.type)) {
            throw new types_1.CLIError(`Invalid file in ${context}: type must be one of ${validTypes.join(', ')}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Validate utility structure
     */
    validateUtil(utilName, util) {
        const requiredFields = ['path', 'content', 'description'];
        for (const field of requiredFields) {
            if (!(field in util)) {
                throw new types_1.CLIError(`Invalid util ${utilName}: missing field '${field}'`, types_1.ERROR_CODES.INVALID_PROJECT);
            }
        }
    }
}
exports.RegistryLoader = RegistryLoader;
//# sourceMappingURL=registry-loader.js.map