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
exports.DependencyManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const types_1 = require("../types");
/**
 * Manages npm dependencies and package.json operations
 */
class DependencyManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.packageJsonPath = path.join(projectRoot, 'package.json');
    }
    /**
     * Reads and parses package.json
     */
    async readPackageJson() {
        if (!fs.existsSync(this.packageJsonPath)) {
            throw new types_1.CLIError('package.json not found in project root', types_1.ERROR_CODES.INVALID_PROJECT, ['Ensure you are in a valid Node.js project directory']);
        }
        try {
            const content = fs.readFileSync(this.packageJsonPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to parse package.json: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT, ['Check package.json for syntax errors']);
        }
    }
    /**
     * Writes package.json with proper formatting
     */
    async writePackageJson(packageJson) {
        try {
            const content = JSON.stringify(packageJson, null, 2) + '\n';
            fs.writeFileSync(this.packageJsonPath, content, 'utf-8');
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to write package.json: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Checks if dependencies are already installed
     */
    async checkDependencies(dependencies) {
        const packageJson = await this.readPackageJson();
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies
        };
        const missing = [];
        const existing = [];
        const conflicts = [];
        for (const dep of dependencies) {
            const [name, version] = dep.includes('@') && !dep.startsWith('@')
                ? dep.split('@')
                : [dep, 'latest'];
            if (allDeps[name]) {
                existing.push(name);
                // Check for version conflicts if specific version is required
                if (version !== 'latest' && allDeps[name] !== version) {
                    conflicts.push({
                        name,
                        installed: allDeps[name],
                        required: version
                    });
                }
            }
            else {
                missing.push(dep);
            }
        }
        return { missing, existing, conflicts };
    }
    /**
     * Installs npm dependencies
     */
    async installDependencies(dependencies, options = {}) {
        if (dependencies.length === 0) {
            return;
        }
        const { dev = false, exact = false, silent = false } = options;
        let command = 'npm install';
        if (dev) {
            command += ' --save-dev';
        }
        if (exact) {
            command += ' --save-exact';
        }
        if (silent) {
            command += ' --silent';
        }
        command += ` ${dependencies.join(' ')}`;
        try {
            (0, child_process_1.execSync)(command, {
                cwd: this.projectRoot,
                stdio: silent ? 'pipe' : 'inherit'
            });
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to install dependencies: ${error}`, types_1.ERROR_CODES.NETWORK_ERROR, [
                'Check your internet connection',
                'Verify npm is installed and configured',
                'Try running npm install manually'
            ]);
        }
    }
    /**
     * Adds dependencies to package.json without installing
     */
    async addDependenciesToPackageJson(dependencies, options = {}) {
        const packageJson = await this.readPackageJson();
        const { dev = false } = options;
        const targetDeps = dev ? 'devDependencies' : 'dependencies';
        if (!packageJson[targetDeps]) {
            packageJson[targetDeps] = {};
        }
        for (const dep of dependencies) {
            const [name, version] = dep.includes('@') && !dep.startsWith('@')
                ? dep.split('@')
                : [dep, 'latest'];
            packageJson[targetDeps][name] = version === 'latest' ? '^1.0.0' : version;
        }
        await this.writePackageJson(packageJson);
    }
    /**
     * Resolves component dependencies recursively
     */
    async resolveDependencies(componentDeps, availableComponents) {
        const resolved = new Set();
        const visiting = new Set();
        const resolve = (componentName) => {
            if (resolved.has(componentName)) {
                return;
            }
            if (visiting.has(componentName)) {
                throw new types_1.CLIError(`Circular dependency detected: ${componentName}`, types_1.ERROR_CODES.INVALID_PROJECT, ['Check component dependencies for circular references']);
            }
            visiting.add(componentName);
            const component = availableComponents[componentName];
            if (component) {
                // Resolve dependencies first
                for (const dep of component.dependencies) {
                    resolve(dep);
                }
                resolved.add(componentName);
            }
            visiting.delete(componentName);
        };
        for (const dep of componentDeps) {
            resolve(dep);
        }
        return Array.from(resolved);
    }
    /**
     * Gets the package manager being used (npm, yarn, pnpm)
     */
    detectPackageManager() {
        if (fs.existsSync(path.join(this.projectRoot, 'yarn.lock'))) {
            return 'yarn';
        }
        if (fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        return 'npm';
    }
    /**
     * Runs install command with detected package manager
     */
    async runInstall(silent = false) {
        const packageManager = this.detectPackageManager();
        let command;
        switch (packageManager) {
            case 'yarn':
                command = 'yarn install';
                break;
            case 'pnpm':
                command = 'pnpm install';
                break;
            default:
                command = 'npm install';
        }
        if (silent) {
            command += packageManager === 'npm' ? ' --silent' : ' --silent';
        }
        try {
            (0, child_process_1.execSync)(command, {
                cwd: this.projectRoot,
                stdio: silent ? 'pipe' : 'inherit'
            });
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to run ${packageManager} install: ${error}`, types_1.ERROR_CODES.NETWORK_ERROR, [
                'Check your internet connection',
                `Verify ${packageManager} is installed and configured`,
                `Try running ${command} manually`
            ]);
        }
    }
}
exports.DependencyManager = DependencyManager;
//# sourceMappingURL=dependency-manager.js.map