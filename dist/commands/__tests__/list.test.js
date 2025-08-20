"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../list");
// Mock dependencies
jest.mock('../../registry/registry-loader');
jest.mock('../../utils/error-handler');
jest.mock('../../utils/user-feedback');
describe('ListCommand', () => {
    let listCommand;
    let mockRegistryLoader;
    let mockFeedback;
    const mockComponents = {
        button: {
            metadata: {
                name: 'Button',
                description: 'A customizable button component',
                dependencies: [],
                files: [{ path: 'components/ui/button.tsx', content: '', type: 'component' }],
                npmDependencies: ['class-variance-authority']
            },
            component: {
                path: 'components/ui/button.tsx',
                content: ''
            }
        },
        input: {
            metadata: {
                name: 'Input',
                description: 'A form input component',
                dependencies: ['button'],
                files: [{ path: 'components/ui/input.tsx', content: '', type: 'component' }],
                npmDependencies: ['clsx']
            },
            component: {
                path: 'components/ui/input.tsx',
                content: ''
            }
        },
        card: {
            metadata: {
                name: 'Card',
                description: 'A card container component',
                dependencies: [],
                files: [
                    { path: 'components/ui/card.tsx', content: '', type: 'component' },
                    { path: 'lib/utils.ts', content: '', type: 'utility' }
                ],
                npmDependencies: []
            },
            component: {
                path: 'components/ui/card.tsx',
                content: ''
            }
        }
    };
    beforeEach(() => {
        // Create mocks
        mockRegistryLoader = {
            getAllComponents: jest.fn(),
            getComponent: jest.fn()
        };
        mockFeedback = {
            success: jest.fn(),
            error: jest.fn(),
            warning: jest.fn(),
            info: jest.fn(),
            progress: jest.fn()
        };
        // Create command with mocked dependencies
        listCommand = new list_1.ListCommand({
            registryLoader: mockRegistryLoader,
            feedback: mockFeedback
        });
        // Setup console.log spy
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    describe('execute', () => {
        it('should list all components successfully', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute([]);
            expect(mockRegistryLoader.getAllComponents).toHaveBeenCalled();
            expect(mockFeedback.info).toHaveBeenCalledWith('Loading component registry...');
            expect(mockFeedback.info).toHaveBeenCalledWith('\nFound 3 component(s)');
            expect(console.log).toHaveBeenCalledWith('\nAvailable Components:\n');
        });
        it('should handle empty registry', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue({});
            await listCommand.execute([]);
            expect(mockFeedback.warning).toHaveBeenCalledWith('No components found in registry');
        });
        it('should display components in compact format by default', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute([]);
            expect(console.log).toHaveBeenCalledWith('  button          - A customizable button component');
            expect(console.log).toHaveBeenCalledWith('  input           - A form input component');
            expect(console.log).toHaveBeenCalledWith('  card            - A card container component');
        });
        it('should display components in verbose format when requested', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--verbose']);
            expect(console.log).toHaveBeenCalledWith('📦 button');
            expect(console.log).toHaveBeenCalledWith('   Description: A customizable button component');
            expect(console.log).toHaveBeenCalledWith('   NPM Dependencies: class-variance-authority');
        });
        it('should filter components by search term', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--search', 'button']);
            // Should only show button component
            expect(console.log).toHaveBeenCalledWith('  button          - A customizable button component');
            expect(console.log).not.toHaveBeenCalledWith('  input           - A form input component');
            expect(mockFeedback.info).toHaveBeenCalledWith('\nFound 1 component(s)');
        });
        it('should handle search with no matches', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--search', 'nonexistent']);
            expect(mockFeedback.warning).toHaveBeenCalledWith('No components match the specified criteria');
        });
        it('should handle case-insensitive search', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--search', 'BUTTON']);
            expect(console.log).toHaveBeenCalledWith('  button          - A customizable button component');
            expect(mockFeedback.info).toHaveBeenCalledWith('\nFound 1 component(s)');
        });
        it('should search in component descriptions', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--search', 'form']);
            expect(console.log).toHaveBeenCalledWith('  input           - A form input component');
            expect(mockFeedback.info).toHaveBeenCalledWith('\nFound 1 component(s)');
        });
        it('should handle category filter (not implemented warning)', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute(['--category', 'forms']);
            expect(mockFeedback.warning).toHaveBeenCalledWith('Category filtering not yet implemented');
        });
        it('should handle registry loading errors', async () => {
            const error = new Error('Network error');
            mockRegistryLoader.getAllComponents.mockRejectedValue(error);
            await expect(listCommand.execute([])).rejects.toThrow();
            expect(mockFeedback.error).toHaveBeenCalled();
        });
        it('should show usage instructions after listing', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await listCommand.execute([]);
            expect(mockFeedback.info).toHaveBeenCalledWith('Use "custom-ui add <component>" to install a component');
            expect(mockFeedback.info).toHaveBeenCalledWith('Use "custom-ui docs <component>" to see documentation');
        });
    });
    describe('parseOptions', () => {
        it('should parse verbose flag', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions(['--verbose']);
            expect(options.verbose).toBe(true);
        });
        it('should parse short verbose flag', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions(['-v']);
            expect(options.verbose).toBe(true);
        });
        it('should parse search option', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions(['--search', 'button']);
            expect(options.search).toBe('button');
        });
        it('should parse category option', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions(['--category', 'forms']);
            expect(options.category).toBe('forms');
        });
        it('should handle multiple options', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions(['--verbose', '--search', 'test', '--category', 'ui']);
            expect(options.verbose).toBe(true);
            expect(options.search).toBe('test');
            expect(options.category).toBe('ui');
        });
        it('should handle empty arguments', () => {
            const command = new list_1.ListCommand();
            const options = command.parseOptions([]);
            expect(options).toEqual({});
        });
    });
    describe('filterComponents', () => {
        it('should return all components when no filters applied', () => {
            const command = new list_1.ListCommand();
            const filtered = command.filterComponents(mockComponents, {});
            expect(filtered).toEqual(mockComponents);
        });
        it('should filter by component name', () => {
            const command = new list_1.ListCommand();
            const filtered = command.filterComponents(mockComponents, { search: 'button' });
            expect(Object.keys(filtered)).toEqual(['button']);
        });
        it('should filter by description', () => {
            const command = new list_1.ListCommand();
            const filtered = command.filterComponents(mockComponents, { search: 'form' });
            expect(Object.keys(filtered)).toEqual(['input']);
        });
        it('should be case insensitive', () => {
            const command = new list_1.ListCommand();
            const filtered = command.filterComponents(mockComponents, { search: 'CARD' });
            expect(Object.keys(filtered)).toEqual(['card']);
        });
    });
    describe('displayComponents', () => {
        it('should display compact format by default', () => {
            const command = new list_1.ListCommand();
            command.displayComponents(mockComponents, {});
            expect(console.log).toHaveBeenCalledWith('\nAvailable Components:\n');
            expect(console.log).toHaveBeenCalledWith('  button          - A customizable button component');
        });
        it('should display verbose format when requested', () => {
            const command = new list_1.ListCommand();
            command.displayComponents(mockComponents, { verbose: true });
            expect(console.log).toHaveBeenCalledWith('📦 button');
            expect(console.log).toHaveBeenCalledWith('   Description: A customizable button component');
        });
    });
    describe('displayVerboseComponent', () => {
        it('should show all component details', () => {
            const command = new list_1.ListCommand();
            command.displayVerboseComponent('input', mockComponents.input);
            expect(console.log).toHaveBeenCalledWith('📦 input');
            expect(console.log).toHaveBeenCalledWith('   Description: A form input component');
            expect(console.log).toHaveBeenCalledWith('   Dependencies: button');
            expect(console.log).toHaveBeenCalledWith('   NPM Dependencies: clsx');
            expect(console.log).toHaveBeenCalledWith('   Files: 1 file(s)');
        });
        it('should handle components without dependencies', () => {
            const command = new list_1.ListCommand();
            command.displayVerboseComponent('button', mockComponents.button);
            expect(console.log).toHaveBeenCalledWith('📦 button');
            expect(console.log).toHaveBeenCalledWith('   Description: A customizable button component');
            expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Dependencies:'));
            expect(console.log).toHaveBeenCalledWith('   NPM Dependencies: class-variance-authority');
        });
    });
    describe('displayCompactComponent', () => {
        it('should format component name and description', () => {
            const command = new list_1.ListCommand();
            command.displayCompactComponent('button', mockComponents.button);
            expect(console.log).toHaveBeenCalledWith('  button          - A customizable button component');
        });
        it('should handle long component names', () => {
            const command = new list_1.ListCommand();
            command.displayCompactComponent('very-long-component-name', mockComponents.button);
            expect(console.log).toHaveBeenCalledWith('  very-long-component-name - A customizable button component');
        });
    });
});
//# sourceMappingURL=list.test.js.map