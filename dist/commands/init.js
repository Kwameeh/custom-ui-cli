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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const project_detector_1 = require("../utils/project-detector");
const config_manager_1 = require("../utils/config-manager");
const file_operations_1 = require("../utils/file-operations");
const types_1 = require("../types");
/**
 * Init command implementation
 */
class InitCommand {
    constructor() {
        this.name = 'init';
        this.description = 'Initialize custom-ui in your project';
    }
    async execute(args) {
        const program = new commander_1.Command();
        program
            .name('init')
            .description(this.description)
            .option('-f, --force', 'Overwrite existing configuration')
            .option('--skip-deps', 'Skip dependency installation')
            .option('--components-dir <dir>', 'Custom components directory')
            .option('--utils-dir <dir>', 'Custom utils directory')
            .parse(['node', 'init', ...args]);
        const options = program.opts();
        try {
            await this.runInit(options);
        }
        catch (error) {
            if (error instanceof types_1.CLIError) {
                console.error(chalk_1.default.red(`Error: ${error.message}`));
                if (error.suggestions) {
                    console.error(chalk_1.default.yellow('Suggestions:'));
                    error.suggestions.forEach(suggestion => {
                        console.error(chalk_1.default.yellow(`  - ${suggestion}`));
                    });
                }
                process.exit(1);
            }
            throw error;
        }
    }
    async runInit(options) {
        console.log(chalk_1.default.blue('🚀 Initializing custom-ui in your project...\n'));
        // Step 1: Detect project type and configuration
        const spinner = (0, ora_1.default)('Detecting project configuration...').start();
        let detection;
        try {
            const detector = new project_detector_1.ProjectDetector();
            detection = await detector.detect();
            spinner.succeed('Project configuration detected');
        }
        catch (error) {
            spinner.fail('Failed to detect project configuration');
            throw new types_1.CLIError(`Project detection failed: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT, [
                'Make sure you are in a valid Node.js project directory',
                'Ensure package.json exists in the current directory or parent directories'
            ]);
        }
        // Display detected configuration
        console.log(chalk_1.default.gray('Detected configuration:'));
        console.log(chalk_1.default.gray(`  Project type: ${detection.type}`));
        console.log(chalk_1.default.gray(`  TypeScript: ${detection.hasTypeScript ? 'Yes' : 'No'}`));
        console.log(chalk_1.default.gray(`  Tailwind CSS: ${detection.hasTailwind ? 'Yes' : 'No'}`));
        console.log();
        // Step 2: Check for existing configuration
        const configManager = new config_manager_1.ConfigManager(detection.rootDir);
        if (configManager.exists() && !options.force) {
            const { shouldContinue } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'shouldContinue',
                    message: 'Configuration file already exists. Do you want to overwrite it?',
                    default: false
                }
            ]);
            if (!shouldContinue) {
                console.log(chalk_1.default.yellow('Initialization cancelled.'));
                return;
            }
        }
        // Step 3: Create or update configuration
        const detector = new project_detector_1.ProjectDetector(detection.rootDir);
        let config = detector.createDefaultConfig(detection);
        // Override with user-provided options
        if (options.componentsDir) {
            config.componentsDir = options.componentsDir;
        }
        if (options.utilsDir) {
            config.utilsDir = options.utilsDir;
        }
        // Step 4: Prompt for configuration customization
        const customConfig = await this.promptForConfiguration(config, detection);
        // Step 5: Handle existing configuration conflicts
        if (configManager.exists()) {
            await this.handleConfigurationConflicts(configManager, customConfig, options.force || false);
        }
        // Step 6: Write configuration file
        const configSpinner = (0, ora_1.default)('Creating configuration file...').start();
        try {
            configManager.write(customConfig, true);
            configSpinner.succeed(`Configuration file created at ${configManager.getConfigPath()}`);
        }
        catch (error) {
            configSpinner.fail('Failed to create configuration file');
            throw error;
        }
        // Step 7: Create directory structure
        const dirSpinner = (0, ora_1.default)('Creating directory structure...').start();
        try {
            configManager.createDirectories();
            dirSpinner.succeed('Directory structure created');
        }
        catch (error) {
            dirSpinner.fail('Failed to create directory structure');
            throw error;
        }
        // Step 8: Install dependencies
        if (!options.skipDeps) {
            await this.installDependencies(detection, customConfig);
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  Dependency installation skipped. You may need to install dependencies manually.'));
        }
        // Step 9: Create initial utility files
        await this.createInitialFiles(detection.rootDir, customConfig);
        // Success message
        console.log();
        console.log(chalk_1.default.green('✅ custom-ui has been initialized successfully!'));
        console.log();
        console.log(chalk_1.default.blue('Next steps:'));
        console.log(chalk_1.default.gray('  1. Run "custom-ui add button" to add your first component'));
        console.log(chalk_1.default.gray('  2. Run "custom-ui list" to see all available components'));
        console.log(chalk_1.default.gray('  3. Check the documentation with "custom-ui docs <component>"'));
        console.log();
    }
    async promptForConfiguration(defaultConfig, detection) {
        console.log(chalk_1.default.blue('📝 Configure your setup:\n'));
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'componentsDir',
                message: 'Where would you like to store your components?',
                default: defaultConfig.componentsDir,
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Components directory cannot be empty';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'utilsDir',
                message: 'Where would you like to store utility functions?',
                default: defaultConfig.utilsDir,
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Utils directory cannot be empty';
                    }
                    return true;
                }
            },
            {
                type: 'list',
                name: 'cssFramework',
                message: 'Which CSS framework would you like to use?',
                choices: [
                    { name: 'Tailwind CSS (recommended)', value: 'tailwind' },
                    { name: 'CSS Modules', value: 'css-modules' },
                    { name: 'Styled Components', value: 'styled-components' }
                ],
                default: detection.hasTailwind ? 'tailwind' : 'css-modules'
            }
        ]);
        return {
            ...defaultConfig,
            componentsDir: answers.componentsDir,
            utilsDir: answers.utilsDir,
            cssFramework: answers.cssFramework
        };
    }
    async handleConfigurationConflicts(configManager, newConfig, force) {
        if (force) {
            // Create backup before overwriting
            const backupPath = configManager.backup();
            console.log(chalk_1.default.yellow(`⚠️  Existing configuration backed up to: ${backupPath}`));
            return;
        }
        const existingConfig = configManager.read();
        const conflicts = this.findConfigurationConflicts(existingConfig, newConfig);
        if (conflicts.length > 0) {
            console.log(chalk_1.default.yellow('⚠️  Configuration conflicts detected:'));
            conflicts.forEach(conflict => {
                console.log(chalk_1.default.yellow(`  - ${conflict}`));
            });
            const { resolution } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'resolution',
                    message: 'How would you like to resolve these conflicts?',
                    choices: [
                        { name: 'Keep existing configuration', value: 'keep' },
                        { name: 'Use new configuration', value: 'overwrite' },
                        { name: 'Merge configurations (manual)', value: 'merge' }
                    ]
                }
            ]);
            switch (resolution) {
                case 'keep':
                    throw new types_1.CLIError('Initialization cancelled - keeping existing configuration', types_1.ERROR_CODES.FILE_EXISTS);
                case 'overwrite':
                    const backupPath = configManager.backup();
                    console.log(chalk_1.default.yellow(`Existing configuration backed up to: ${backupPath}`));
                    break;
                case 'merge':
                    // This would require more complex merging logic
                    console.log(chalk_1.default.yellow('Manual merge not implemented yet. Using new configuration.'));
                    break;
            }
        }
    }
    findConfigurationConflicts(existing, newConfig) {
        const conflicts = [];
        if (existing.componentsDir !== newConfig.componentsDir) {
            conflicts.push(`Components directory: ${existing.componentsDir} → ${newConfig.componentsDir}`);
        }
        if (existing.utilsDir !== newConfig.utilsDir) {
            conflicts.push(`Utils directory: ${existing.utilsDir} → ${newConfig.utilsDir}`);
        }
        if (existing.cssFramework !== newConfig.cssFramework) {
            conflicts.push(`CSS framework: ${existing.cssFramework} → ${newConfig.cssFramework}`);
        }
        if (existing.projectType !== newConfig.projectType) {
            conflicts.push(`Project type: ${existing.projectType} → ${newConfig.projectType}`);
        }
        return conflicts;
    }
    async installDependencies(detection, config) {
        const dependencies = this.getDependenciesToInstall(detection, config);
        if (dependencies.length === 0) {
            console.log(chalk_1.default.green('✅ All required dependencies are already installed'));
            return;
        }
        console.log(chalk_1.default.blue('📦 Installing dependencies...\n'));
        console.log(chalk_1.default.gray('Dependencies to install:'));
        dependencies.forEach(dep => {
            console.log(chalk_1.default.gray(`  - ${dep}`));
        });
        console.log();
        const { shouldInstall } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'shouldInstall',
                message: 'Do you want to install these dependencies?',
                default: true
            }
        ]);
        if (!shouldInstall) {
            console.log(chalk_1.default.yellow('⚠️  Dependency installation skipped. You may need to install them manually.'));
            return;
        }
        const spinner = (0, ora_1.default)('Installing dependencies...').start();
        try {
            await this.runNpmInstall(dependencies, detection.rootDir);
            spinner.succeed('Dependencies installed successfully');
        }
        catch (error) {
            spinner.fail('Failed to install dependencies');
            throw new types_1.CLIError(`Dependency installation failed: ${error}`, types_1.ERROR_CODES.MISSING_DEPENDENCY, [
                'Try installing dependencies manually',
                'Check your internet connection',
                'Verify npm is properly configured'
            ]);
        }
    }
    getDependenciesToInstall(detection, config) {
        const dependencies = [];
        // Base dependencies for all projects
        if (!this.hasDependency(detection.rootDir, 'class-variance-authority')) {
            dependencies.push('class-variance-authority');
        }
        if (!this.hasDependency(detection.rootDir, 'clsx')) {
            dependencies.push('clsx');
        }
        // Tailwind CSS dependencies
        if (config.cssFramework === 'tailwind' && !detection.hasTailwind) {
            dependencies.push('tailwindcss', 'autoprefixer', 'postcss');
            // Add Tailwind merge for better class handling
            if (!this.hasDependency(detection.rootDir, 'tailwind-merge')) {
                dependencies.push('tailwind-merge');
            }
            // Add tailwindcss-animate for animations
            if (!this.hasDependency(detection.rootDir, 'tailwindcss-animate')) {
                dependencies.push('tailwindcss-animate');
            }
        }
        // TypeScript dependencies
        if (config.typescript && !detection.hasTypeScript) {
            dependencies.push('typescript', '@types/react', '@types/react-dom');
        }
        return dependencies;
    }
    hasDependency(projectRoot, packageName) {
        try {
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
            return !!(packageJson.dependencies?.[packageName] ||
                packageJson.devDependencies?.[packageName] ||
                packageJson.peerDependencies?.[packageName]);
        }
        catch {
            return false;
        }
    }
    async runNpmInstall(dependencies, cwd) {
        return new Promise((resolve, reject) => {
            const npm = (0, child_process_1.spawn)('npm', ['install', '--save-dev', ...dependencies], {
                cwd,
                stdio: 'pipe'
            });
            npm.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`npm install exited with code ${code}`));
                }
            });
            npm.on('error', (error) => {
                reject(error);
            });
        });
    }
    async createInitialFiles(projectRoot, config) {
        const spinner = (0, ora_1.default)('Creating initial utility files...').start();
        try {
            // Validate inputs
            if (!projectRoot || typeof projectRoot !== 'string' || projectRoot.trim() === '') {
                throw new Error('Invalid project root directory');
            }
            if (!config || !config.utilsDir || typeof config.utilsDir !== 'string' || config.utilsDir.trim() === '') {
                throw new Error('Invalid utils directory configuration');
            }
            // Create utils.ts file
            const utilsPath = path.join(projectRoot, config.utilsDir, 'utils.ts');
            const utilsContent = this.getUtilsFileContent(config.cssFramework);
            await file_operations_1.FileOperations.writeFile(utilsPath, utilsContent, {
                overwrite: true,
                createBackup: false
            });
            // Create Tailwind config if needed
            if (config.cssFramework === 'tailwind') {
                await this.createTailwindConfig(projectRoot, config);
            }
            spinner.succeed('Initial utility files created');
        }
        catch (error) {
            spinner.fail('Failed to create initial files');
            throw error;
        }
    }
    getUtilsFileContent(cssFramework) {
        if (cssFramework === 'tailwind') {
            return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
        }
        return `import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
`;
    }
    async createTailwindConfig(projectRoot, config) {
        const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
        // Check if Tailwind config already exists
        const conflict = file_operations_1.FileOperations.checkFileConflict(tailwindConfigPath);
        if (conflict.exists) {
            console.log(chalk_1.default.yellow('⚠️  Tailwind config already exists, skipping creation'));
            return;
        }
        const tailwindConfig = this.getTailwindConfigContent(config);
        await file_operations_1.FileOperations.writeFile(tailwindConfigPath, tailwindConfig, {
            overwrite: false,
            createBackup: false
        });
    }
    getTailwindConfigContent(config) {
        const contentPaths = [
            `./${config.componentsDir}/**/*.{js,ts,jsx,tsx,mdx}`,
        ];
        // Add project-specific content paths
        switch (config.projectType) {
            case 'nextjs':
                contentPaths.push('./app/**/*.{js,ts,jsx,tsx,mdx}');
                contentPaths.push('./pages/**/*.{js,ts,jsx,tsx,mdx}');
                break;
            case 'vite':
            case 'cra':
                contentPaths.push('./src/**/*.{js,ts,jsx,tsx}');
                break;
            default:
                contentPaths.push('./src/**/*.{js,ts,jsx,tsx}');
        }
        return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    ${contentPaths.map(path => `"${path}"`).join(',\n    ')}
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`;
    }
}
exports.InitCommand = InitCommand;
//# sourceMappingURL=init.js.map