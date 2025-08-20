"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryUtils = void 0;
const registry_loader_1 = require("./registry-loader");
class RegistryUtils {
    constructor(registryPath) {
        this.loader = new registry_loader_1.RegistryLoader(registryPath);
    }
    /**
     * Search components by name or description
     */
    async searchComponents(query) {
        const components = await this.loader.getAllComponents();
        const results = [];
        const lowerQuery = query.toLowerCase();
        for (const [name, component] of Object.entries(components)) {
            const nameMatch = name.toLowerCase().includes(lowerQuery);
            const descriptionMatch = component.metadata.description.toLowerCase().includes(lowerQuery);
            if (nameMatch || descriptionMatch) {
                results.push({ name, component });
            }
        }
        return results;
    }
    /**
     * Get components that depend on a specific component
     */
    async getComponentDependents(componentName) {
        const components = await this.loader.getAllComponents();
        const dependents = [];
        for (const [name, component] of Object.entries(components)) {
            if (component.metadata.dependencies.includes(componentName)) {
                dependents.push(name);
            }
        }
        return dependents;
    }
    /**
     * Get all dependencies for a component (recursive)
     */
    async getComponentDependencies(componentName) {
        const component = await this.loader.getComponent(componentName);
        if (!component) {
            return [];
        }
        const dependencies = new Set();
        const visited = new Set();
        await this.collectDependencies(componentName, dependencies, visited);
        return Array.from(dependencies);
    }
    /**
     * Recursively collect all dependencies
     */
    async collectDependencies(componentName, dependencies, visited) {
        if (visited.has(componentName)) {
            return; // Avoid circular dependencies
        }
        visited.add(componentName);
        const component = await this.loader.getComponent(componentName);
        if (!component) {
            return;
        }
        for (const dep of component.metadata.dependencies) {
            dependencies.add(dep);
            await this.collectDependencies(dep, dependencies, visited);
        }
    }
    /**
     * Get all npm dependencies for a component and its dependencies
     */
    async getAllNpmDependencies(componentName) {
        const dependencies = await this.getComponentDependencies(componentName);
        const allComponents = [componentName, ...dependencies];
        const npmDeps = new Set();
        for (const compName of allComponents) {
            const component = await this.loader.getComponent(compName);
            if (component) {
                component.metadata.npmDependencies.forEach(dep => npmDeps.add(dep));
            }
        }
        return Array.from(npmDeps);
    }
    /**
     * Get all files needed for a component and its dependencies
     */
    async getAllComponentFiles(componentName) {
        const dependencies = await this.getComponentDependencies(componentName);
        const allComponents = [componentName, ...dependencies];
        const files = [];
        const seenPaths = new Set();
        for (const compName of allComponents) {
            const component = await this.loader.getComponent(compName);
            if (component) {
                // Add main component file
                if (!seenPaths.has(component.component.path)) {
                    files.push({
                        path: component.component.path,
                        content: component.component.content,
                        type: 'component'
                    });
                    seenPaths.add(component.component.path);
                }
                // Add utility files
                if (component.utils) {
                    for (const util of component.utils) {
                        if (!seenPaths.has(util.path)) {
                            files.push(util);
                            seenPaths.add(util.path);
                        }
                    }
                }
                // Add type files
                if (component.types) {
                    for (const type of component.types) {
                        if (!seenPaths.has(type.path)) {
                            files.push(type);
                            seenPaths.add(type.path);
                        }
                    }
                }
                // Add files from metadata
                for (const file of component.metadata.files) {
                    if (!seenPaths.has(file.path)) {
                        files.push(file);
                        seenPaths.add(file.path);
                    }
                }
            }
        }
        return files;
    }
    /**
     * Validate that all component dependencies exist in the registry
     */
    async validateComponentDependencies(componentName) {
        const component = await this.loader.getComponent(componentName);
        if (!component) {
            return { valid: false, missing: [componentName] };
        }
        const missing = [];
        const allComponents = await this.loader.getAllComponents();
        for (const dep of component.metadata.dependencies) {
            if (!allComponents[dep]) {
                missing.push(dep);
            }
        }
        return { valid: missing.length === 0, missing };
    }
    /**
     * Get component statistics
     */
    async getRegistryStats() {
        const registry = await this.loader.loadRegistry();
        const components = Object.values(registry.components);
        const totalComponents = components.length;
        const totalUtils = Object.keys(registry.utils).length;
        const componentsWithDependencies = components.filter(c => c.metadata.dependencies.length > 0).length;
        const totalDependencies = components.reduce((sum, c) => sum + c.metadata.dependencies.length, 0);
        const averageDependencies = totalComponents > 0 ? totalDependencies / totalComponents : 0;
        return {
            totalComponents,
            totalUtils,
            componentsWithDependencies,
            averageDependencies: Math.round(averageDependencies * 100) / 100
        };
    }
    /**
     * Get components sorted by popularity (number of dependents)
     */
    async getComponentsByPopularity() {
        const componentNames = await this.loader.getComponentNames();
        const popularity = [];
        for (const name of componentNames) {
            const dependents = await this.getComponentDependents(name);
            popularity.push({ name, dependents: dependents.length });
        }
        return popularity.sort((a, b) => b.dependents - a.dependents);
    }
    /**
     * Check if a component has circular dependencies
     */
    async hasCircularDependencies(componentName) {
        const visited = new Set();
        const recursionStack = new Set();
        return await this.detectCircularDependency(componentName, visited, recursionStack);
    }
    /**
     * Detect circular dependencies using DFS
     */
    async detectCircularDependency(componentName, visited, recursionStack) {
        if (recursionStack.has(componentName)) {
            return true; // Circular dependency found
        }
        if (visited.has(componentName)) {
            return false; // Already processed
        }
        visited.add(componentName);
        recursionStack.add(componentName);
        const component = await this.loader.getComponent(componentName);
        if (component) {
            for (const dep of component.metadata.dependencies) {
                if (await this.detectCircularDependency(dep, visited, recursionStack)) {
                    return true;
                }
            }
        }
        recursionStack.delete(componentName);
        return false;
    }
    /**
     * Clear the registry cache
     */
    clearCache() {
        this.loader.clearCache();
    }
}
exports.RegistryUtils = RegistryUtils;
//# sourceMappingURL=registry-utils.js.map