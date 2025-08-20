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
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const init_1 = require("../init");
const project_detector_1 = require("../../utils/project-detector");
const config_manager_1 = require("../../utils/config-manager");
const file_operations_1 = require("../../utils/file-operations");
// Mock dependencies
jest.mock('inquirer');
jest.mock('ora');
jest.mock('child_process');
jest.mock('../../utils/project-detector');
jest.mock('../../utils/config-manager');
jest.mock('../../utils/file-operations');
const mockInquirer = require('inquirer');
const mockOra = require('ora');
const mockSpawn = require('child_process').spawn;
describe('InitCommand', () => {
    let initCommand;
    let tempDir;
    let mockSpinner;
    let mockConsoleLog;
    beforeEach(() => {
        initCommand = new init_1.InitCommand();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'));
        // Mock console to reduce test noise
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        // Setup ora mock
        mockSpinner = {
            start: jest.fn().mockReturnThis(),
            succeed: jest.fn().mockReturnThis(),
            fail: jest.fn().mockReturnThis()
        };
        mockOra.mockReturnValue(mockSpinner);
        // Setup spawn mock
        mockSpawn.mockImplementation(() => ({
            on: jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
            })
        }));
        // Reset all mocks
        jest.clearAllMocks();
    });
    afterEach(() => {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        // Restore console
        mockConsoleLog.mockRestore();
    });
    describe('execute', () => {
        it('should initialize project with default configuration', async () => {
            // Mock project detection
            const mockDetection = {
                type: 'nextjs',
                hasTypeScript: true,
                hasTailwind: false,
                packageJsonPath: path.join(tempDir, 'package.json'),
                rootDir: tempDir
            };
            const mockDetector = {
                detect: jest.fn().mockResolvedValue(mockDetection),
                createDefaultConfig: jest.fn().mockReturnValue({
                    componentsDir: 'components/ui',
                    utilsDir: 'lib',
                    cssFramework: 'tailwind',
                    typescript: true,
                    projectType: 'nextjs'
                })
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock config manager
            const mockConfigManager = {
                exists: jest.fn().mockReturnValue(false),
                write: jest.fn(),
                createDirectories: jest.fn(),
                getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
            };
            config_manager_1.ConfigManager.mockImplementation(() => mockConfigManager);
            // Mock inquirer prompts
            mockInquirer.prompt
                .mockResolvedValueOnce({
                componentsDir: 'components/ui',
                utilsDir: 'lib',
                cssFramework: 'tailwind'
            })
                .mockResolvedValueOnce({
                shouldInstall: false // Skip dependency installation for test
            });
            // Mock file operations
            file_operations_1.FileOperations.writeFile.mockResolvedValue(undefined);
            file_operations_1.FileOperations.checkFileConflict.mockReturnValue({ exists: false, isDirectory: false });
            // Execute command
            await initCommand.execute(['--skip-deps']);
            // Verify project detection was called
            expect(mockDetector.detect).toHaveBeenCalled();
            expect(mockDetector.createDefaultConfig).toHaveBeenCalledWith(mockDetection);
            // Verify configuration was written
            expect(mockConfigManager.write).toHaveBeenCalled();
            expect(mockConfigManager.createDirectories).toHaveBeenCalled();
            // Verify spinners were used
            expect(mockSpinner.start).toHaveBeenCalled();
            expect(mockSpinner.succeed).toHaveBeenCalled();
        });
        it('should handle existing configuration with force flag', async () => {
            // Mock project detection
            const mockDetection = {
                type: 'vite',
                hasTypeScript: false,
                hasTailwind: true,
                packageJsonPath: path.join(tempDir, 'package.json'),
                rootDir: tempDir
            };
            const mockConfig = {
                componentsDir: 'src/components/ui',
                utilsDir: 'src/lib',
                cssFramework: 'tailwind',
                typescript: false,
                projectType: 'vite'
            };
            const mockDetector = {
                detect: jest.fn().mockResolvedValue(mockDetection),
                createDefaultConfig: jest.fn().mockReturnValue(mockConfig)
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock config manager with existing config
            const mockConfigManager = {
                exists: jest.fn().mockReturnValue(true),
                backup: jest.fn().mockReturnValue('backup-path'),
                write: jest.fn(),
                createDirectories: jest.fn(),
                getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
            };
            config_manager_1.ConfigManager.mockImplementation(() => mockConfigManager);
            // Mock inquirer prompts
            mockInquirer.prompt.mockResolvedValueOnce({
                componentsDir: 'src/components/ui',
                utilsDir: 'src/lib',
                cssFramework: 'tailwind'
            });
            // Mock file operations
            file_operations_1.FileOperations.writeFile.mockResolvedValue(undefined);
            file_operations_1.FileOperations.checkFileConflict.mockReturnValue({ exists: true, isDirectory: false });
            // Execute command with force flag
            await initCommand.execute(['--force', '--skip-deps']);
            // Verify backup was created
            expect(mockConfigManager.backup).toHaveBeenCalled();
            expect(mockConfigManager.write).toHaveBeenCalled();
        });
        it('should prompt for overwrite when config exists without force flag', async () => {
            // Mock project detection
            const mockDetection = {
                type: 'cra',
                hasTypeScript: true,
                hasTailwind: false,
                packageJsonPath: path.join(tempDir, 'package.json'),
                rootDir: tempDir
            };
            const mockDetector = {
                detect: jest.fn().mockResolvedValue(mockDetection),
                createDefaultConfig: jest.fn().mockReturnValue({
                    componentsDir: 'src/components/ui',
                    utilsDir: 'src/lib',
                    cssFramework: 'css-modules',
                    typescript: true,
                    projectType: 'cra'
                })
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock config manager with existing config
            const mockConfigManager = {
                exists: jest.fn().mockReturnValue(true),
                write: jest.fn(),
                createDirectories: jest.fn(),
                getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
            };
            config_manager_1.ConfigManager.mockImplementation(() => mockConfigManager);
            // Mock inquirer prompts - user chooses not to overwrite
            mockInquirer.prompt.mockResolvedValueOnce({
                shouldContinue: false
            });
            // Execute command
            await initCommand.execute(['--skip-deps']);
            // Verify configuration was not written
            expect(mockConfigManager.write).not.toHaveBeenCalled();
        });
        it('should handle custom directory options', async () => {
            // Mock project detection
            const mockDetection = {
                type: 'generic',
                hasTypeScript: false,
                hasTailwind: false,
                packageJsonPath: path.join(tempDir, 'package.json'),
                rootDir: tempDir
            };
            const mockConfig = {
                componentsDir: 'src/components/ui',
                utilsDir: 'src/lib',
                cssFramework: 'css-modules',
                typescript: false,
                projectType: 'generic'
            };
            const mockDetector = {
                detect: jest.fn().mockResolvedValue(mockDetection),
                createDefaultConfig: jest.fn().mockReturnValue(mockConfig)
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock config manager
            const mockConfigManager = {
                exists: jest.fn().mockReturnValue(false),
                write: jest.fn(),
                createDirectories: jest.fn(),
                getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
            };
            config_manager_1.ConfigManager.mockImplementation(() => mockConfigManager);
            // Mock inquirer prompts
            mockInquirer.prompt.mockResolvedValueOnce({
                componentsDir: 'custom/components',
                utilsDir: 'custom/utils',
                cssFramework: 'styled-components'
            });
            // Mock file operations
            file_operations_1.FileOperations.writeFile.mockResolvedValue(undefined);
            file_operations_1.FileOperations.checkFileConflict.mockReturnValue({ exists: false, isDirectory: false });
            // Execute command with custom directories
            await initCommand.execute([
                '--components-dir', 'custom/components',
                '--utils-dir', 'custom/utils',
                '--skip-deps'
            ]);
            // Verify custom configuration was used
            expect(mockConfigManager.write).toHaveBeenCalledWith(expect.objectContaining({
                componentsDir: 'custom/components',
                utilsDir: 'custom/utils'
            }), true);
        });
        it('should handle dependency installation', async () => {
            // Create a real package.json for dependency checking
            const packageJsonPath = path.join(tempDir, 'package.json');
            fs.writeFileSync(packageJsonPath, JSON.stringify({
                name: 'test-project',
                dependencies: {
                    react: '^18.0.0'
                },
                devDependencies: {}
            }));
            // Mock project detection
            const mockDetection = {
                type: 'nextjs',
                hasTypeScript: false,
                hasTailwind: false,
                packageJsonPath,
                rootDir: tempDir
            };
            const mockDetector = {
                detect: jest.fn().mockResolvedValue(mockDetection),
                createDefaultConfig: jest.fn().mockReturnValue({
                    componentsDir: 'components/ui',
                    utilsDir: 'lib',
                    cssFramework: 'tailwind',
                    typescript: false,
                    projectType: 'nextjs'
                })
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock config manager
            const mockConfigManager = {
                exists: jest.fn().mockReturnValue(false),
                write: jest.fn(),
                createDirectories: jest.fn(),
                getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
            };
            config_manager_1.ConfigManager.mockImplementation(() => mockConfigManager);
            // Mock inquirer prompts
            mockInquirer.prompt
                .mockResolvedValueOnce({
                componentsDir: 'components/ui',
                utilsDir: 'lib',
                cssFramework: 'tailwind'
            })
                .mockResolvedValueOnce({
                shouldInstall: true
            });
            // Mock file operations
            file_operations_1.FileOperations.writeFile.mockResolvedValue(undefined);
            file_operations_1.FileOperations.checkFileConflict.mockReturnValue({ exists: false, isDirectory: false });
            // Execute command without skip-deps
            await initCommand.execute([]);
            // Verify npm install was called
            expect(mockSpawn).toHaveBeenCalledWith('npm', expect.arrayContaining(['install', '--save-dev']), expect.objectContaining({ cwd: tempDir }));
        });
        it.skip('should handle project detection errors', async () => {
            // Mock project detector to throw error
            const mockDetector = {
                detect: jest.fn().mockRejectedValue(new Error('No package.json found'))
            };
            project_detector_1.ProjectDetector.mockImplementation(() => mockDetector);
            // Mock process.exit to prevent test from actually exiting
            const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
                // Don't actually exit, just return undefined to satisfy TypeScript
                return undefined;
            });
            // Mock console.error to capture error output
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
            try {
                // Execute command - it should call process.exit but not actually exit
                await initCommand.execute(['--skip-deps']);
                // Verify error handling
                expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Project detection failed'));
                expect(mockExit).toHaveBeenCalledWith(1);
            }
            finally {
                // Restore mocks
                mockExit.mockRestore();
                mockConsoleError.mockRestore();
            }
        });
    });
    describe('integration with real file system', () => {
        it('should create actual files and directories', async () => {
            // Create a real package.json
            const packageJsonPath = path.join(tempDir, 'package.json');
            fs.writeFileSync(packageJsonPath, JSON.stringify({
                name: 'test-project',
                dependencies: { react: '^18.0.0' }
            }));
            // Mock console methods to reduce noise
            const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
            // Change to temp directory for this test
            const originalCwd = process.cwd();
            process.chdir(tempDir);
            try {
                // Use real implementations for this test
                jest.unmock('../../utils/project-detector');
                jest.unmock('../../utils/config-manager');
                jest.unmock('../../utils/file-operations');
                const { ProjectDetector } = require('../../utils/project-detector');
                const { ConfigManager } = require('../../utils/config-manager');
                // Mock only the interactive parts
                mockInquirer.prompt
                    .mockResolvedValueOnce({
                    componentsDir: 'components/ui',
                    utilsDir: 'lib',
                    cssFramework: 'tailwind'
                });
                // Create init command with real dependencies
                const realInitCommand = new init_1.InitCommand();
                // Execute command
                await realInitCommand.execute(['--skip-deps']);
                // Verify files were created
                expect(fs.existsSync(path.join(tempDir, 'custom-ui.json'))).toBe(true);
                expect(fs.existsSync(path.join(tempDir, 'components', 'ui'))).toBe(true);
                expect(fs.existsSync(path.join(tempDir, 'lib'))).toBe(true);
                expect(fs.existsSync(path.join(tempDir, 'lib', 'utils.ts'))).toBe(true);
                // Verify configuration content
                const configContent = fs.readFileSync(path.join(tempDir, 'custom-ui.json'), 'utf-8');
                const config = JSON.parse(configContent);
                expect(config.componentsDir).toBe('components/ui');
                expect(config.utilsDir).toBe('lib');
                expect(config.cssFramework).toBe('tailwind');
            }
            finally {
                // Restore original directory and console
                process.chdir(originalCwd);
                mockConsoleLog.mockRestore();
            }
        });
    });
});
//# sourceMappingURL=init.test.js.map