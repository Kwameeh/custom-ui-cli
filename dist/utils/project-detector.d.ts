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
export declare class ProjectDetector {
    private rootDir;
    constructor(rootDir?: string);
    /**
     * Detects the project type and configuration
     */
    detect(): Promise<ProjectDetectionResult>;
    /**
     * Finds package.json in current directory or parent directories
     */
    private findPackageJson;
    /**
     * Reads and parses package.json
     */
    private readPackageJson;
    /**
     * Detects project type based on dependencies and config files
     */
    private detectProjectType;
    /**
     * Detects TypeScript usage
     */
    private detectTypeScript;
    /**
     * Detects Tailwind CSS usage
     */
    private detectTailwind;
    /**
     * Checks if any of the specified config files exist
     */
    private hasConfigFile;
    /**
     * Creates a default project configuration based on detection results
     */
    createDefaultConfig(detection: ProjectDetectionResult): ProjectConfig;
}
//# sourceMappingURL=project-detector.d.ts.map