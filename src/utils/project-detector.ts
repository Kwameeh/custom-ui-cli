import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig } from '../types';

export type ProjectType = 'nextjs' | 'vite' | 'cra' | 'generic';

export interface ProjectDetectionResult {
  type: ProjectType;
  hasTypeScript: boolean;
  hasTailwind: boolean;
  packageJsonPath: string;
  rootDir: string;
}

/**
 * Detects the project type by examining configuration files and dependencies
 */
export class ProjectDetector {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Detects the project type and configuration
   */
  async detect(): Promise<ProjectDetectionResult> {
    const packageJsonPath = this.findPackageJson();
    if (!packageJsonPath) {
      throw new Error('No package.json found in current directory or parent directories');
    }

    const packageJson = this.readPackageJson(packageJsonPath);
    const projectRoot = path.dirname(packageJsonPath);
    
    const type = this.detectProjectType(packageJson, projectRoot);
    const hasTypeScript = this.detectTypeScript(packageJson, projectRoot);
    const hasTailwind = this.detectTailwind(packageJson, projectRoot);

    return {
      type,
      hasTypeScript,
      hasTailwind,
      packageJsonPath,
      rootDir: projectRoot
    };
  }

  /**
   * Finds package.json in current directory or parent directories
   */
  private findPackageJson(): string | null {
    let currentDir = this.rootDir;
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return packageJsonPath;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  /**
   * Reads and parses package.json
   */
  private readPackageJson(packageJsonPath: string): any {
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error}`);
    }
  }

  /**
   * Detects project type based on dependencies and config files
   */
  private detectProjectType(packageJson: any, projectRoot: string): ProjectType {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check for Next.js
    if (dependencies.next || this.hasConfigFile(projectRoot, ['next.config.js', 'next.config.ts', 'next.config.mjs'])) {
      return 'nextjs';
    }

    // Check for Vite
    if (dependencies.vite || this.hasConfigFile(projectRoot, ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'])) {
      return 'vite';
    }

    // Check for Create React App
    if (dependencies['react-scripts']) {
      return 'cra';
    }

    // Default to generic React project
    return 'generic';
  }

  /**
   * Detects TypeScript usage
   */
  private detectTypeScript(packageJson: any, projectRoot: string): boolean {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    return !!(
      dependencies.typescript ||
      this.hasConfigFile(projectRoot, ['tsconfig.json']) ||
      fs.existsSync(path.join(projectRoot, 'src', 'index.tsx')) ||
      fs.existsSync(path.join(projectRoot, 'app', 'layout.tsx'))
    );
  }

  /**
   * Detects Tailwind CSS usage
   */
  private detectTailwind(packageJson: any, projectRoot: string): boolean {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    return !!(
      dependencies.tailwindcss ||
      this.hasConfigFile(projectRoot, ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'])
    );
  }

  /**
   * Checks if any of the specified config files exist
   */
  private hasConfigFile(projectRoot: string, filenames: string[]): boolean {
    return filenames.some(filename => 
      fs.existsSync(path.join(projectRoot, filename))
    );
  }

  /**
   * Creates a default project configuration based on detection results
   */
  createDefaultConfig(detection: ProjectDetectionResult): ProjectConfig {
    const baseConfig: ProjectConfig = {
      componentsDir: 'components/ui',
      utilsDir: 'lib',
      cssFramework: detection.hasTailwind ? 'tailwind' : 'css-modules',
      typescript: detection.hasTypeScript,
      projectType: detection.type
    };

    // Adjust paths based on project type
    switch (detection.type) {
      case 'nextjs':
        if (fs.existsSync(path.join(detection.rootDir, 'app'))) {
          // App Router structure
          baseConfig.componentsDir = 'components/ui';
          baseConfig.utilsDir = 'lib';
        } else {
          // Pages Router structure
          baseConfig.componentsDir = 'components/ui';
          baseConfig.utilsDir = 'lib';
        }
        break;
      case 'vite':
        baseConfig.componentsDir = 'src/components/ui';
        baseConfig.utilsDir = 'src/lib';
        break;
      case 'cra':
        baseConfig.componentsDir = 'src/components/ui';
        baseConfig.utilsDir = 'src/lib';
        break;
      default:
        baseConfig.componentsDir = 'src/components/ui';
        baseConfig.utilsDir = 'src/lib';
    }

    return baseConfig;
  }
}