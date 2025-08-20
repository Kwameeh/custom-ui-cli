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
export declare class CLIError extends Error {
    code: string;
    suggestions?: string[] | undefined;
    context?: Record<string, any> | undefined;
    constructor(message: string, code: string, suggestions?: string[] | undefined, context?: Record<string, any> | undefined);
    toJSON(): {
        name: string;
        message: string;
        code: string;
        suggestions: string[] | undefined;
        context: Record<string, any> | undefined;
        stack: string | undefined;
    };
}
export declare const ERROR_CODES: {
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly FILE_EXISTS: "FILE_EXISTS";
    readonly INVALID_PROJECT: "INVALID_PROJECT";
    readonly MISSING_DEPENDENCY: "MISSING_DEPENDENCY";
    readonly COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND";
    readonly INVALID_COMMAND: "INVALID_COMMAND";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly REGISTRY_ERROR: "REGISTRY_ERROR";
    readonly DEPENDENCY_CONFLICT: "DEPENDENCY_CONFLICT";
    readonly CONFIG_ERROR: "CONFIG_ERROR";
};
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
//# sourceMappingURL=types.d.ts.map