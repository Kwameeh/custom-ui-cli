"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docs_1 = require("../docs");
// Mock dependencies
jest.mock('../../registry/registry-loader');
jest.mock('../../utils/error-handler');
jest.mock('../../utils/user-feedback');
describe('DocsCommand', () => {
    let docsCommand;
    let mockRegistryLoader;
    let mockFeedback;
    const mockComponent = {
        metadata: {
            name: 'Button',
            description: 'A customizable button component with variants',
            dependencies: ['utils'],
            files: [
                { path: 'components/ui/button.tsx', content: 'interface ButtonProps { variant?: string; }', type: 'component' },
                { path: 'lib/utils.ts', content: '', type: 'utility' }
            ],
            npmDependencies: ['class-variance-authority', 'clsx']
        },
        component: {
            path: 'components/ui/button.tsx',
            content: 'interface ButtonProps {\n  variant?: "default" | "destructive";\n  size?: "sm" | "lg";\n}'
        },
        examples: [
            'import { Button } from "@/components/ui/button"\n\n<Button variant="default">Click me</Button>'
        ]
    };
    const mockComponents = {
        button: mockComponent,
        input: {
            metadata: {
                name: 'Input',
                description: 'A form input component',
                dependencies: [],
                files: [],
                npmDependencies: []
            },
            component: {
                path: 'components/ui/input.tsx',
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
        docsCommand = new docs_1.DocsCommand({
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
        it('should show general help when no component specified', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await docsCommand.execute([]);
            expect(mockFeedback.info).toHaveBeenCalledWith('Component Documentation\n');
            expect(console.log).toHaveBeenCalledWith('Usage: custom-ui docs <component-name> [options]\n');
            expect(console.log).toHaveBeenCalledWith('Available components:');
            expect(console.log).toHaveBeenCalledWith('  button');
            expect(console.log).toHaveBeenCalledWith('  input');
        });
        it('should show component documentation successfully', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(mockComponent);
            await docsCommand.execute(['button']);
            expect(mockRegistryLoader.getComponent).toHaveBeenCalledWith('button');
            expect(mockFeedback.info).toHaveBeenCalledWith('Loading documentation for button...');
            expect(console.log).toHaveBeenCalledWith('\n📖 BUTTON COMPONENT\n');
            expect(console.log).toHaveBeenCalledWith('Description: A customizable button component with variants\n');
        });
        it('should handle component not found', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(null);
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await expect(docsCommand.execute(['nonexistent'])).rejects.toThrow();
            expect(mockFeedback.error).toHaveBeenCalled();
        });
        it('should show warning for multiple components', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(mockComponent);
            await docsCommand.execute(['button', 'input']);
            expect(mockFeedback.warning).toHaveBeenCalledWith('Multiple components specified. Showing documentation for the first one.');
            expect(mockRegistryLoader.getComponent).toHaveBeenCalledWith('button');
        });
        it('should handle registry loading errors', async () => {
            const error = new Error('Network error');
            mockRegistryLoader.getComponent.mockRejectedValue(error);
            await expect(docsCommand.execute(['button'])).rejects.toThrow();
            expect(mockFeedback.error).toHaveBeenCalled();
        });
    });
    describe('showComponentDocs', () => {
        it('should display text documentation by default', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(mockComponent);
            await docsCommand.showComponentDocs('button', {});
            expect(console.log).toHaveBeenCalledWith('\n📖 BUTTON COMPONENT\n');
            expect(console.log).toHaveBeenCalledWith('Description: A customizable button component with variants\n');
            expect(console.log).toHaveBeenCalledWith('Component Dependencies:');
            expect(console.log).toHaveBeenCalledWith('  - utils');
            expect(console.log).toHaveBeenCalledWith('NPM Dependencies:');
            expect(console.log).toHaveBeenCalledWith('  - class-variance-authority');
            expect(console.log).toHaveBeenCalledWith('  - clsx');
        });
        it('should display JSON documentation when requested', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(mockComponent);
            await docsCommand.showComponentDocs('button', { format: 'json' });
            const expectedJson = {
                name: 'button',
                description: 'A customizable button component with variants',
                dependencies: ['utils'],
                npmDependencies: ['class-variance-authority', 'clsx'],
                files: mockComponent.metadata.files,
                examples: mockComponent.examples,
                installation: 'custom-ui add button'
            };
            expect(console.log).toHaveBeenCalledWith(JSON.stringify(expectedJson, null, 2));
        });
        it('should show examples when available', async () => {
            mockRegistryLoader.getComponent.mockResolvedValue(mockComponent);
            await docsCommand.showComponentDocs('button', { examples: true });
            expect(console.log).toHaveBeenCalledWith('Usage Examples:\n');
            expect(console.log).toHaveBeenCalledWith('Example 1:');
            expect(console.log).toHaveBeenCalledWith('```tsx');
            expect(console.log).toHaveBeenCalledWith(mockComponent.examples[0]);
            expect(console.log).toHaveBeenCalledWith('```\n');
        });
    });
    describe('showGeneralHelp', () => {
        it('should show usage instructions', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue(mockComponents);
            await docsCommand.showGeneralHelp();
            expect(mockFeedback.info).toHaveBeenCalledWith('Component Documentation\n');
            expect(console.log).toHaveBeenCalledWith('Usage: custom-ui docs <component-name> [options]\n');
            expect(console.log).toHaveBeenCalledWith('Options:');
            expect(console.log).toHaveBeenCalledWith('Available components:');
        });
        it('should handle empty component list', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue({});
            await docsCommand.showGeneralHelp();
            expect(mockFeedback.warning).toHaveBeenCalledWith('No components available in registry');
        });
        it('should handle registry loading errors gracefully', async () => {
            mockRegistryLoader.getAllComponents.mockRejectedValue(new Error('Network error'));
            await docsCommand.showGeneralHelp();
            expect(mockFeedback.warning).toHaveBeenCalledWith('Could not load available components');
        });
    });
    describe('displayTextDocs', () => {
        it('should display complete component information', () => {
            docsCommand.displayTextDocs('button', mockComponent, {});
            expect(console.log).toHaveBeenCalledWith('\n📖 BUTTON COMPONENT\n');
            expect(console.log).toHaveBeenCalledWith('Description: A customizable button component with variants\n');
            expect(console.log).toHaveBeenCalledWith('Installation:');
            expect(console.log).toHaveBeenCalledWith('  custom-ui add button\n');
        });
        it('should show dependencies when present', () => {
            docsCommand.displayTextDocs('button', mockComponent, {});
            expect(console.log).toHaveBeenCalledWith('Component Dependencies:');
            expect(console.log).toHaveBeenCalledWith('  - utils');
            expect(console.log).toHaveBeenCalledWith('NPM Dependencies:');
            expect(console.log).toHaveBeenCalledWith('  - class-variance-authority');
        });
        it('should show files information', () => {
            docsCommand.displayTextDocs('button', mockComponent, {});
            expect(console.log).toHaveBeenCalledWith('Files:');
            expect(console.log).toHaveBeenCalledWith('  - components/ui/button.tsx (component)');
            expect(console.log).toHaveBeenCalledWith('  - lib/utils.ts (utility)');
        });
        it('should handle components without dependencies', () => {
            const componentWithoutDeps = {
                ...mockComponent,
                metadata: {
                    ...mockComponent.metadata,
                    dependencies: [],
                    npmDependencies: []
                }
            };
            docsCommand.displayTextDocs('button', componentWithoutDeps, {});
            expect(console.log).not.toHaveBeenCalledWith('Component Dependencies:');
            expect(console.log).not.toHaveBeenCalledWith('NPM Dependencies:');
        });
    });
    describe('displayJsonDocs', () => {
        it('should output valid JSON', () => {
            docsCommand.displayJsonDocs('button', mockComponent);
            const expectedJson = {
                name: 'button',
                description: 'A customizable button component with variants',
                dependencies: ['utils'],
                npmDependencies: ['class-variance-authority', 'clsx'],
                files: mockComponent.metadata.files,
                examples: mockComponent.examples,
                installation: 'custom-ui add button'
            };
            expect(console.log).toHaveBeenCalledWith(JSON.stringify(expectedJson, null, 2));
        });
    });
    describe('displayExamples', () => {
        it('should display provided examples', () => {
            docsCommand.displayExamples('button', mockComponent);
            expect(console.log).toHaveBeenCalledWith('Usage Examples:\n');
            expect(console.log).toHaveBeenCalledWith('Example 1:');
            expect(console.log).toHaveBeenCalledWith('```tsx');
            expect(console.log).toHaveBeenCalledWith(mockComponent.examples[0]);
            expect(console.log).toHaveBeenCalledWith('```\n');
        });
        it('should generate basic example when none provided', () => {
            const componentWithoutExamples = {
                ...mockComponent,
                examples: []
            };
            docsCommand.displayExamples('button', componentWithoutExamples);
            expect(console.log).toHaveBeenCalledWith('Basic Usage:');
            expect(console.log).toHaveBeenCalledWith('```tsx');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('import { Button }'));
        });
    });
    describe('extractPropsInterface', () => {
        it('should extract interface definitions', () => {
            const content = 'interface ButtonProps { variant?: string; size?: number; }';
            const result = docsCommand.extractPropsInterface(content);
            expect(result).toBe('interface ButtonProps { variant?: string; size?: number; }');
        });
        it('should extract type definitions', () => {
            const content = 'type ButtonProps = { variant?: string; };';
            const result = docsCommand.extractPropsInterface(content);
            expect(result).toBe('type ButtonProps = { variant?: string; };');
        });
        it('should return null when no props found', () => {
            const content = 'const Button = () => <button />';
            const result = docsCommand.extractPropsInterface(content);
            expect(result).toBeNull();
        });
    });
    describe('generateBasicExample', () => {
        it('should generate button example', () => {
            const example = docsCommand.generateBasicExample('button');
            expect(example).toContain('import { Button }');
            expect(example).toContain('<Button variant="default"');
            expect(example).toContain('Click me');
        });
        it('should generate input example', () => {
            const example = docsCommand.generateBasicExample('input');
            expect(example).toContain('import { Input }');
            expect(example).toContain('<Input');
            expect(example).toContain('placeholder="Enter text..."');
        });
        it('should generate card example', () => {
            const example = docsCommand.generateBasicExample('card');
            expect(example).toContain('import { Card, CardContent, CardDescription, CardHeader, CardTitle }');
            expect(example).toContain('<Card>');
            expect(example).toContain('<CardTitle>');
        });
        it('should generate generic example for unknown components', () => {
            const example = docsCommand.generateBasicExample('unknown');
            expect(example).toContain('import { Unknown }');
            expect(example).toContain('<Unknown />');
        });
    });
    describe('parseOptions', () => {
        it('should parse format option', () => {
            const options = docsCommand.parseOptions(['--format', 'json']);
            expect(options.format).toBe('json');
        });
        it('should parse examples flag', () => {
            const options = docsCommand.parseOptions(['--examples']);
            expect(options.examples).toBe(true);
        });
        it('should handle multiple options', () => {
            const options = docsCommand.parseOptions(['--format', 'text', '--examples']);
            expect(options.format).toBe('text');
            expect(options.examples).toBe(true);
        });
        it('should validate format option', () => {
            const options = docsCommand.parseOptions(['--format', 'invalid']);
            expect(options.format).toBeUndefined();
        });
    });
    describe('extractComponentNames', () => {
        it('should extract component names from arguments', () => {
            const names = docsCommand.extractComponentNames(['button', 'input']);
            expect(names).toEqual(['button', 'input']);
        });
        it('should ignore option flags', () => {
            const names = docsCommand.extractComponentNames(['button', '--format', 'json', 'input']);
            expect(names).toEqual(['button', 'input']);
        });
        it('should handle empty arguments', () => {
            const names = docsCommand.extractComponentNames([]);
            expect(names).toEqual([]);
        });
        it('should handle only options', () => {
            const names = docsCommand.extractComponentNames(['--format', 'json', '--examples']);
            expect(names).toEqual([]);
        });
    });
    describe('getAvailableComponentNames', () => {
        it('should return sorted component names', async () => {
            mockRegistryLoader.getAllComponents.mockResolvedValue({
                card: { metadata: { name: '', description: '', dependencies: [], files: [], npmDependencies: [] }, component: { path: '', content: '' } },
                button: { metadata: { name: '', description: '', dependencies: [], files: [], npmDependencies: [] }, component: { path: '', content: '' } },
                input: { metadata: { name: '', description: '', dependencies: [], files: [], npmDependencies: [] }, component: { path: '', content: '' } }
            });
            const names = await docsCommand.getAvailableComponentNames();
            expect(names).toEqual(['button', 'card', 'input']);
        });
        it('should handle registry errors', async () => {
            mockRegistryLoader.getAllComponents.mockRejectedValue(new Error('Network error'));
            const names = await docsCommand.getAvailableComponentNames();
            expect(names).toEqual([]);
        });
    });
});
//# sourceMappingURL=docs.test.js.map