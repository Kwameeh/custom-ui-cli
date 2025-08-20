import { ComponentMetadata, RegistryComponent } from '../types';
export interface Registry {
    components: Record<string, RegistryComponent>;
    utils: Record<string, {
        path: string;
        content: string;
        description: string;
    }>;
}
export declare class RegistryLoader {
    private registryPath;
    private cachedRegistry;
    constructor(registryPath?: string);
    /**
     * Load the component registry from JSON file
     */
    loadRegistry(): Promise<Registry>;
    /**
     * Get a specific component from the registry
     */
    getComponent(componentName: string): Promise<RegistryComponent | null>;
    /**
     * Get all available component names
     */
    getComponentNames(): Promise<string[]>;
    /**
     * Get component metadata only (without full content)
     */
    getComponentMetadata(componentName: string): Promise<ComponentMetadata | null>;
    /**
     * Get all components with their metadata
     */
    getAllComponents(): Promise<Record<string, RegistryComponent>>;
    /**
     * Get utility functions from the registry
     */
    getUtils(): Promise<Record<string, {
        path: string;
        content: string;
        description: string;
    }>>;
    /**
     * Clear the cached registry (useful for testing or updates)
     */
    clearCache(): void;
    /**
     * Validate the registry structure
     */
    private validateRegistry;
    /**
     * Validate a single component structure
     */
    private validateComponent;
    /**
     * Validate component metadata structure
     */
    private validateComponentMetadata;
    /**
     * Validate component file structure
     */
    private validateComponentFile;
    /**
     * Validate utility structure
     */
    private validateUtil;
}
//# sourceMappingURL=registry-loader.d.ts.map