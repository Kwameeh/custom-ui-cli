import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager, CONFIG_FILENAME } from '../config-manager';
import { ProjectConfig, CLIError, ERROR_CODES } from '../../types';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockProjectRoot: string;
  let mockConfigPath: string;

  const validConfig: ProjectConfig = {
    componentsDir: 'components/ui',
    utilsDir: 'lib',
    cssFramework: 'tailwind',
    typescript: true,
    projectType: 'nextjs'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectRoot = '/mock/project';
    mockConfigPath = path.join(mockProjectRoot, CONFIG_FILENAME);
    configManager = new ConfigManager(mockProjectRoot);
  });

  describe('exists()', () => {
    it('should return true when config file exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      expect(configManager.exists()).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith(mockConfigPath);
    });

    it('should return false when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(configManager.exists()).toBe(false);
    });
  });

  describe('read()', () => {
    it('should read and parse valid configuration', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      const result = configManager.read();

      expect(result).toEqual(validConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('should throw error when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configManager.read()).toThrow(CLIError);
      expect(() => configManager.read()).toThrow('Configuration file not found');
    });

    it('should throw error when config file contains invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      expect(() => configManager.read()).toThrow(CLIError);
      expect(() => configManager.read()).toThrow('Failed to read configuration file');
    });

    it('should throw error when config is missing required fields', () => {
      const invalidConfig = { componentsDir: 'components' }; // missing other fields
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      expect(() => configManager.read()).toThrow('Missing required field');
    });

    it('should throw error when config has invalid field types', () => {
      const invalidConfig = { ...validConfig, typescript: 'yes' }; // should be boolean
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      expect(() => configManager.read()).toThrow('typescript must be a boolean');
    });

    it('should throw error when cssFramework is invalid', () => {
      const invalidConfig = { ...validConfig, cssFramework: 'invalid' };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      expect(() => configManager.read()).toThrow('cssFramework must be one of');
    });

    it('should throw error when projectType is invalid', () => {
      const invalidConfig = { ...validConfig, projectType: 'invalid' };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      expect(() => configManager.read()).toThrow('projectType must be one of');
    });
  });

  describe('write()', () => {
    it('should write valid configuration to file', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation();

      configManager.write(validConfig);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(validConfig, null, 2),
        'utf-8'
      );
    });

    it('should throw error when file exists and overwrite is false', () => {
      mockFs.existsSync.mockReturnValue(true);

      expect(() => configManager.write(validConfig)).toThrow(CLIError);
      expect(() => configManager.write(validConfig)).toThrow('Configuration file already exists');
    });

    it('should overwrite when file exists and overwrite is true', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation();

      configManager.write(validConfig, true);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw error when write fails', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => configManager.write(validConfig)).toThrow(CLIError);
      expect(() => configManager.write(validConfig)).toThrow('Failed to write configuration file');
    });
  });

  describe('update()', () => {
    it('should update existing configuration', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
      mockFs.writeFileSync.mockImplementation();

      const updates = { componentsDir: 'src/components' };
      const result = configManager.update(updates);

      expect(result.componentsDir).toBe('src/components');
      expect(result.utilsDir).toBe(validConfig.utilsDir); // unchanged
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('getComponentsPath()', () => {
    it('should return absolute path to components directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      const result = configManager.getComponentsPath();

      expect(result).toBe(path.resolve(mockProjectRoot, validConfig.componentsDir));
    });
  });

  describe('getUtilsPath()', () => {
    it('should return absolute path to utils directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      const result = configManager.getUtilsPath();

      expect(result).toBe(path.resolve(mockProjectRoot, validConfig.utilsDir));
    });
  });

  describe('createDirectories()', () => {
    it('should create components and utils directories', () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr === mockConfigPath) return true;
        return false; // directories don't exist
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
      mockFs.mkdirSync.mockImplementation();

      configManager.createDirectories();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.resolve(mockProjectRoot, validConfig.componentsDir),
        { recursive: true }
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.resolve(mockProjectRoot, validConfig.utilsDir),
        { recursive: true }
      );
    });

    it('should not create directories if they already exist', () => {
      mockFs.existsSync.mockReturnValue(true); // all paths exist
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      configManager.createDirectories();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('backup()', () => {
    it('should create backup of existing config file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation();

      const backupPath = configManager.backup();

      expect(backupPath).toContain(`${CONFIG_FILENAME}.backup.`);
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(mockConfigPath, backupPath);
    });

    it('should throw error when no config file exists', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configManager.backup()).toThrow(CLIError);
      expect(() => configManager.backup()).toThrow('No configuration file to backup');
    });
  });

  describe('restore()', () => {
    it('should restore config from backup', () => {
      const backupPath = '/mock/backup.json';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation();

      configManager.restore(backupPath);

      expect(mockFs.copyFileSync).toHaveBeenCalledWith(backupPath, mockConfigPath);
    });

    it('should throw error when backup file does not exist', () => {
      const backupPath = '/mock/backup.json';
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configManager.restore(backupPath)).toThrow(CLIError);
      expect(() => configManager.restore(backupPath)).toThrow('Backup file not found');
    });
  });
});