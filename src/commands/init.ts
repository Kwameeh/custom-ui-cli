import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { spawn } from 'child_process';
import * as path from 'path';
import { ProjectDetector } from '../utils/project-detector';
import { ConfigManager } from '../utils/config-manager';
import { FileOperations } from '../utils/file-operations';
import { CLICommand, ProjectConfig, CLIError, ERROR_CODES } from '../types';

export interface InitOptions {
  force?: boolean;
  skipDeps?: boolean;
  componentsDir?: string;
  utilsDir?: string;
}

/**
 * Init command implementation
 */
export class InitCommand implements CLICommand {
  name = 'init';
  description = 'Initialize custom-ui in your project';

  async execute(args: string[]): Promise<void> {
    const program = new Command();
    
    program
      .name('init')
      .description(this.description)
      .option('-f, --force', 'Overwrite existing configuration')
      .option('--skip-deps', 'Skip dependency installation')
      .option('--components-dir <dir>', 'Custom components directory')
      .option('--utils-dir <dir>', 'Custom utils directory')
      .parse(['node', 'init', ...args]);

    const options = program.opts<InitOptions>();
    
    try {
      await this.runInit(options);
    } catch (error) {
      if (error instanceof CLIError) {
        console.error(chalk.red(`Error: ${error.message}`));
        if (error.suggestions) {
          console.error(chalk.yellow('Suggestions:'));
          error.suggestions.forEach(suggestion => {
            console.error(chalk.yellow(`  - ${suggestion}`));
          });
        }
        process.exit(1);
      }
      throw error;
    }
  }

  private async runInit(options: InitOptions): Promise<void> {
    console.log(chalk.blue('🚀 Initializing custom-ui in your project...\n'));

    // Step 1: Detect project type and configuration
    const spinner = ora('Detecting project configuration...').start();
    
    let detection;
    try {
      const detector = new ProjectDetector();
      detection = await detector.detect();
      spinner.succeed('Project configuration detected');
    } catch (error) {
      spinner.fail('Failed to detect project configuration');
      throw new CLIError(
        `Project detection failed: ${error}`,
        ERROR_CODES.INVALID_PROJECT,
        [
          'Make sure you are in a valid Node.js project directory',
          'Ensure package.json exists in the current directory or parent directories'
        ]
      );
    }

    // Display detected configuration
    console.log(chalk.gray('Detected configuration:'));
    console.log(chalk.gray(`  Project type: ${detection.type}`));
    console.log(chalk.gray(`  TypeScript: ${detection.hasTypeScript ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Tailwind CSS: ${detection.hasTailwind ? 'Yes' : 'No'}`));
    console.log();

    // Step 2: Check for existing configuration
    const configManager = new ConfigManager(detection.rootDir);
    
    if (configManager.exists() && !options.force) {
      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Configuration file already exists. Do you want to overwrite it?',
          default: false
        }
      ]);

      if (!shouldContinue) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    }

    // Step 3: Create or update configuration
    const detector = new ProjectDetector(detection.rootDir);
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
    const configSpinner = ora('Creating configuration file...').start();
    try {
      configManager.write(customConfig, true);
      configSpinner.succeed(`Configuration file created at ${configManager.getConfigPath()}`);
    } catch (error) {
      configSpinner.fail('Failed to create configuration file');
      throw error;
    }

    // Step 7: Create directory structure
    const dirSpinner = ora('Creating directory structure...').start();
    try {
      configManager.createDirectories();
      dirSpinner.succeed('Directory structure created');
    } catch (error) {
      dirSpinner.fail('Failed to create directory structure');
      throw error;
    }

    // Step 8: Install dependencies
    if (!options.skipDeps) {
      await this.installDependencies(detection, customConfig);
    } else {
      console.log(chalk.yellow('⚠️  Dependency installation skipped. You may need to install dependencies manually.'));
    }

    // Step 9: Create initial utility files
    await this.createInitialFiles(detection.rootDir, customConfig);

    // Success message
    console.log();
    console.log(chalk.green('✅ custom-ui has been initialized successfully!'));
    console.log();
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.gray('  1. Run "custom-ui add button" to add your first component'));
    console.log(chalk.gray('  2. Run "custom-ui list" to see all available components'));
    console.log(chalk.gray('  3. Check the documentation with "custom-ui docs <component>"'));
    console.log();
  }

  private async promptForConfiguration(
    defaultConfig: ProjectConfig, 
    detection: any
  ): Promise<ProjectConfig> {
    console.log(chalk.blue('📝 Configure your setup:\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'componentsDir',
        message: 'Where would you like to store your components?',
        default: defaultConfig.componentsDir,
        validate: (input: string) => {
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
        validate: (input: string) => {
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

  private async handleConfigurationConflicts(
    configManager: ConfigManager,
    newConfig: ProjectConfig,
    force: boolean
  ): Promise<void> {
    if (force) {
      // Create backup before overwriting
      const backupPath = configManager.backup();
      console.log(chalk.yellow(`⚠️  Existing configuration backed up to: ${backupPath}`));
      return;
    }

    const existingConfig = configManager.read();
    const conflicts = this.findConfigurationConflicts(existingConfig, newConfig);

    if (conflicts.length > 0) {
      console.log(chalk.yellow('⚠️  Configuration conflicts detected:'));
      conflicts.forEach(conflict => {
        console.log(chalk.yellow(`  - ${conflict}`));
      });

      const { resolution } = await inquirer.prompt([
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
          throw new CLIError(
            'Initialization cancelled - keeping existing configuration',
            ERROR_CODES.FILE_EXISTS
          );
        case 'overwrite':
          const backupPath = configManager.backup();
          console.log(chalk.yellow(`Existing configuration backed up to: ${backupPath}`));
          break;
        case 'merge':
          // This would require more complex merging logic
          console.log(chalk.yellow('Manual merge not implemented yet. Using new configuration.'));
          break;
      }
    }
  }

  private findConfigurationConflicts(
    existing: ProjectConfig, 
    newConfig: ProjectConfig
  ): string[] {
    const conflicts: string[] = [];

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

  private async installDependencies(detection: any, config: ProjectConfig): Promise<void> {
    const dependencies = this.getDependenciesToInstall(detection, config);
    
    if (dependencies.length === 0) {
      console.log(chalk.green('✅ All required dependencies are already installed'));
      return;
    }

    console.log(chalk.blue('📦 Installing dependencies...\n'));
    console.log(chalk.gray('Dependencies to install:'));
    dependencies.forEach(dep => {
      console.log(chalk.gray(`  - ${dep}`));
    });
    console.log();

    const { shouldInstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInstall',
        message: 'Do you want to install these dependencies?',
        default: true
      }
    ]);

    if (!shouldInstall) {
      console.log(chalk.yellow('⚠️  Dependency installation skipped. You may need to install them manually.'));
      return;
    }

    const spinner = ora('Installing dependencies...').start();
    
    try {
      await this.runNpmInstall(dependencies, detection.rootDir);
      spinner.succeed('Dependencies installed successfully');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      throw new CLIError(
        `Dependency installation failed: ${error}`,
        ERROR_CODES.MISSING_DEPENDENCY,
        [
          'Try installing dependencies manually',
          'Check your internet connection',
          'Verify npm is properly configured'
        ]
      );
    }
  }

  private getDependenciesToInstall(detection: any, config: ProjectConfig): string[] {
    const dependencies: string[] = [];

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

  private hasDependency(projectRoot: string, packageName: string): boolean {
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
      
      return !!(
        packageJson.dependencies?.[packageName] ||
        packageJson.devDependencies?.[packageName] ||
        packageJson.peerDependencies?.[packageName]
      );
    } catch {
      return false;
    }
  }

  private async runNpmInstall(dependencies: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '--save-dev', ...dependencies], {
        cwd,
        stdio: 'pipe'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install exited with code ${code}`));
        }
      });

      npm.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async createInitialFiles(projectRoot: string, config: ProjectConfig): Promise<void> {
    const spinner = ora('Creating initial utility files...').start();

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
      
      await FileOperations.writeFile(utilsPath, utilsContent, {
        overwrite: true,
        createBackup: false
      });

      // Create Tailwind config if needed
      if (config.cssFramework === 'tailwind') {
        await this.createTailwindConfig(projectRoot, config);
      }

      spinner.succeed('Initial utility files created');
    } catch (error) {
      spinner.fail('Failed to create initial files');
      throw error;
    }
  }

  private getUtilsFileContent(cssFramework: string): string {
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

  private async createTailwindConfig(projectRoot: string, config: ProjectConfig): Promise<void> {
    const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
    
    // Check if Tailwind config already exists
    const conflict = FileOperations.checkFileConflict(tailwindConfigPath);
    if (conflict.exists) {
      console.log(chalk.yellow('⚠️  Tailwind config already exists, skipping creation'));
      return;
    }

    const tailwindConfig = this.getTailwindConfigContent(config);
    
    await FileOperations.writeFile(tailwindConfigPath, tailwindConfig, {
      overwrite: false,
      createBackup: false
    });
  }

  private getTailwindConfigContent(config: ProjectConfig): string {
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