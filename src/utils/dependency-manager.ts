import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { CLIError, ERROR_CODES } from '../types';

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: any;
}

export interface DependencyInstallOptions {
  dev?: boolean;
  peer?: boolean;
  exact?: boolean;
  silent?: boolean;
}

/**
 * Manages npm dependencies and package.json operations
 */
export class DependencyManager {
  private projectRoot: string;
  private packageJsonPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.packageJsonPath = path.join(projectRoot, 'package.json');
  }

  /**
   * Reads and parses package.json
   */
  async readPackageJson(): Promise<PackageJson> {
    if (!fs.existsSync(this.packageJsonPath)) {
      throw new CLIError(
        'package.json not found in project root',
        ERROR_CODES.INVALID_PROJECT,
        ['Ensure you are in a valid Node.js project directory']
      );
    }

    try {
      const content = fs.readFileSync(this.packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new CLIError(
        `Failed to parse package.json: ${error}`,
        ERROR_CODES.INVALID_PROJECT,
        ['Check package.json for syntax errors']
      );
    }
  }

  /**
   * Writes package.json with proper formatting
   */
  async writePackageJson(packageJson: PackageJson): Promise<void> {
    try {
      const content = JSON.stringify(packageJson, null, 2) + '\n';
      fs.writeFileSync(this.packageJsonPath, content, 'utf-8');
    } catch (error) {
      throw new CLIError(
        `Failed to write package.json: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Checks if dependencies are already installed
   */
  async checkDependencies(dependencies: string[]): Promise<{
    missing: string[];
    existing: string[];
    conflicts: Array<{ name: string; installed: string; required: string }>;
  }> {
    const packageJson = await this.readPackageJson();
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };

    const missing: string[] = [];
    const existing: string[] = [];
    const conflicts: Array<{ name: string; installed: string; required: string }> = [];

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
      } else {
        missing.push(dep);
      }
    }

    return { missing, existing, conflicts };
  }

  /**
   * Installs npm dependencies
   */
  async installDependencies(
    dependencies: string[],
    options: DependencyInstallOptions = {}
  ): Promise<void> {
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
      execSync(command, {
        cwd: this.projectRoot,
        stdio: silent ? 'pipe' : 'inherit'
      });
    } catch (error) {
      throw new CLIError(
        `Failed to install dependencies: ${error}`,
        ERROR_CODES.NETWORK_ERROR,
        [
          'Check your internet connection',
          'Verify npm is installed and configured',
          'Try running npm install manually'
        ]
      );
    }
  }

  /**
   * Adds dependencies to package.json without installing
   */
  async addDependenciesToPackageJson(
    dependencies: string[],
    options: DependencyInstallOptions = {}
  ): Promise<void> {
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

      packageJson[targetDeps]![name] = version === 'latest' ? '^1.0.0' : version;
    }

    await this.writePackageJson(packageJson);
  }

  /**
   * Resolves component dependencies recursively
   */
  async resolveDependencies(
    componentDeps: string[],
    availableComponents: Record<string, { dependencies: string[] }>
  ): Promise<string[]> {
    const resolved = new Set<string>();
    const visiting = new Set<string>();

    const resolve = (componentName: string): void => {
      if (resolved.has(componentName)) {
        return;
      }

      if (visiting.has(componentName)) {
        throw new CLIError(
          `Circular dependency detected: ${componentName}`,
          ERROR_CODES.INVALID_PROJECT,
          ['Check component dependencies for circular references']
        );
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
  detectPackageManager(): 'npm' | 'yarn' | 'pnpm' {
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
  async runInstall(silent: boolean = false): Promise<void> {
    const packageManager = this.detectPackageManager();
    
    let command: string;
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
      execSync(command, {
        cwd: this.projectRoot,
        stdio: silent ? 'pipe' : 'inherit'
      });
    } catch (error) {
      throw new CLIError(
        `Failed to run ${packageManager} install: ${error}`,
        ERROR_CODES.NETWORK_ERROR,
        [
          'Check your internet connection',
          `Verify ${packageManager} is installed and configured`,
          `Try running ${command} manually`
        ]
      );
    }
  }
}