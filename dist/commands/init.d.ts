import { CLICommand } from '../types';
export interface InitOptions {
    force?: boolean;
    skipDeps?: boolean;
    componentsDir?: string;
    utilsDir?: string;
}
/**
 * Init command implementation
 */
export declare class InitCommand implements CLICommand {
    name: string;
    description: string;
    execute(args: string[]): Promise<void>;
    private runInit;
    private promptForConfiguration;
    private handleConfigurationConflicts;
    private findConfigurationConflicts;
    private installDependencies;
    private getDependenciesToInstall;
    private hasDependency;
    private runNpmInstall;
    private createInitialFiles;
    private getUtilsFileContent;
    private createTailwindConfig;
    private getTailwindConfigContent;
}
//# sourceMappingURL=init.d.ts.map