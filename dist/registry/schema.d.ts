/**
 * Schema definitions and validation for the component registry
 */
export interface ComponentFile {
    path: string;
    content: string;
    type: 'component' | 'utility' | 'type';
}
export interface ComponentMetadata {
    name: string;
    description: string;
    dependencies: string[];
    files: ComponentFile[];
    npmDependencies: string[];
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
export interface ComponentRegistry {
    components: Record<string, RegistryComponent>;
    utils?: Record<string, ComponentFile>;
    version?: string;
    lastUpdated?: string;
}
/**
 * Validates a component file structure
 */
export declare function validateComponentFile(file: ComponentFile): string[];
/**
 * Validates component metadata
 */
export declare function validateComponentMetadata(metadata: ComponentMetadata): string[];
/**
 * Validates a registry component
 */
export declare function validateRegistryComponent(component: RegistryComponent): string[];
/**
 * Validates the entire component registry
 */
export declare function validateRegistry(registry: ComponentRegistry): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validates that required npm dependencies are present
 */
export declare function validateNpmDependencies(component: RegistryComponent): string[];
//# sourceMappingURL=schema.d.ts.map