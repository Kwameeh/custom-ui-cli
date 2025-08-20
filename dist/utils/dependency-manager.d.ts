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
export declare class DependencyManager {
    private projectRoot;
    private packageJsonPath;
    constructor(projectRoot: string);
    /**
     * Reads and parses package.json
     */
    readPackageJson(): Promise<PackageJson>;
    /**
     * Writes package.json with proper formatting
     */
    writePackageJson(packageJson: PackageJson): Promise<void>;
    /**
     * Checks if dependencies are already installed
     */
    checkDependencies(dependencies: string[]): Promise<{
        missing: string[];
        existing: string[];
        conflicts: Array<{
            name: string;
            installed: string;
            required: string;
        }>;
    }>;
    /**
     * Installs npm dependencies
     */
    installDependencies(dependencies: string[], options?: DependencyInstallOptions): Promise<void>;
    /**
     * Adds dependencies to package.json without installing
     */
    addDependenciesToPackageJson(dependencies: string[], options?: DependencyInstallOptions): Promise<void>;
    /**
     * Resolves component dependencies recursively
     */
    resolveDependencies(componentDeps: string[], availableComponents: Record<string, {
        dependencies: string[];
    }>): Promise<string[]>;
    /**
     * Gets the package manager being used (npm, yarn, pnpm)
     */
    detectPackageManager(): 'npm' | 'yarn' | 'pnpm';
    /**
     * Runs install command with detected package manager
     */
    runInstall(silent?: boolean): Promise<void>;
}
//# sourceMappingURL=dependency-manager.d.ts.map