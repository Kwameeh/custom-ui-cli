import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InitCommand } from '../init';
import { ProjectDetector } from '../../utils/project-detector';
import { ConfigManager } from '../../utils/config-manager';
import { FileOperations } from '../../utils/file-operations';

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
  let initCommand: InitCommand;
  let tempDir: string;
  let mockSpinner: any;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    initCommand = new InitCommand();
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
        type: 'nextjs' as const,
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

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock config manager
      const mockConfigManager = {
        exists: jest.fn().mockReturnValue(false),
        write: jest.fn(),
        createDirectories: jest.fn(),
        getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
      };

      (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager as any);

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
      (FileOperations.writeFile as jest.Mock).mockResolvedValue(undefined);
      (FileOperations.checkFileConflict as jest.Mock).mockReturnValue({ exists: false, isDirectory: false });

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
        type: 'vite' as const,
        hasTypeScript: false,
        hasTailwind: true,
        packageJsonPath: path.join(tempDir, 'package.json'),
        rootDir: tempDir
      };

      const mockConfig = {
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'tailwind' as const,
        typescript: false,
        projectType: 'vite' as const
      };

      const mockDetector = {
        detect: jest.fn().mockResolvedValue(mockDetection),
        createDefaultConfig: jest.fn().mockReturnValue(mockConfig)
      };

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock config manager with existing config
      const mockConfigManager = {
        exists: jest.fn().mockReturnValue(true),
        backup: jest.fn().mockReturnValue('backup-path'),
        write: jest.fn(),
        createDirectories: jest.fn(),
        getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
      };

      (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager as any);

      // Mock inquirer prompts
      mockInquirer.prompt.mockResolvedValueOnce({
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'tailwind'
      });

      // Mock file operations
      (FileOperations.writeFile as jest.Mock).mockResolvedValue(undefined);
      (FileOperations.checkFileConflict as jest.Mock).mockReturnValue({ exists: true, isDirectory: false });

      // Execute command with force flag
      await initCommand.execute(['--force', '--skip-deps']);

      // Verify backup was created
      expect(mockConfigManager.backup).toHaveBeenCalled();
      expect(mockConfigManager.write).toHaveBeenCalled();
    });

    it('should prompt for overwrite when config exists without force flag', async () => {
      // Mock project detection
      const mockDetection = {
        type: 'cra' as const,
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

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock config manager with existing config
      const mockConfigManager = {
        exists: jest.fn().mockReturnValue(true),
        write: jest.fn(),
        createDirectories: jest.fn(),
        getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
      };

      (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager as any);

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
        type: 'generic' as const,
        hasTypeScript: false,
        hasTailwind: false,
        packageJsonPath: path.join(tempDir, 'package.json'),
        rootDir: tempDir
      };

      const mockConfig = {
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'css-modules' as const,
        typescript: false,
        projectType: 'generic' as const
      };

      const mockDetector = {
        detect: jest.fn().mockResolvedValue(mockDetection),
        createDefaultConfig: jest.fn().mockReturnValue(mockConfig)
      };

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock config manager
      const mockConfigManager = {
        exists: jest.fn().mockReturnValue(false),
        write: jest.fn(),
        createDirectories: jest.fn(),
        getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
      };

      (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager as any);

      // Mock inquirer prompts
      mockInquirer.prompt.mockResolvedValueOnce({
        componentsDir: 'custom/components',
        utilsDir: 'custom/utils',
        cssFramework: 'styled-components'
      });

      // Mock file operations
      (FileOperations.writeFile as jest.Mock).mockResolvedValue(undefined);
      (FileOperations.checkFileConflict as jest.Mock).mockReturnValue({ exists: false, isDirectory: false });

      // Execute command with custom directories
      await initCommand.execute([
        '--components-dir', 'custom/components',
        '--utils-dir', 'custom/utils',
        '--skip-deps'
      ]);

      // Verify custom configuration was used
      expect(mockConfigManager.write).toHaveBeenCalledWith(
        expect.objectContaining({
          componentsDir: 'custom/components',
          utilsDir: 'custom/utils'
        }),
        true
      );
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
        type: 'nextjs' as const,
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

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock config manager
      const mockConfigManager = {
        exists: jest.fn().mockReturnValue(false),
        write: jest.fn(),
        createDirectories: jest.fn(),
        getConfigPath: jest.fn().mockReturnValue(path.join(tempDir, 'custom-ui.json'))
      };

      (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager as any);

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
      (FileOperations.writeFile as jest.Mock).mockResolvedValue(undefined);
      (FileOperations.checkFileConflict as jest.Mock).mockReturnValue({ exists: false, isDirectory: false });

      // Execute command without skip-deps
      await initCommand.execute([]);

      // Verify npm install was called
      expect(mockSpawn).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['install', '--save-dev']),
        expect.objectContaining({ cwd: tempDir })
      );
    });

    it.skip('should handle project detection errors', async () => {
      // Mock project detector to throw error
      const mockDetector = {
        detect: jest.fn().mockRejectedValue(new Error('No package.json found'))
      };

      (ProjectDetector as jest.MockedClass<typeof ProjectDetector>).mockImplementation(() => mockDetector as any);

      // Mock process.exit to prevent test from actually exiting
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        // Don't actually exit, just return undefined to satisfy TypeScript
        return undefined as never;
      });

      // Mock console.error to capture error output
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      try {
        // Execute command - it should call process.exit but not actually exit
        await initCommand.execute(['--skip-deps']);

        // Verify error handling
        expect(mockConsoleError).toHaveBeenCalledWith(
          expect.stringContaining('Project detection failed')
        );
        expect(mockExit).toHaveBeenCalledWith(1);
      } finally {
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
        const realInitCommand = new InitCommand();

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
      } finally {
        // Restore original directory and console
        process.chdir(originalCwd);
        mockConsoleLog.mockRestore();
      }
    });
  });
});