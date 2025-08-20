import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DependencyManager, PackageJson } from '../dependency-manager';
import { CLIError, ERROR_CODES } from '../../types';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('DependencyManager', () => {
  let dependencyManager: DependencyManager;
  const projectRoot = '/test/project';
  const packageJsonPath = path.join(projectRoot, 'package.json');

  const mockPackageJson: PackageJson = {
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
      'existing-dep': '1.0.0'
    },
    devDependencies: {
      'typescript': '^4.0.0'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dependencyManager = new DependencyManager(projectRoot);

    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
    mockFs.writeFileSync.mockImplementation();
    mockExecSync.mockImplementation();
  });

  describe('readPackageJson', () => {
    it('should read and parse package.json successfully', async () => {
      const result = await dependencyManager.readPackageJson();

      expect(mockFs.readFileSync).toHaveBeenCalledWith(packageJsonPath, 'utf-8');
      expect(result).toEqual(mockPackageJson);
    });

    it('should throw error when package.json does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(dependencyManager.readPackageJson()).rejects.toThrow(
        expect.objectContaining({
          message: 'package.json not found in project root',
          code: ERROR_CODES.INVALID_PROJECT
        })
      );
    });

    it('should throw error when package.json has invalid JSON', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(dependencyManager.readPackageJson()).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse package.json'),
          code: ERROR_CODES.INVALID_PROJECT
        })
      );
    });
  });

  describe('writePackageJson', () => {
    it('should write package.json with proper formatting', async () => {
      await dependencyManager.writePackageJson(mockPackageJson);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        packageJsonPath,
        JSON.stringify(mockPackageJson, null, 2) + '\n',
        'utf-8'
      );
    });

    it('should throw error when write fails', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await expect(dependencyManager.writePackageJson(mockPackageJson)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to write package.json'),
          code: ERROR_CODES.INVALID_PROJECT
        })
      );
    });
  });

  describe('checkDependencies', () => {
    it('should identify missing dependencies', async () => {
      const dependencies = ['new-dep', 'another-new-dep'];

      const result = await dependencyManager.checkDependencies(dependencies);

      expect(result.missing).toEqual(['new-dep', 'another-new-dep']);
      expect(result.existing).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('should identify existing dependencies', async () => {
      const dependencies = ['react', 'existing-dep'];

      const result = await dependencyManager.checkDependencies(dependencies);

      expect(result.missing).toEqual([]);
      expect(result.existing).toEqual(['react', 'existing-dep']);
      expect(result.conflicts).toEqual([]);
    });

    it('should identify version conflicts', async () => {
      const dependencies = ['existing-dep@2.0.0'];

      const result = await dependencyManager.checkDependencies(dependencies);

      expect(result.missing).toEqual([]);
      expect(result.existing).toEqual(['existing-dep']);
      expect(result.conflicts).toEqual([
        {
          name: 'existing-dep',
          installed: '1.0.0',
          required: '2.0.0'
        }
      ]);
    });

    it('should handle dependencies with @ in name (scoped packages)', async () => {
      const dependencies = ['@types/node', '@radix-ui/react-slot@1.0.0'];

      const result = await dependencyManager.checkDependencies(dependencies);

      expect(result.missing).toEqual(['@types/node', '@radix-ui/react-slot@1.0.0']);
    });

    it('should check dev dependencies', async () => {
      const dependencies = ['typescript'];

      const result = await dependencyManager.checkDependencies(dependencies);

      expect(result.existing).toEqual(['typescript']);
    });
  });

  describe('installDependencies', () => {
    it('should install dependencies with npm', async () => {
      const dependencies = ['new-dep', 'another-dep'];

      await dependencyManager.installDependencies(dependencies);

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install new-dep another-dep',
        expect.objectContaining({
          cwd: projectRoot,
          stdio: 'inherit'
        })
      );
    });

    it('should install dev dependencies', async () => {
      const dependencies = ['eslint'];

      await dependencyManager.installDependencies(dependencies, { dev: true });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install --save-dev eslint',
        expect.any(Object)
      );
    });

    it('should install exact versions', async () => {
      const dependencies = ['react@18.0.0'];

      await dependencyManager.installDependencies(dependencies, { exact: true });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install --save-exact react@18.0.0',
        expect.any(Object)
      );
    });

    it('should install silently', async () => {
      const dependencies = ['lodash'];

      await dependencyManager.installDependencies(dependencies, { silent: true });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install --silent lodash',
        expect.objectContaining({
          stdio: 'pipe'
        })
      );
    });

    it('should skip installation when no dependencies provided', async () => {
      await dependencyManager.installDependencies([]);

      expect(mockExecSync).not.toHaveBeenCalled();
    });

    it('should throw error when installation fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Installation failed');
      });

      await expect(
        dependencyManager.installDependencies(['failing-dep'])
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to install dependencies'),
          code: ERROR_CODES.NETWORK_ERROR
        })
      );
    });
  });

  describe('addDependenciesToPackageJson', () => {
    it('should add dependencies to package.json', async () => {
      const dependencies = ['new-dep@1.0.0', 'another-dep'];

      await dependencyManager.addDependenciesToPackageJson(dependencies);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        packageJsonPath,
        expect.stringContaining('"new-dep": "1.0.0"'),
        'utf-8'
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        packageJsonPath,
        expect.stringContaining('"another-dep": "^1.0.0"'),
        'utf-8'
      );
    });

    it('should add dev dependencies to package.json', async () => {
      const dependencies = ['jest'];

      await dependencyManager.addDependenciesToPackageJson(dependencies, { dev: true });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        packageJsonPath,
        expect.stringContaining('"devDependencies"'),
        'utf-8'
      );
    });

    it('should create dependencies object if it does not exist', async () => {
      const packageJsonWithoutDeps = { name: 'test', version: '1.0.0' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJsonWithoutDeps));

      await dependencyManager.addDependenciesToPackageJson(['new-dep']);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        packageJsonPath,
        expect.stringContaining('"dependencies"'),
        'utf-8'
      );
    });
  });

  describe('resolveDependencies', () => {
    it('should resolve dependencies without circular references', async () => {
      const componentDeps = ['button', 'card'];
      const availableComponents = {
        button: { dependencies: [] },
        card: { dependencies: ['button'] },
        dialog: { dependencies: ['button'] }
      };

      const result = await dependencyManager.resolveDependencies(
        componentDeps,
        availableComponents
      );

      expect(result).toEqual(['button', 'card']);
    });

    it('should resolve nested dependencies', async () => {
      const componentDeps = ['dialog'];
      const availableComponents = {
        button: { dependencies: [] },
        card: { dependencies: ['button'] },
        dialog: { dependencies: ['card'] }
      };

      const result = await dependencyManager.resolveDependencies(
        componentDeps,
        availableComponents
      );

      expect(result).toEqual(['button', 'card', 'dialog']);
    });

    it('should throw error for circular dependencies', async () => {
      const componentDeps = ['button'];
      const availableComponents = {
        button: { dependencies: ['card'] },
        card: { dependencies: ['button'] }
      };

      await expect(
        dependencyManager.resolveDependencies(componentDeps, availableComponents)
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Circular dependency detected'),
          code: ERROR_CODES.INVALID_PROJECT
        })
      );
    });

    it('should handle missing components gracefully', async () => {
      const componentDeps = ['button', 'nonexistent'];
      const availableComponents = {
        button: { dependencies: [] }
      };

      const result = await dependencyManager.resolveDependencies(
        componentDeps,
        availableComponents
      );

      expect(result).toEqual(['button']);
    });
  });

  describe('detectPackageManager', () => {
    it('should detect yarn when yarn.lock exists', () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('yarn.lock');
      });

      const result = dependencyManager.detectPackageManager();

      expect(result).toBe('yarn');
    });

    it('should detect pnpm when pnpm-lock.yaml exists', () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('pnpm-lock.yaml');
      });

      const result = dependencyManager.detectPackageManager();

      expect(result).toBe('pnpm');
    });

    it('should default to npm when no lock files exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = dependencyManager.detectPackageManager();

      expect(result).toBe('npm');
    });
  });

  describe('runInstall', () => {
    it('should run npm install by default', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await dependencyManager.runInstall();

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install',
        expect.objectContaining({
          cwd: projectRoot,
          stdio: 'inherit'
        })
      );
    });

    it('should run yarn install when yarn.lock exists', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('yarn.lock');
      });

      await dependencyManager.runInstall();

      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn install',
        expect.any(Object)
      );
    });

    it('should run pnpm install when pnpm-lock.yaml exists', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('pnpm-lock.yaml');
      });

      await dependencyManager.runInstall();

      expect(mockExecSync).toHaveBeenCalledWith(
        'pnpm install',
        expect.any(Object)
      );
    });

    it('should run silently when requested', async () => {
      mockFs.existsSync.mockReturnValue(false); // Ensure npm is detected

      await dependencyManager.runInstall(true);

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install --silent',
        expect.objectContaining({
          stdio: 'pipe'
        })
      );
    });

    it('should throw error when install fails', async () => {
      mockFs.existsSync.mockReturnValue(false); // Ensure npm is detected
      mockExecSync.mockImplementation(() => {
        throw new Error('Install failed');
      });

      await expect(dependencyManager.runInstall()).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to run npm install'),
          code: ERROR_CODES.NETWORK_ERROR
        })
      );
    });
  });
});