import { CLICommand, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
export interface DocsCommandOptions {
    format?: 'text' | 'json';
    examples?: boolean;
}
interface DocsCommandDependencies {
    registryLoader: RegistryLoader;
    feedback: UserFeedback;
}
/**
 * Command to show component documentation
 */
export declare class DocsCommand implements CLICommand {
    name: string;
    description: string;
    private registryLoader;
    private feedback;
    constructor(dependencies?: Partial<DocsCommandDependencies>);
    execute(args: string[]): Promise<void>;
    /**
     * Shows documentation for a specific component
     */
    private showComponentDocs;
    /**
     * Shows general help and available components
     */
    private showGeneralHelp;
    /**
     * Displays documentation in text format
     */
    private displayTextDocs;
    /**
     * Displays documentation in JSON format
     */
    private displayJsonDocs;
    /**
     * Displays usage examples
     */
    private displayExamples;
    /**
     * Displays component props extracted from TypeScript interface
     */
    private displayComponentProps;
    /**
     * Extracts props interface from component content
     */
    private extractPropsInterface;
    /**
     * Generates a basic usage example for a component
     */
    private generateBasicExample;
    /**
     * Gets list of available component names
     */
    private getAvailableComponentNames;
    /**
     * Parses command line options
     */
    private parseOptions;
    /**
     * Extracts component names from arguments (non-option arguments)
     */
    private extractComponentNames;
}
export {};
//# sourceMappingURL=docs.d.ts.map