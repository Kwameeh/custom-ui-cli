import { CLICommand, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
export interface ListCommandOptions {
    verbose?: boolean;
    category?: string;
    search?: string;
}
interface ListCommandDependencies {
    registryLoader: RegistryLoader;
    feedback: UserFeedback;
}
/**
 * Command to list available components
 */
export declare class ListCommand implements CLICommand {
    name: string;
    description: string;
    private registryLoader;
    private feedback;
    constructor(dependencies?: Partial<ListCommandDependencies>);
    execute(args: string[]): Promise<void>;
    /**
     * Filters components based on search criteria
     */
    private filterComponents;
    /**
     * Displays components in a formatted list
     */
    private displayComponents;
    /**
     * Displays a component in verbose format
     */
    private displayVerboseComponent;
    /**
     * Displays a component in compact format
     */
    private displayCompactComponent;
    /**
     * Parses command line options
     */
    private parseOptions;
}
export {};
//# sourceMappingURL=list.d.ts.map