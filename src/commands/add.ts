import * as path from 'path';
import { CLICommand, CLIError, ERROR_CODES, ProjectConfig, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
import { ConfigManager } from '../utils/config-manager';
import { FileOperations } from '../utils/file-operations';
import { DependencyManager } from '../utils/dependency-manager';
import { ErrorHandler, NetworkErrorHandler } from '../utils/error-handler';
import { feedback, FeedbackUtils } from '../utils/user-feedback';

export interface AddCommandOptions {
  force?: boolean;
  backup?: boolean;
  skipDeps?: boolean;
  silent?: boolean;
  componentsDir?: string;
}

interface AddCommandDependencies {
  registryLoader: RegistryLoader;
  configManager: ConfigManager;
  feedback: UserFeedback;
}

/**
 * Command to add components to a project
 */
export class AddCommand implements CLICommand {
  name = 'add';
  description = 'Add components to your project';

  private registryLoader: RegistryLoader;
  private configManager: ConfigManager;
  private feedback: UserFeedback;

  constructor(dependencies?: Partial<AddCommandDependencies>) {
    this.registryLoader = dependencies?.registryLoader || new RegistryLoader();
    this.configManager = dependencies?.configManager || new ConfigManager(process.cwd());
    this.feedback = dependencies?.feedback || feedback;
  }

  async execute(args: string[]): Promise<void> {
    try {
      if (args.length === 0) {
        throw ErrorHandler.createError(
          ERROR_CODES.INVALID_COMMAND,
          'No component specified',
          { args }
        );
      }

      const options = this.parseOptions(args);
      const componentNames = this.extractComponentNames(args);

      if (componentNames.length === 0) {
        throw ErrorHandler.createError(
          ERROR_CODES.INVALID_COMMAND,
          'No valid component names found in arguments',
          { args }
        );
      }

      // Load and validate configuration first
      const config = await this.loadProjectConfig(options);
      await this.validateProject(config);

      // Execute component installation with progress tracking
      await FeedbackUtils.withSteps(
        componentNames.map(componentName => ({
          name: `Installing component: ${componentName}`,
          operation: async () => {
            await this.addComponent(componentName, config, options);
            return componentName;
          }
        })),
        this.feedback
      );

      this.feedback.success(`Successfully added ${componentNames.length} component(s): ${componentNames.join(', ')}`);

    } catch (error) {
      if (error instanceof CLIError) {
        this.feedback.error(ErrorHandler.formatError(error));
        throw error;
      } else {
        const cliError = ErrorHandler.createError(
          ERROR_CODES.REGISTRY_ERROR,
          `Unexpected error during component installation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { originalError: error }
        );
        this.feedback.error(ErrorHandler.formatError(cliError));
        throw cliError;
      }
    }
  }

  /**
   * Adds a single component to the project
   */
  private async addComponent(
    componentName: string,
    config: ProjectConfig,
    options: AddCommandOptions
  ): Promise<void> {
    try {
      this.feedback.info(`Adding component: ${componentName}`);

      // Get component from registry with network retry
      const component = await NetworkErrorHandler.withRetry(
        async () => {
          const comp = await this.registryLoader.getComponent(componentName);
          if (!comp) {
            throw ErrorHandler.handleComponentError(componentName, new Error('Component not found in registry'));
          }
          return comp;
        },
        { componentName }
      );

      // Resolve component dependencies
      const allComponents = await NetworkErrorHandler.withRetry(
        () => this.registryLoader.getAllComponents(),
        { operation: 'fetch all components' }
      );

      const dependencyManager = new DependencyManager(process.cwd());
      
      const resolvedDeps = await dependencyManager.resolveDependencies(
        [componentName, ...component.metadata.dependencies],
        Object.fromEntries(
          Object.entries(allComponents).map(([name, comp]) => [
            name,
            { dependencies: comp.metadata.dependencies }
          ])
        )
      );

      if (resolvedDeps.length > 1) {
        this.feedback.info(`Resolved dependencies: ${resolvedDeps.filter(dep => dep !== componentName).join(', ')}`);
      }

      // Install with progress tracking
      await FeedbackUtils.withProgress(
        async (progress) => {
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
        },
        {
          total: 100,
          message: `Installing ${componentName}...`,
          showPercentage: true
        },
        this.feedback
      );

    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      } else {
        throw ErrorHandler.handleComponentError(componentName, error as Error);
      }
    }
  }

  /**
   * Installs component files to the project
   */
  private async installComponentFiles(
    component: any,
    config: ProjectConfig,
    options: AddCommandOptions,
    componentName: string
  ): Promise<void> {
    const projectRoot = process.cwd();
    
    // Install main component file
    const componentPath = this.resolveComponentPath(component.component.path, config);
    const fullComponentPath = path.join(projectRoot, componentPath);

    await this.writeComponentFile(
      fullComponentPath,
      component.component.content,
      options,
      `${componentName} component`
    );

    // Install additional files from metadata
    for (const file of component.metadata.files) {
      if (file.type === 'component') {
        continue; // Already handled above
      }

      const filePath = this.resolveFilePath(file.path, config, file.type);
      const fullFilePath = path.join(projectRoot, filePath);

      await this.writeComponentFile(
        fullFilePath,
        file.content,
        options,
        `${componentName} ${file.type}`
      );
    }
  }

  /**
   * Installs utility functions
   */
  private async installUtilities(
    utils: any[],
    config: ProjectConfig,
    options: AddCommandOptions
  ): Promise<void> {
    for (const util of utils) {
      const utilPath = this.resolveFilePath(util.path, config, 'utility');
      const fullUtilPath = path.join(process.cwd(), utilPath);

      // Check if utility already exists
      const conflict = FileOperations.checkFileConflict(fullUtilPath);
      if (conflict.exists && !options.force) {
        console.log(`⚠️  Utility ${util.path} already exists, skipping...`);
        continue;
      }

      await this.writeComponentFile(
        fullUtilPath,
        util.content,
        options,
        `utility ${path.basename(util.path)}`
      );
    }
  }

  /**
   * Installs npm dependencies
   */
  private async installNpmDependencies(
    dependencies: string[],
    options: AddCommandOptions
  ): Promise<void> {
    try {
      this.feedback.info(`Installing npm dependencies: ${dependencies.join(', ')}`);

      const dependencyManager = new DependencyManager(process.cwd());
      
      // Check which dependencies are missing
      const depCheck = await dependencyManager.checkDependencies(dependencies);
      
      if (depCheck.conflicts.length > 0) {
        this.feedback.warning('Dependency version conflicts detected:');
        for (const conflict of depCheck.conflicts) {
          this.feedback.warning(`  ${conflict.name}: installed ${conflict.installed}, required ${conflict.required}`);
        }
        
        if (!options.force) {
          throw ErrorHandler.createError(
            ERROR_CODES.DEPENDENCY_CONFLICT,
            'Dependency version conflicts detected',
            { conflicts: depCheck.conflicts }
          );
        } else {
          this.feedback.warning('Proceeding with installation due to --force flag');
        }
      }

      if (depCheck.missing.length > 0) {
        await dependencyManager.installDependencies(depCheck.missing, {
          silent: options.silent
        });
        this.feedback.success(`Installed ${depCheck.missing.length} npm dependencies`);
      } else {
        this.feedback.info('All dependencies already installed');
      }
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      } else {
        throw ErrorHandler.handleDependencyError(
          dependencies.join(', '),
          error as Error
        );
      }
    }
  }

  /**
   * Writes a component file with conflict handling
   */
  private async writeComponentFile(
    filePath: string,
    content: string,
    options: AddCommandOptions,
    description: string
  ): Promise<void> {
    try {
      const conflict = FileOperations.checkFileConflict(filePath);
      
      if (conflict.exists && !options.force) {
        if (options.backup) {
          const backupPath = await FileOperations.createBackup(filePath);
          this.feedback.info(`Created backup: ${backupPath}`);
        } else {
          // Prompt user for resolution
          const resolution = await FileOperations.resolveConflict(
            filePath,
            this.createPromptCallback()
          );

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

      await FileOperations.writeFile(filePath, content, {
        overwrite: true,
        createBackup: options.backup && conflict.exists
      });

      this.feedback.success(`Installed ${description}: ${path.relative(process.cwd(), filePath)}`);
    } catch (error) {
      throw ErrorHandler.handleFileSystemError(error as Error, filePath);
    }
  }

  /**
   * Resolves component file path based on project configuration
   */
  private resolveComponentPath(componentPath: string, config: ProjectConfig): string {
    // Replace components/ui with the configured components directory
    return componentPath.replace('components/ui', config.componentsDir);
  }

  /**
   * Resolves file path based on type and project configuration
   */
  private resolveFilePath(filePath: string, config: ProjectConfig, type: string): string {
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
  private async loadProjectConfig(options: AddCommandOptions): Promise<ProjectConfig> {
    try {
      const config = this.configManager.read();
      
      // Override components directory if specified in options
      if (options.componentsDir) {
        config.componentsDir = options.componentsDir;
      }
      
      return config;
    } catch (error) {
      throw ErrorHandler.createError(
        ERROR_CODES.CONFIG_ERROR,
        'Project not initialized or configuration is invalid',
        { configPath: this.configManager.getConfigPath() }
      );
    }
  }

  /**
   * Validates project setup
   */
  private async validateProject(config: ProjectConfig): Promise<void> {
    try {
      const projectRoot = process.cwd();
      
      // Check if package.json exists
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (!FileOperations.checkFileConflict(packageJsonPath).exists) {
        throw ErrorHandler.createError(
          ERROR_CODES.INVALID_PROJECT,
          'package.json not found in current directory',
          { projectRoot, packageJsonPath }
        );
      }

      // Ensure component directories exist
      await FileOperations.ensureDirectory(path.join(projectRoot, config.componentsDir));
      await FileOperations.ensureDirectory(path.join(projectRoot, config.utilsDir));
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      } else {
        throw ErrorHandler.handleFileSystemError(error as Error);
      }
    }
  }

  /**
   * Parses command line options
   */
  private parseOptions(args: string[]): AddCommandOptions {
    const options: AddCommandOptions = {};

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
  private extractComponentNames(args: string[]): string[] {
    const components: string[] = [];
    
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
  private createPromptCallback(): (message: string, choices: string[]) => Promise<string> {
    return async (message: string, choices: string[]): Promise<string> => {
      // In a real CLI, this would use a library like inquirer
      // For now, we'll default to 'skip' for safety
      console.log(`${message}`);
      console.log(`Choices: ${choices.join(', ')}`);
      console.log('Defaulting to "skip" - use --force to overwrite or --backup to create backups');
      return 'skip';
    };
  }
}