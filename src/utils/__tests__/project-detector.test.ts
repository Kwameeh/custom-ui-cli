import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector, ProjectType } from '../project-detector';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ProjectDetector', () => {
  let detector: ProjectDetector;
  let mockProjectRoot: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectRoot = '/mock/project';
    detector = new ProjectDetector(mockProjectRoot);
  });

  describe('detect()', () => {
    it('should detect Next.js project with next dependency', async () => {
      const packageJson = {
        dependencies: { next: '^13.0.0', react: '^18.0.0' },
        devDependencies: { typescript: '^4.0.0' }
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        if (pathStr === path.join(mockProjectRoot, 'tsconfig.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('nextjs');
      expect(result.hasTypeScript).toBe(true);
      expect(result.hasTailwind).toBe(false);
    });

    it('should detect Next.js project with next.config.js', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        if (pathStr === path.join(mockProjectRoot, 'next.config.js')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('nextjs');
    });

    it('should detect Vite project with vite dependency', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^4.0.0', '@vitejs/plugin-react': '^3.0.0' }
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('vite');
    });

    it('should detect Vite project with vite.config.ts', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        if (pathStr === path.join(mockProjectRoot, 'vite.config.ts')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('vite');
    });

    it('should detect Create React App project', async () => {
      const packageJson = {
        dependencies: { 
          react: '^18.0.0',
          'react-scripts': '^5.0.0'
        },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('cra');
    });

    it('should detect generic React project', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.type).toBe('generic');
    });

    it('should detect TypeScript from tsconfig.json', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        if (pathStr === path.join(mockProjectRoot, 'tsconfig.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.hasTypeScript).toBe(true);
    });

    it('should detect TypeScript from typescript dependency', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^4.0.0' }
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.hasTypeScript).toBe(true);
    });

    it('should detect Tailwind CSS from dependency', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { tailwindcss: '^3.0.0' }
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.hasTailwind).toBe(true);
    });

    it('should detect Tailwind CSS from config file', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join(mockProjectRoot, 'package.json')) return true;
        if (pathStr === path.join(mockProjectRoot, 'tailwind.config.js')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const result = await detector.detect();

      expect(result.hasTailwind).toBe(true);
    });

    it('should throw error when no package.json found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(detector.detect()).rejects.toThrow(
        'No package.json found in current directory or parent directories'
      );
    });

    it('should throw error when package.json is invalid JSON', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        return pathStr === path.join(mockProjectRoot, 'package.json');
      });

      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(detector.detect()).rejects.toThrow('Failed to read package.json');
    });
  });

  describe('createDefaultConfig()', () => {
    it('should create Next.js app router config', () => {
      const detection = {
        type: 'nextjs' as ProjectType,
        hasTypeScript: true,
        hasTailwind: true,
        packageJsonPath: '/mock/package.json',
        rootDir: '/mock'
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        return pathStr === path.join('/mock', 'app');
      });

      const config = detector.createDefaultConfig(detection);

      expect(config).toEqual({
        componentsDir: 'components/ui',
        utilsDir: 'lib',
        cssFramework: 'tailwind',
        typescript: true,
        projectType: 'nextjs'
      });
    });

    it('should create Vite project config', () => {
      const detection = {
        type: 'vite' as ProjectType,
        hasTypeScript: false,
        hasTailwind: false,
        packageJsonPath: '/mock/package.json',
        rootDir: '/mock'
      };

      const config = detector.createDefaultConfig(detection);

      expect(config).toEqual({
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'css-modules',
        typescript: false,
        projectType: 'vite'
      });
    });

    it('should create CRA project config', () => {
      const detection = {
        type: 'cra' as ProjectType,
        hasTypeScript: true,
        hasTailwind: false,
        packageJsonPath: '/mock/package.json',
        rootDir: '/mock'
      };

      const config = detector.createDefaultConfig(detection);

      expect(config).toEqual({
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'css-modules',
        typescript: true,
        projectType: 'cra'
      });
    });

    it('should create generic project config', () => {
      const detection = {
        type: 'generic' as ProjectType,
        hasTypeScript: false,
        hasTailwind: true,
        packageJsonPath: '/mock/package.json',
        rootDir: '/mock'
      };

      const config = detector.createDefaultConfig(detection);

      expect(config).toEqual({
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        cssFramework: 'tailwind',
        typescript: false,
        projectType: 'generic'
      });
    });
  });

  describe('findPackageJson()', () => {
    it('should find package.json in parent directories', async () => {
      const deepPath = '/mock/project/src/components';
      detector = new ProjectDetector(deepPath);

      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === path.join('/mock/project', 'package.json')) return true;
        return false;
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' }
      }));

      const result = await detector.detect();

      expect(result.packageJsonPath).toBe(path.join('/mock/project', 'package.json'));
      expect(result.rootDir).toBe(path.normalize('/mock/project'));
    });
  });
});