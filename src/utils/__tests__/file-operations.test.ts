import * as fs from 'fs';
import * as path from 'path';
import { FileOperations, WriteFileOptions } from '../file-operations';
import { CLIError, ERROR_CODES } from '../../types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
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
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('FileOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('writeFile()', () => {
    const filePath = '/mock/test.txt';
    const content = 'test content';

    it('should write file when it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      await FileOperations.writeFile(filePath, content);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
    });

    it('should create directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      await FileOperations.writeFile(filePath, content);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(filePath),
        { recursive: true }
      );
    });

    it('should throw error when file exists and overwrite is false', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await expect(FileOperations.writeFile(filePath, content)).rejects.toThrow(CLIError);
      await expect(FileOperations.writeFile(filePath, content)).rejects.toThrow('File already exists');
    });

    it('should overwrite when file exists and overwrite is true', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation();

      const options: WriteFileOptions = { overwrite: true };
      await FileOperations.writeFile(filePath, content, options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
    });

    it('should create backup when requested and file exists', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      const options: WriteFileOptions = { overwrite: true, createBackup: true };
      await FileOperations.writeFile(filePath, content, options);

      expect(mockFs.copyFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should use custom encoding when specified', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      const options: WriteFileOptions = { encoding: 'ascii' };
      await FileOperations.writeFile(filePath, content, options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'ascii');
    });

    it('should throw error when write fails', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await expect(FileOperations.writeFile(filePath, content)).rejects.toThrow(CLIError);
      await expect(FileOperations.writeFile(filePath, content)).rejects.toThrow('Failed to write file');
    });
  });

  describe('copyFile()', () => {
    const sourcePath = '/mock/source.txt';
    const targetPath = '/mock/target.txt';

    it('should copy file successfully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        return pathStr === sourcePath; // source exists, target doesn't
      });
      mockFs.readFileSync.mockReturnValue('file content');
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      await FileOperations.copyFile(sourcePath, targetPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(sourcePath, 'utf-8');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(targetPath, 'file content', 'utf-8');
    });

    it('should throw error when source file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(FileOperations.copyFile(sourcePath, targetPath)).rejects.toThrow(CLIError);
      await expect(FileOperations.copyFile(sourcePath, targetPath)).rejects.toThrow('Source file not found');
    });
  });

  describe('createBackup()', () => {
    const filePath = '/mock/test.txt';

    it('should create backup with timestamp', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation();

      const backupPath = await FileOperations.createBackup(filePath);

      expect(backupPath).toContain('.backup.');
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(filePath, backupPath);
    });

    it('should throw error when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(FileOperations.createBackup(filePath)).rejects.toThrow(CLIError);
      await expect(FileOperations.createBackup(filePath)).rejects.toThrow('File not found for backup');
    });

    it('should throw error when backup fails', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation(() => {
        throw new Error('Copy failed');
      });

      await expect(FileOperations.createBackup(filePath)).rejects.toThrow(CLIError);
      await expect(FileOperations.createBackup(filePath)).rejects.toThrow('Failed to create backup');
    });
  });

  describe('ensureDirectory()', () => {
    const dirPath = '/mock/directory';

    it('should create directory when it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();

      await FileOperations.ensureDirectory(dirPath);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should not create directory when it already exists', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await FileOperations.ensureDirectory(dirPath);

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should throw error when directory creation fails', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Creation failed');
      });

      await expect(FileOperations.ensureDirectory(dirPath)).rejects.toThrow(CLIError);
      await expect(FileOperations.ensureDirectory(dirPath)).rejects.toThrow('Failed to create directory');
    });
  });

  describe('checkFileConflict()', () => {
    const filePath = '/mock/test.txt';

    it('should return exists false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = FileOperations.checkFileConflict(filePath);

      expect(result.exists).toBe(false);
      expect(result.isDirectory).toBe(false);
    });

    it('should return file information when file exists', () => {
      const mockStats = {
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2023-01-01')
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = FileOperations.checkFileConflict(filePath);

      expect(result.exists).toBe(true);
      expect(result.isDirectory).toBe(false);
      expect(result.size).toBe(1024);
      expect(result.modified).toEqual(new Date('2023-01-01'));
    });

    it('should detect directories', () => {
      const mockStats = {
        isDirectory: () => true,
        size: 0,
        mtime: new Date('2023-01-01')
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = FileOperations.checkFileConflict(filePath);

      expect(result.isDirectory).toBe(true);
    });
  });

  describe('deleteFile()', () => {
    const filePath = '/mock/test.txt';

    it('should delete file successfully', async () => {
      const mockStats = { isDirectory: () => false };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.unlinkSync.mockImplementation();

      await FileOperations.deleteFile(filePath);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(filePath);
    });

    it('should delete directory recursively when specified', async () => {
      const mockStats = { isDirectory: () => true };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.rmSync.mockImplementation();

      await FileOperations.deleteFile(filePath, true);

      expect(mockFs.rmSync).toHaveBeenCalledWith(filePath, { recursive: true, force: true });
    });

    it('should not throw error when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(FileOperations.deleteFile(filePath)).resolves.not.toThrow();
    });

    it('should throw error when deletion fails', async () => {
      const mockStats = { isDirectory: () => false };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await expect(FileOperations.deleteFile(filePath)).rejects.toThrow(CLIError);
      await expect(FileOperations.deleteFile(filePath)).rejects.toThrow('Failed to delete');
    });
  });

  describe('readFile()', () => {
    const filePath = '/mock/test.txt';

    it('should read file successfully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('file content');

      const result = await FileOperations.readFile(filePath);

      expect(result).toBe('file content');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw error when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(FileOperations.readFile(filePath)).rejects.toThrow(CLIError);
      await expect(FileOperations.readFile(filePath)).rejects.toThrow('File not found');
    });

    it('should use custom encoding when specified', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('file content');

      await FileOperations.readFile(filePath, 'ascii');

      expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'ascii');
    });
  });

  describe('validatePath()', () => {
    const basePath = '/mock/project';

    it('should return true for valid paths within base', () => {
      const validPath = 'components/button.tsx';
      const result = FileOperations.validatePath(validPath, basePath);

      expect(result).toBe(true);
    });

    it('should return false for path traversal attempts', () => {
      const maliciousPath = '../../../etc/passwd';
      const result = FileOperations.validatePath(maliciousPath, basePath);

      expect(result).toBe(false);
    });

    it('should return true for absolute paths within base', () => {
      const absolutePath = path.join(basePath, 'components/button.tsx');
      const result = FileOperations.validatePath(absolutePath, basePath);

      expect(result).toBe(true);
    });
  });
});