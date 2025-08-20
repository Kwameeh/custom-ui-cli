/**
 * Core TypeScript interfaces for the CLI package
 */

export interface CLICommand {
  name: string;
  description: string;
  execute(args: string[]): Promise<void>;
}

export interface ComponentMetadata {
  name: string;
  description: string;
  dependencies: string[];
  files: ComponentFile[];
  npmDependencies: string[];
}

export interface ComponentFile {
  path: string;
  content: string;
  type: 'component' | 'utility' | 'type';
}

export interface ProjectConfig {
  componentsDir: string;
  utilsDir: string;
  cssFramework: 'tailwind' | 'css-modules' | 'styled-components';
  typescript: boolean;
  projectType: 'nextjs' | 'vite' | 'cra' | 'generic';
}

export interface RegistryComponent {
  metadata: ComponentMetadata;
  component: {
    path: string;
    content: string;
  };
  utils?: ComponentFile[];
  types?: ComponentFile[];
  examples?: string[];
}

export class CLIError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestions?: string[],
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CLIError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      suggestions: this.suggestions,
      context: this.context,
      stack: this.stack
    };
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_EXISTS: 'FILE_EXISTS',
  INVALID_PROJECT: 'INVALID_PROJECT',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  COMPONENT_NOT_FOUND: 'COMPONENT_NOT_FOUND',
  INVALID_COMMAND: 'INVALID_COMMAND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  REGISTRY_ERROR: 'REGISTRY_ERROR',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  CONFIG_ERROR: 'CONFIG_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface ProgressOptions {
  total?: number;
  message?: string;
  showPercentage?: boolean;
}

export interface UserFeedback {
  success(message: string): void;
  error(message: string, error?: Error): void;
  warning(message: string): void;
  info(message: string): void;
  progress(options: ProgressOptions): ProgressIndicator;
}

export interface ProgressIndicator {
  update(current: number, message?: string): void;
  increment(message?: string): void;
  complete(message?: string): void;
  fail(message?: string): void;
}