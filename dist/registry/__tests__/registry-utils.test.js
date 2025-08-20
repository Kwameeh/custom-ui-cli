"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_utils_1 = require("../registry-utils");
const registry_loader_1 = require("../registry-loader");
// Mock the RegistryLoader
jest.mock('../registry-loader');
const MockedRegistryLoader = registry_loader_1.RegistryLoader;
describe('RegistryUtils', () => {
    let registryUtils;
    let mockLoader;
    beforeEach(() => {
        jest.clearAllMocks();
        mockLoader = new MockedRegistryLoader();
        registryUtils = new registry_utils_1.RegistryUtils();
        // Replace the internal loader with our mock
        registryUtils.loader = mockLoader;
    });
    const mockComponents = {
        button: {
            metadata: {
                name: 'Button',
                description: 'A customizable button component',
                dependencies: [],
                files: [],
                npmDependencies: ['react'],
            },
            component: { path: 'button.tsx', content: 'button content' },
        },
        input: {
            metadata: {
                name: 'Input',
                description: 'An input field component',
                dependencies: ['button'],
                files: [],
                npmDependencies: ['react', 'clsx'],
            },
            component: { path: 'input.tsx', content: 'input content' },
        },
        form: {
            metadata: {
                name: 'Form',
                description: 'A form wrapper component',
                dependencies: ['input', 'button'],
                files: [],
                npmDependencies: ['react', 'react-hook-form'],
            },
            component: { path: 'form.tsx', content: 'form content' },
        },
    };
    describe('searchComponents', () => {
        beforeEach(() => {
            mockLoader.getAllComponents.mockResolvedValue(mockComponents);
        });
        it('should find components by name', async () => {
            const results = await registryUtils.searchComponents('button');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('button');
        });
        it('should find components by description', async () => {
            const results = await registryUtils.searchComponents('customizable');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('button');
        });
        it('should return empty array when no matches found', async () => {
            const results = await registryUtils.searchComponents('nonexistent');
            expect(results).toHaveLength(0);
        });
        it('should be case insensitive', async () => {
            const results = await registryUtils.searchComponents('BUTTON');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('button');
        });
    });
    describe('getComponentDependents', () => {
        beforeEach(() => {
            mockLoader.getAllComponents.mockResolvedValue(mockComponents);
        });
        it('should find components that depend on button', async () => {
            const dependents = await registryUtils.getComponentDependents('button');
            expect(dependents).toContain('input');
            expect(dependents).toContain('form');
            expect(dependents).toHaveLength(2);
        });
        it('should find components that depend on input', async () => {
            const dependents = await registryUtils.getComponentDependents('input');
            expect(dependents).toContain('form');
            expect(dependents).toHaveLength(1);
        });
        it('should return empty array for component with no dependents', async () => {
            const dependents = await registryUtils.getComponentDependents('form');
            expect(dependents).toHaveLength(0);
        });
    });
    describe('getComponentDependencies', () => {
        beforeEach(() => {
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(mockComponents[name] || null));
        });
        it('should return empty array for component with no dependencies', async () => {
            const dependencies = await registryUtils.getComponentDependencies('button');
            expect(dependencies).toHaveLength(0);
        });
        it('should return direct dependencies', async () => {
            const dependencies = await registryUtils.getComponentDependencies('input');
            expect(dependencies).toContain('button');
            expect(dependencies).toHaveLength(1);
        });
        it('should return recursive dependencies', async () => {
            const dependencies = await registryUtils.getComponentDependencies('form');
            expect(dependencies).toContain('input');
            expect(dependencies).toContain('button');
            expect(dependencies).toHaveLength(2);
        });
        it('should handle circular dependencies gracefully', async () => {
            // Create circular dependency: a -> b -> a
            const circularComponents = {
                a: {
                    metadata: {
                        name: 'A',
                        description: 'Component A',
                        dependencies: ['b'],
                        files: [],
                        npmDependencies: [],
                    },
                    component: { path: 'a.tsx', content: 'a content' },
                },
                b: {
                    metadata: {
                        name: 'B',
                        description: 'Component B',
                        dependencies: ['a'],
                        files: [],
                        npmDependencies: [],
                    },
                    component: { path: 'b.tsx', content: 'b content' },
                },
            };
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(circularComponents[name] || null));
            const dependencies = await registryUtils.getComponentDependencies('a');
            expect(dependencies).toContain('b');
            // In circular dependencies, we might get both components, but the important thing is that it doesn't infinite loop
            expect(dependencies.length).toBeGreaterThanOrEqual(1);
            expect(dependencies.length).toBeLessThanOrEqual(2);
        });
    });
    describe('getAllNpmDependencies', () => {
        beforeEach(() => {
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(mockComponents[name] || null));
        });
        it('should return npm dependencies for component and its dependencies', async () => {
            const npmDeps = await registryUtils.getAllNpmDependencies('form');
            expect(npmDeps).toContain('react');
            expect(npmDeps).toContain('clsx');
            expect(npmDeps).toContain('react-hook-form');
            expect(npmDeps).toHaveLength(3);
        });
        it('should deduplicate npm dependencies', async () => {
            const npmDeps = await registryUtils.getAllNpmDependencies('input');
            expect(npmDeps).toContain('react');
            expect(npmDeps).toContain('clsx');
            expect(npmDeps).toHaveLength(2);
        });
    });
    describe('getAllComponentFiles', () => {
        beforeEach(() => {
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(mockComponents[name] || null));
        });
        it('should return all files for component and its dependencies', async () => {
            const files = await registryUtils.getAllComponentFiles('form');
            expect(files).toHaveLength(3); // form, input, button
            expect(files.map(f => f.path)).toContain('form.tsx');
            expect(files.map(f => f.path)).toContain('input.tsx');
            expect(files.map(f => f.path)).toContain('button.tsx');
        });
        it('should deduplicate files with same path', async () => {
            const files = await registryUtils.getAllComponentFiles('input');
            expect(files).toHaveLength(2); // input, button
            expect(files.map(f => f.path)).toContain('input.tsx');
            expect(files.map(f => f.path)).toContain('button.tsx');
        });
    });
    describe('validateComponentDependencies', () => {
        beforeEach(() => {
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(mockComponents[name] || null));
            mockLoader.getAllComponents.mockResolvedValue(mockComponents);
        });
        it('should return valid for component with existing dependencies', async () => {
            const result = await registryUtils.validateComponentDependencies('form');
            expect(result.valid).toBe(true);
            expect(result.missing).toHaveLength(0);
        });
        it('should return invalid for component with missing dependencies', async () => {
            const componentWithMissingDep = {
                metadata: {
                    name: 'Test',
                    description: 'Test component',
                    dependencies: ['nonexistent'],
                    files: [],
                    npmDependencies: [],
                },
                component: { path: 'test.tsx', content: 'test content' },
            };
            mockLoader.getComponent.mockImplementation((name) => {
                if (name === 'test')
                    return Promise.resolve(componentWithMissingDep);
                return Promise.resolve(mockComponents[name] || null);
            });
            const result = await registryUtils.validateComponentDependencies('test');
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('nonexistent');
        });
        it('should return invalid for nonexistent component', async () => {
            const result = await registryUtils.validateComponentDependencies('nonexistent');
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('nonexistent');
        });
    });
    describe('getRegistryStats', () => {
        beforeEach(() => {
            mockLoader.loadRegistry.mockResolvedValue({
                components: mockComponents,
                utils: {
                    cn: { path: 'utils.ts', content: 'utils', description: 'Utils' },
                    helper: { path: 'helper.ts', content: 'helper', description: 'Helper' },
                },
            });
        });
        it('should return correct registry statistics', async () => {
            const stats = await registryUtils.getRegistryStats();
            expect(stats.totalComponents).toBe(3);
            expect(stats.totalUtils).toBe(2);
            expect(stats.componentsWithDependencies).toBe(2); // input and form have dependencies
            expect(stats.averageDependencies).toBe(1); // (0 + 1 + 2) / 3 = 1
        });
    });
    describe('getComponentsByPopularity', () => {
        beforeEach(() => {
            mockLoader.getComponentNames.mockResolvedValue(['button', 'input', 'form']);
            mockLoader.getAllComponents.mockResolvedValue(mockComponents);
        });
        it('should return components sorted by number of dependents', async () => {
            const popularity = await registryUtils.getComponentsByPopularity();
            expect(popularity).toHaveLength(3);
            expect(popularity[0].name).toBe('button'); // Most popular (2 dependents)
            expect(popularity[0].dependents).toBe(2);
            expect(popularity[1].name).toBe('input'); // Second (1 dependent)
            expect(popularity[1].dependents).toBe(1);
            expect(popularity[2].name).toBe('form'); // Least popular (0 dependents)
            expect(popularity[2].dependents).toBe(0);
        });
    });
    describe('hasCircularDependencies', () => {
        it('should detect circular dependencies', async () => {
            const circularComponents = {
                a: {
                    metadata: {
                        name: 'A',
                        description: 'Component A',
                        dependencies: ['b'],
                        files: [],
                        npmDependencies: [],
                    },
                    component: { path: 'a.tsx', content: 'a content' },
                },
                b: {
                    metadata: {
                        name: 'B',
                        description: 'Component B',
                        dependencies: ['a'],
                        files: [],
                        npmDependencies: [],
                    },
                    component: { path: 'b.tsx', content: 'b content' },
                },
            };
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(circularComponents[name] || null));
            const hasCircular = await registryUtils.hasCircularDependencies('a');
            expect(hasCircular).toBe(true);
        });
        it('should return false for components without circular dependencies', async () => {
            mockLoader.getComponent
                .mockImplementation((name) => Promise.resolve(mockComponents[name] || null));
            const hasCircular = await registryUtils.hasCircularDependencies('form');
            expect(hasCircular).toBe(false);
        });
    });
    describe('clearCache', () => {
        it('should call clearCache on the loader', () => {
            registryUtils.clearCache();
            expect(mockLoader.clearCache).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=registry-utils.test.js.map