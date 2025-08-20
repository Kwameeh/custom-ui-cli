"use strict";
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
const fs = __importStar(require("fs"));
const add_1 = require("../add");
const registry_loader_1 = require("../../registry/registry-loader");
const config_manager_1 = require("../../utils/config-manager");
const file_operations_1 = require("../../utils/file-operations");
const dependency_manager_1 = require("../../utils/dependency-manager");
const types_1 = require("../../types");
const user_feedback_1 = require("../../utils/user-feedback");
// Mock dependencies
jest.mock('fs');
jest.mock('../../utils/file-operations');
jest.mock('../../utils/dependency-manager');
jest.mock('../../registry/registry-loader');
jest.mock('../../utils/config-manager');
const mockFs = fs;
const mockFileOperations = file_operations_1.FileOperations;
const mockDependencyManager = dependency_manager_1.DependencyManager;
const mockRegistryLoader = registry_loader_1.RegistryLoader;
const mockConfigManager = config_manager_1.ConfigManager;
describe('AddCommand', () => {
    let addCommand;
    let mockRegistryLoaderInstance;
    let mockConfigManagerInstance;
    let mockDependencyManagerInstance;
    const mockConfig = {
        componentsDir: 'components/ui',
        utilsDir: 'lib',
        cssFramework: 'tailwind',
        typescript: true,
        projectType: 'nextjs'
    };
    const mockButtonComponent = {
        metadata: {
            name: 'Button',
            description: 'A customizable button component',
            dependencies: [],
            files: [
                {
                    path: 'components/ui/button.tsx',
                    content: 'export const Button = () => <button>Click me</button>;',
                    type: 'component'
                }
            ],
            npmDependencies: ['@radix-ui/react-slot', 'class-variance-authority']
        },
        component: {
            path: 'components/ui/button.tsx',
            content: 'export const Button = () => <button>Click me</button>;'
        },
        utils: [
            {
                path: 'lib/utils.ts',
                content: 'export const cn = () => {};',
                type: 'utility'
            }
        ]
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mocked instances
        mockRegistryLoaderInstance = new mockRegistryLoader();
        mockConfigManagerInstance = new mockConfigManager('');
        mockDependencyManagerInstance = new mockDependencyManager('');
        addCommand = new add_1.AddCommand({
            registryLoader: mockRegistryLoaderInstance,
            configManager: mockConfigManagerInstance,
            feedback: new user_feedback_1.SilentFeedback()
        });
        // Setup default mocks
        mockConfigManagerInstance.read = jest.fn().mockReturnValue(mockConfig);
        // Mock static methods
        mockFileOperations.checkFileConflict = jest.fn().mockImplementation((filePath) => {
            // Mock package.json to exist by default
            if (filePath.includes('package.json')) {
                return { exists: true, isDirectory: false };
            }
            return { exists: false, isDirectory: false };
        });
        mockFileOperations.ensureDirectory = jest.fn().mockResolvedValue(undefined);
        mockFileOperations.writeFile = jest.fn().mockResolvedValue(undefined);
        // Mock DependencyManager constructor
        dependency_manager_1.DependencyManager.mockImplementation(() => mockDependencyManagerInstance);
        mockDependencyManagerInstance.resolveDependencies.mockResolvedValue(['button']);
        mockDependencyManagerInstance.checkDependencies.mockResolvedValue({
            missing: ['@radix-ui/react-slot', 'class-variance-authority'],
            existing: [],
            conflicts: []
        });
        mockDependencyManagerInstance.installDependencies.mockResolvedValue();
        // Mock console.log to avoid test output noise
        jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('execute', () => {
        it('should throw error when no component is specified', async () => {
            await expect(addCommand.execute([])).rejects.toThrow(expect.objectContaining({
                message: 'No component specified',
                code: types_1.ERROR_CODES.INVALID_COMMAND
            }));
        });
        it('should throw error when component is not found', async () => {
            // Mock the registry loader to throw an error that will be caught by NetworkErrorHandler
            mockRegistryLoaderInstance.getComponent.mockRejectedValue(new Error('Component not found'));
            await expect(addCommand.execute(['nonexistent'])).rejects.toThrow(expect.objectContaining({
                message: expect.stringContaining('Failed to connect to component registry'),
                code: types_1.ERROR_CODES.NETWORK_ERROR
            }));
        });
        it('should throw error when project is not initialized', async () => {
            mockConfigManagerInstance.read.mockImplementation(() => {
                throw new Error('Config not found');
            });
            await expect(addCommand.execute(['button'])).rejects.toThrow(expect.objectContaining({
                message: 'Project not initialized or configuration is invalid',
                code: types_1.ERROR_CODES.CONFIG_ERROR
            }));
        });
        it('should successfully add a component', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button']);
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button');
            expect(mockFileOperations.writeFile).toHaveBeenCalledWith(expect.stringMatching(/components[\/\\]ui[\/\\]button\.tsx$/), mockButtonComponent.component.content, expect.any(Object));
            expect(mockDependencyManagerInstance.installDependencies).toHaveBeenCalledWith(['@radix-ui/react-slot', 'class-variance-authority'], expect.any(Object));
        });
        it('should handle component with dependencies', async () => {
            const mockCardComponent = {
                ...mockButtonComponent,
                metadata: {
                    ...mockButtonComponent.metadata,
                    name: 'Card',
                    dependencies: ['button']
                }
            };
            mockRegistryLoaderInstance.getComponent
                .mockResolvedValueOnce(mockCardComponent)
                .mockResolvedValueOnce(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                card: mockCardComponent,
                button: mockButtonComponent
            });
            mockDependencyManagerInstance.resolveDependencies.mockResolvedValue(['button', 'card']);
            await addCommand.execute(['card']);
            expect(mockDependencyManagerInstance.resolveDependencies).toHaveBeenCalledWith(['card', 'button'], expect.any(Object));
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('card');
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button');
        });
        it('should handle multiple components', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', 'button2']);
            // Should be called 3 times: once for each component + once for dependency resolution
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button');
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button2');
        });
        it('should skip npm dependencies when --skip-deps is used', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', '--skip-deps']);
            expect(mockDependencyManagerInstance.installDependencies).not.toHaveBeenCalled();
        });
        it('should use custom components directory when specified', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', '--components-dir', 'src/components']);
            expect(mockFileOperations.writeFile).toHaveBeenCalledWith(expect.stringMatching(/src[\/\\]components[\/\\]button\.tsx$/), mockButtonComponent.component.content, expect.any(Object));
        });
        it('should handle file conflicts with force option', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            mockFileOperations.checkFileConflict.mockReturnValue({
                exists: true,
                isDirectory: false,
                size: 100,
                modified: new Date()
            });
            await addCommand.execute(['button', '--force']);
            expect(mockFileOperations.writeFile).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ overwrite: true }));
        });
        it('should create backups when --backup option is used', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            mockFileOperations.checkFileConflict.mockReturnValue({
                exists: true,
                isDirectory: false,
                size: 100,
                modified: new Date()
            });
            await addCommand.execute(['button', '--backup']);
            expect(mockFileOperations.writeFile).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ createBackup: true }));
        });
        it('should handle dependency version conflicts', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            mockDependencyManagerInstance.checkDependencies.mockResolvedValue({
                missing: [],
                existing: ['@radix-ui/react-slot'],
                conflicts: [
                    {
                        name: '@radix-ui/react-slot',
                        installed: '1.0.0',
                        required: '2.0.0'
                    }
                ]
            });
            await expect(addCommand.execute(['button'])).rejects.toThrow(expect.objectContaining({
                message: 'Dependency version conflicts detected',
                code: types_1.ERROR_CODES.DEPENDENCY_CONFLICT
            }));
        });
        it('should install utilities when component has utils', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button']);
            expect(mockFileOperations.writeFile).toHaveBeenCalledWith(expect.stringMatching(/lib[\/\\]utils\.ts$/), 'export const cn = () => {};', expect.any(Object));
        });
        it('should validate project has package.json', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            mockFileOperations.checkFileConflict.mockImplementation((filePath) => {
                if (filePath.includes('package.json')) {
                    return { exists: false, isDirectory: false };
                }
                return { exists: false, isDirectory: false };
            });
            await expect(addCommand.execute(['button'])).rejects.toThrow(expect.objectContaining({
                message: 'package.json not found in current directory',
                code: types_1.ERROR_CODES.INVALID_PROJECT
            }));
        });
    });
    describe('option parsing', () => {
        it('should parse force option', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', '--force']);
            await addCommand.execute(['button', '-f']);
            // Should not throw errors for existing files
            expect(mockFileOperations.writeFile).toHaveBeenCalledTimes(4); // 2 calls per execution (component + util)
        });
        it('should parse backup option', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', '--backup']);
            await addCommand.execute(['button', '-b']);
            expect(mockFileOperations.writeFile).toHaveBeenCalledTimes(4);
        });
        it('should parse silent option', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', '--silent']);
            await addCommand.execute(['button', '-s']);
            expect(mockDependencyManagerInstance.installDependencies).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ silent: true }));
        });
        it('should extract component names correctly', async () => {
            mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
            mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
                button: mockButtonComponent
            });
            await addCommand.execute(['button', 'card', '--force', '--components-dir', 'src/ui']);
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button');
            expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('card');
        });
    });
});
//# sourceMappingURL=add.test.js.map