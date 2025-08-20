import { CLICommand, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
import { ConfigManager } from '../utils/config-manager';
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
export declare class AddCommand implements CLICommand {
    name: string;
    description: string;
    private registryLoader;
    private configManager;
    private feedback;
    constructor(dependencies?: Partial<AddCommandDependencies>);
    execute(args: string[]): Promise<void>;
    /**
     * Adds a single component to the project
     */
    private addComponent;
    /**
     * Installs component files to the project
     */
    private installComponentFiles;
    /**
     * Installs utility functions
     */
    private installUtilities;
    /**
     * Installs npm dependencies
     */
    private installNpmDependencies;
    /**
     * Writes a component file with conflict handling
     */
    private writeComponentFile;
    /**
     * Resolves component file path based on project configuration
     */
    private resolveComponentPath;
    /**
     * Resolves file path based on type and project configuration
     */
    private resolveFilePath;
    /**
     * Loads project configuration
     */
    private loadProjectConfig;
    /**
     * Validates project setup
     */
    private validateProject;
    /**
     * Parses command line options
     */
    private parseOptions;
    /**
     * Extracts component names from arguments (non-option arguments)
     */
    private extractComponentNames;
    /**
     * Creates a prompt callback for user interaction
     */
    private createPromptCallback;
}
export {};
//# sourceMappingURL=add.d.ts.map