import * as fs from 'fs';
import * as path from 'path';
import { AddCommand } from '../add';
import { RegistryLoader } from '../../registry/registry-loader';
import { ConfigManager } from '../../utils/config-manager';
import { FileOperations } from '../../utils/file-operations';
import { DependencyManager } from '../../utils/dependency-manager';
import { CLIError, ERROR_CODES, ProjectConfig, RegistryComponent } from '../../types';
import { SilentFeedback } from '../../utils/user-feedback';

// Mock dependencies
jest.mock('fs');
jest.mock('../../utils/file-operations');
jest.mock('../../utils/dependency-manager');
jest.mock('../../registry/registry-loader');
jest.mock('../../utils/config-manager');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFileOperations = FileOperations as jest.MockedClass<typeof FileOperations>;
const mockDependencyManager = DependencyManager as jest.MockedClass<typeof DependencyManager>;
const mockRegistryLoader = RegistryLoader as jest.MockedClass<typeof RegistryLoader>;
const mockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;

describe('AddCommand', () => {
  let addCommand: AddCommand;
  let mockRegistryLoaderInstance: jest.Mocked<RegistryLoader>;
  let mockConfigManagerInstance: jest.Mocked<ConfigManager>;
  let mockDependencyManagerInstance: jest.Mocked<DependencyManager>;

  const mockConfig: ProjectConfig = {
    componentsDir: 'components/ui',
    utilsDir: 'lib',
    cssFramework: 'tailwind',
    typescript: true,
    projectType: 'nextjs'
  };

  const mockButtonComponent: RegistryComponent = {
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
    mockRegistryLoaderInstance = new mockRegistryLoader() as jest.Mocked<RegistryLoader>;
    mockConfigManagerInstance = new mockConfigManager('') as jest.Mocked<ConfigManager>;
    mockDependencyManagerInstance = new mockDependencyManager('') as jest.Mocked<DependencyManager>;

    addCommand = new AddCommand({
      registryLoader: mockRegistryLoaderInstance,
      configManager: mockConfigManagerInstance,
      feedback: new SilentFeedback()
    });

    // Setup default mocks
    mockConfigManagerInstance.read = jest.fn().mockReturnValue(mockConfig);
    
    // Mock static methods
    mockFileOperations.checkFileConflict = jest.fn().mockImplementation((filePath: string) => {
      // Mock package.json to exist by default
      if (filePath.includes('package.json')) {
        return { exists: true, isDirectory: false };
      }
      return { exists: false, isDirectory: false };
    });
    mockFileOperations.ensureDirectory = jest.fn().mockResolvedValue(undefined);
    mockFileOperations.writeFile = jest.fn().mockResolvedValue(undefined);
    
    // Mock DependencyManager constructor
    (DependencyManager as any).mockImplementation(() => mockDependencyManagerInstance);
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
      await expect(addCommand.execute([])).rejects.toThrow(
        expect.objectContaining({
          message: 'No component specified',
          code: ERROR_CODES.INVALID_COMMAND
        })
      );
    });

    it('should throw error when component is not found', async () => {
      // Mock the registry loader to throw an error that will be caught by NetworkErrorHandler
      mockRegistryLoaderInstance.getComponent.mockRejectedValue(new Error('Component not found'));

      await expect(addCommand.execute(['nonexistent'])).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to connect to component registry'),
          code: ERROR_CODES.NETWORK_ERROR
        })
      );
    });

    it('should throw error when project is not initialized', async () => {
      (mockConfigManagerInstance.read as jest.Mock).mockImplementation(() => {
        throw new Error('Config not found');
      });

      await expect(addCommand.execute(['button'])).rejects.toThrow(
        expect.objectContaining({
          message: 'Project not initialized or configuration is invalid',
          code: ERROR_CODES.CONFIG_ERROR
        })
      );
    });

    it('should successfully add a component', async () => {
      mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
      mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
        button: mockButtonComponent
      });

      await addCommand.execute(['button']);

      expect(mockRegistryLoaderInstance.getComponent).toHaveBeenCalledWith('button');
      expect(mockFileOperations.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/components[\/\\]ui[\/\\]button\.tsx$/),
        mockButtonComponent.component.content,
        expect.any(Object)
      );
      expect(mockDependencyManagerInstance.installDependencies).toHaveBeenCalledWith(
        ['@radix-ui/react-slot', 'class-variance-authority'],
        expect.any(Object)
      );
    });

    it('should handle component with dependencies', async () => {
      const mockCardComponent: RegistryComponent = {
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

      expect(mockDependencyManagerInstance.resolveDependencies).toHaveBeenCalledWith(
        ['card', 'button'],
        expect.any(Object)
      );
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

      expect(mockFileOperations.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/src[\/\\]components[\/\\]button\.tsx$/),
        mockButtonComponent.component.content,
        expect.any(Object)
      );
    });

    it('should handle file conflicts with force option', async () => {
      mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
      mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
        button: mockButtonComponent
      });
      (mockFileOperations.checkFileConflict as jest.Mock).mockReturnValue({
        exists: true,
        isDirectory: false,
        size: 100,
        modified: new Date()
      });

      await addCommand.execute(['button', '--force']);

      expect(mockFileOperations.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ overwrite: true })
      );
    });

    it('should create backups when --backup option is used', async () => {
      mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
      mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
        button: mockButtonComponent
      });
      (mockFileOperations.checkFileConflict as jest.Mock).mockReturnValue({
        exists: true,
        isDirectory: false,
        size: 100,
        modified: new Date()
      });

      await addCommand.execute(['button', '--backup']);

      expect(mockFileOperations.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ createBackup: true })
      );
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

      await expect(addCommand.execute(['button'])).rejects.toThrow(
        expect.objectContaining({
          message: 'Dependency version conflicts detected',
          code: ERROR_CODES.DEPENDENCY_CONFLICT
        })
      );
    });

    it('should install utilities when component has utils', async () => {
      mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
      mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
        button: mockButtonComponent
      });

      await addCommand.execute(['button']);

      expect(mockFileOperations.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/lib[\/\\]utils\.ts$/),
        'export const cn = () => {};',
        expect.any(Object)
      );
    });

    it('should validate project has package.json', async () => {
      mockRegistryLoaderInstance.getComponent.mockResolvedValue(mockButtonComponent);
      mockRegistryLoaderInstance.getAllComponents.mockResolvedValue({
        button: mockButtonComponent
      });
      (mockFileOperations.checkFileConflict as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return { exists: false, isDirectory: false };
        }
        return { exists: false, isDirectory: false };
      });

      await expect(addCommand.execute(['button'])).rejects.toThrow(
        expect.objectContaining({
          message: 'package.json not found in current directory',
          code: ERROR_CODES.INVALID_PROJECT
        })
      );
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

      expect(mockDependencyManagerInstance.installDependencies).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ silent: true })
      );
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