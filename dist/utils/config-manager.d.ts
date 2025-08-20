import { ProjectConfig } from '../types';
export declare const CONFIG_FILENAME = "custom-ui.json";
/**
 * Manages project configuration file creation and updates
 */
export declare class ConfigManager {
    private projectRoot;
    private configPath;
    constructor(projectRoot: string);
    /**
     * Checks if configuration file exists
     */
    exists(): boolean;
    /**
     * Reads the configuration file
     */
    read(): ProjectConfig;
    /**
     * Writes configuration to file
     */
    write(config: ProjectConfig, overwrite?: boolean): void;
    /**
     * Updates existing configuration with partial updates
     */
    update(updates: Partial<ProjectConfig>): ProjectConfig;
    /**
     * Validates configuration object
     */
    private validateConfig;
    /**
     * Gets the absolute path for components directory
     */
    getComponentsPath(): string;
    /**
     * Gets the absolute path for utils directory
     */
    getUtilsPath(): string;
    /**
     * Creates directory structure based on configuration
     */
    createDirectories(): void;
    /**
     * Gets configuration file path
     */
    getConfigPath(): string;
    /**
     * Creates a backup of the current configuration
     */
    backup(): string;
    /**
     * Restores configuration from backup
     */
    restore(backupPath: string): void;
}
//# sourceMappingURL=config-manager.d.ts.map