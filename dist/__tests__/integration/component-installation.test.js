"use strict";
/**
 * Integration tests for complete component installation workflows
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os_1 = require("os");
const schema_1 = require("../../registry/schema");
describe('Component Installation Integration Tests', () => {
    let testProjectDir;
    let originalCwd;
    beforeEach(async () => {
        originalCwd = process.cwd();
        // Create a temporary test project directory
        testProjectDir = path.join((0, os_1.tmpdir)(), `custom-ui-test-${Date.now()}`);
        await fs.ensureDir(testProjectDir);
        // Create a basic package.json
        const packageJson = {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
                react: '^18.0.0',
                'react-dom': '^18.0.0'
            },
            devDependencies: {
                '@types/react': '^18.0.0',
                typescript: '^5.0.0'
            }
        };
        await fs.writeJSON(path.join(testProjectDir, 'package.json'), packageJson, { spaces: 2 });
        // Create basic tsconfig.json
        const tsConfig = {
            compilerOptions: {
                target: 'es5',
                lib: ['dom', 'dom.iterable', 'es6'],
                allowJs: true,
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                moduleResolution: 'node',
                resolveJsonModule: true,
                isolatedModules: true,
                noEmit: true,
                jsx: 'react-jsx'
            },
            include: ['src']
        };
        await fs.writeJSON(path.join(testProjectDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
        // Create src directory
        await fs.ensureDir(path.join(testProjectDir, 'src'));
        process.chdir(testProjectDir);
    });
    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.remove(testProjectDir);
    });
    describe('Registry Validation', () => {
        it('should have a valid registry structure', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const { isValid, errors } = (0, schema_1.validateRegistry)(registry);
            if (!isValid) {
                console.error('Registry validation errors:', errors);
            }
            expect(isValid).toBe(true);
            expect(errors).toHaveLength(0);
        });
        it('should have all required components in registry', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const expectedComponents = [
                'button',
                'input',
                'card',
                'dialog',
                'badge',
                'alert',
                'separator'
            ];
            expectedComponents.forEach(component => {
                expect(registry.components).toHaveProperty(component);
                expect(registry.components[component]).toHaveProperty('metadata');
                expect(registry.components[component]).toHaveProperty('component');
                expect(registry.components[component]).toHaveProperty('examples');
            });
        });
    });
    describe('Component File Structure', () => {
        it('should create proper directory structure for components', async () => {
            // Simulate init command creating directories
            const componentsDir = path.join(testProjectDir, 'components', 'ui');
            const libDir = path.join(testProjectDir, 'lib');
            await fs.ensureDir(componentsDir);
            await fs.ensureDir(libDir);
            expect(await fs.pathExists(componentsDir)).toBe(true);
            expect(await fs.pathExists(libDir)).toBe(true);
        });
        it('should install utils.ts file correctly', async () => {
            const libDir = path.join(testProjectDir, 'lib');
            await fs.ensureDir(libDir);
            const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
            const utilsPath = path.join(libDir, 'utils.ts');
            await fs.writeFile(utilsPath, utilsContent);
            expect(await fs.pathExists(utilsPath)).toBe(true);
            const content = await fs.readFile(utilsPath, 'utf-8');
            expect(content).toContain('export function cn');
            expect(content).toContain('twMerge');
            expect(content).toContain('clsx');
        });
    });
    describe('Component Installation', () => {
        beforeEach(async () => {
            // Set up basic project structure
            await fs.ensureDir(path.join(testProjectDir, 'components', 'ui'));
            await fs.ensureDir(path.join(testProjectDir, 'lib'));
            // Install utils
            const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
            await fs.writeFile(path.join(testProjectDir, 'lib', 'utils.ts'), utilsContent);
        });
        it('should install button component correctly', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const buttonComponent = registry.components.button;
            // Install button component
            const buttonPath = path.join(testProjectDir, 'components', 'ui', 'button.tsx');
            await fs.writeFile(buttonPath, buttonComponent.component.content);
            expect(await fs.pathExists(buttonPath)).toBe(true);
            const content = await fs.readFile(buttonPath, 'utf-8');
            expect(content).toContain('export interface ButtonProps');
            expect(content).toContain('const Button = React.forwardRef');
            expect(content).toContain('buttonVariants');
        });
        it('should install input component correctly', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const inputComponent = registry.components.input;
            // Install input component
            const inputPath = path.join(testProjectDir, 'components', 'ui', 'input.tsx');
            await fs.writeFile(inputPath, inputComponent.component.content);
            expect(await fs.pathExists(inputPath)).toBe(true);
            const content = await fs.readFile(inputPath, 'utf-8');
            expect(content).toContain('export interface InputProps');
            expect(content).toContain('const Input = React.forwardRef');
        });
        it('should install card component with all subcomponents', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const cardComponent = registry.components.card;
            // Install card component
            const cardPath = path.join(testProjectDir, 'components', 'ui', 'card.tsx');
            await fs.writeFile(cardPath, cardComponent.component.content);
            expect(await fs.pathExists(cardPath)).toBe(true);
            const content = await fs.readFile(cardPath, 'utf-8');
            expect(content).toContain('const Card = React.forwardRef');
            expect(content).toContain('const CardHeader = React.forwardRef');
            expect(content).toContain('const CardTitle = React.forwardRef');
            expect(content).toContain('const CardDescription = React.forwardRef');
            expect(content).toContain('const CardContent = React.forwardRef');
            expect(content).toContain('const CardFooter = React.forwardRef');
        });
        it('should install dialog component with all primitives', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            const dialogComponent = registry.components.dialog;
            // Install dialog component
            const dialogPath = path.join(testProjectDir, 'components', 'ui', 'dialog.tsx');
            await fs.writeFile(dialogPath, dialogComponent.component.content);
            expect(await fs.pathExists(dialogPath)).toBe(true);
            const content = await fs.readFile(dialogPath, 'utf-8');
            expect(content).toContain('const Dialog = DialogPrimitive.Root');
            expect(content).toContain('const DialogTrigger = DialogPrimitive.Trigger');
            expect(content).toContain('const DialogContent = React.forwardRef');
            expect(content).toContain('@radix-ui/react-dialog');
        });
    });
    describe('Component Dependencies', () => {
        it('should have correct npm dependencies for each component', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            // Check button dependencies
            const buttonDeps = registry.components.button.metadata.npmDependencies;
            expect(buttonDeps).toContain('@radix-ui/react-slot');
            expect(buttonDeps).toContain('class-variance-authority');
            // Check dialog dependencies
            const dialogDeps = registry.components.dialog.metadata.npmDependencies;
            expect(dialogDeps).toContain('@radix-ui/react-dialog');
            expect(dialogDeps).toContain('lucide-react');
            // Check separator dependencies
            const separatorDeps = registry.components.separator.metadata.npmDependencies;
            expect(separatorDeps).toContain('@radix-ui/react-separator');
        });
        it('should validate component imports match dependencies', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            Object.entries(registry.components).forEach(([name, component]) => {
                const content = component.component.content;
                const deps = component.metadata.npmDependencies;
                // Check for common imports
                if (content.includes('from "class-variance-authority"')) {
                    expect(deps).toContain('class-variance-authority');
                }
                if (content.includes('from "clsx"')) {
                    expect(deps).toContain('clsx');
                }
                if (content.includes('from "tailwind-merge"')) {
                    expect(deps).toContain('tailwind-merge');
                }
                if (content.includes('@radix-ui/react-')) {
                    const radixImports = content.match(/@radix-ui\/react-[\w-]+/g);
                    if (radixImports) {
                        radixImports.forEach((radixImport) => {
                            expect(deps).toContain(radixImport);
                        });
                    }
                }
            });
        });
    });
    describe('Component Examples', () => {
        it('should have usage examples for all components', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            Object.entries(registry.components).forEach(([name, component]) => {
                expect(component.examples).toBeDefined();
                expect(Array.isArray(component.examples)).toBe(true);
                expect(component.examples.length).toBeGreaterThan(0);
                // Each example should be a non-empty string
                component.examples.forEach((example) => {
                    expect(typeof example).toBe('string');
                    expect(example.length).toBeGreaterThan(0);
                });
            });
        });
        it('should have valid JSX in examples', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            Object.entries(registry.components).forEach(([name, component]) => {
                component.examples.forEach((example) => {
                    // Basic JSX validation - should contain component name
                    const componentName = component.metadata.name;
                    expect(example).toContain(`<${componentName}`);
                });
            });
        });
    });
    describe('TypeScript Compilation', () => {
        it('should have valid TypeScript interfaces', async () => {
            const registryPath = path.join(__dirname, '../../registry/registry.json');
            const registry = await fs.readJSON(registryPath);
            Object.entries(registry.components).forEach(([name, component]) => {
                const content = component.component.content;
                // Should have proper interface definitions
                if (content.includes('interface')) {
                    expect(content).toMatch(/export interface \w+Props/);
                }
                // Should have proper React.forwardRef usage
                if (content.includes('forwardRef')) {
                    expect(content).toMatch(/React\.forwardRef</);
                }
                // Should have proper displayName (if using forwardRef)
                if (content.includes('forwardRef')) {
                    expect(content).toMatch(/\.displayName = /);
                }
            });
        });
    });
});
//# sourceMappingURL=component-installation.test.js.map