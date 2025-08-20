import { RegistryComponent, ComponentFile } from '../types';
export declare class RegistryUtils {
    private loader;
    constructor(registryPath?: string);
    /**
     * Search components by name or description
     */
    searchComponents(query: string): Promise<Array<{
        name: string;
        component: RegistryComponent;
    }>>;
    /**
     * Get components that depend on a specific component
     */
    getComponentDependents(componentName: string): Promise<string[]>;
    /**
     * Get all dependencies for a component (recursive)
     */
    getComponentDependencies(componentName: string): Promise<string[]>;
    /**
     * Recursively collect all dependencies
     */
    private collectDependencies;
    /**
     * Get all npm dependencies for a component and its dependencies
     */
    getAllNpmDependencies(componentName: string): Promise<string[]>;
    /**
     * Get all files needed for a component and its dependencies
     */
    getAllComponentFiles(componentName: string): Promise<ComponentFile[]>;
    /**
     * Validate that all component dependencies exist in the registry
     */
    validateComponentDependencies(componentName: string): Promise<{
        valid: boolean;
        missing: string[];
    }>;
    /**
     * Get component statistics
     */
    getRegistryStats(): Promise<{
        totalComponents: number;
        totalUtils: number;
        componentsWithDependencies: number;
        averageDependencies: number;
    }>;
    /**
     * Get components sorted by popularity (number of dependents)
     */
    getComponentsByPopularity(): Promise<Array<{
        name: string;
        dependents: number;
    }>>;
    /**
     * Check if a component has circular dependencies
     */
    hasCircularDependencies(componentName: string): Promise<boolean>;
    /**
     * Detect circular dependencies using DFS
     */
    private detectCircularDependency;
    /**
     * Clear the registry cache
     */
    clearCache(): void;
}
//# sourceMappingURL=registry-utils.d.ts.map