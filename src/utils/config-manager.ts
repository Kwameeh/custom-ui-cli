import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, CLIError, ERROR_CODES } from '../types';

export const CONFIG_FILENAME = 'custom-ui.json';

/**
 * Manages project configuration file creation and updates
 */
export class ConfigManager {
  private projectRoot: string;
  private configPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, CONFIG_FILENAME);
  }

  /**
   * Checks if configuration file exists
   */
  exists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * Reads the configuration file
   */
  read(): ProjectConfig {
    if (!this.exists()) {
      throw new CLIError(
        `Configuration file not found at ${this.configPath}`,
        ERROR_CODES.INVALID_PROJECT,
        ['Run "custom-ui init" to initialize the project configuration']
      );
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return this.validateConfig(config);
    } catch (error) {
      throw new CLIError(
        `Failed to read configuration file: ${error}`,
        ERROR_CODES.INVALID_PROJECT,
        ['Check if the configuration file is valid JSON']
      );
    }
  }

  /**
   * Writes configuration to file
   */
  write(config: ProjectConfig, overwrite: boolean = false): void {
    if (this.exists() && !overwrite) {
      throw new CLIError(
        `Configuration file already exists at ${this.configPath}`,
        ERROR_CODES.FILE_EXISTS,
        ['Use --force flag to overwrite existing configuration']
      );
    }

    try {
      const validatedConfig = this.validateConfig(config);
      const content = JSON.stringify(validatedConfig, null, 2);
      fs.writeFileSync(this.configPath, content, 'utf-8');
    } catch (error) {
      throw new CLIError(
        `Failed to write configuration file: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Updates existing configuration with partial updates
   */
  update(updates: Partial<ProjectConfig>): ProjectConfig {
    const currentConfig = this.read();
    const updatedConfig = { ...currentConfig, ...updates };
    this.write(updatedConfig, true);
    return updatedConfig;
  }

  /**
   * Validates configuration object
   */
  private validateConfig(config: any): ProjectConfig {
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

    return config as ProjectConfig;
  }

  /**
   * Gets the absolute path for components directory
   */
  getComponentsPath(): string {
    const config = this.read();
    return path.resolve(this.projectRoot, config.componentsDir);
  }

  /**
   * Gets the absolute path for utils directory
   */
  getUtilsPath(): string {
    const config = this.read();
    return path.resolve(this.projectRoot, config.utilsDir);
  }

  /**
   * Creates directory structure based on configuration
   */
  createDirectories(): void {
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
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Creates a backup of the current configuration
   */
  backup(): string {
    if (!this.exists()) {
      throw new CLIError(
        'No configuration file to backup',
        ERROR_CODES.INVALID_PROJECT
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.projectRoot, 
      `${CONFIG_FILENAME}.backup.${timestamp}`
    );

    fs.copyFileSync(this.configPath, backupPath);
    return backupPath;
  }

  /**
   * Restores configuration from backup
   */
  restore(backupPath: string): void {
    if (!fs.existsSync(backupPath)) {
      throw new CLIError(
        `Backup file not found: ${backupPath}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    fs.copyFileSync(backupPath, this.configPath);
  }
}