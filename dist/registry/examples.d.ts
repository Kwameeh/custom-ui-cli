/**
 * Comprehensive usage examples and documentation for components
 */
export interface ComponentExample {
    title: string;
    description: string;
    code: string;
    props?: Record<string, string>;
}
export interface ComponentDocumentation {
    name: string;
    description: string;
    props: Record<string, {
        type: string;
        description: string;
        default?: string;
        required?: boolean;
    }>;
    examples: ComponentExample[];
    dependencies: string[];
    installation: string;
}
export declare const componentDocs: Record<string, ComponentDocumentation>;
//# sourceMappingURL=examples.d.ts.map