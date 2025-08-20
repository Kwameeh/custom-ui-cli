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
const file_operations_1 = require("../file-operations");
const types_1 = require("../../types");
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
const node_test_3 = require("node:test");
// Mock fs module
jest.mock('fs');
const mockFs = fs;
(0, node_test_2.describe)('FileOperations', () => {
    (0, node_test_3.beforeEach)(() => {
        jest.clearAllMocks();
    });
    (0, node_test_2.describe)('writeFile()', () => {
        const filePath = '/mock/test.txt';
        const content = 'test content';
        (0, node_test_1.it)('should write file when it does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation();
            await file_operations_1.FileOperations.writeFile(filePath, content);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
        });
        (0, node_test_1.it)('should create directory if it does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation();
            await file_operations_1.FileOperations.writeFile(filePath, content);
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.dirname(filePath), { recursive: true });
        });
        (0, node_test_1.it)('should throw error when file exists and overwrite is false', async () => {
            mockFs.existsSync.mockReturnValue(true);
            await expect(file_operations_1.FileOperations.writeFile(filePath, content)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.writeFile(filePath, content)).rejects.toThrow('File already exists');
        });
        (0, node_test_1.it)('should overwrite when file exists and overwrite is true', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.writeFileSync.mockImplementation();
            const options = { overwrite: true };
            await file_operations_1.FileOperations.writeFile(filePath, content, options);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
        });
        (0, node_test_1.it)('should create backup when requested and file exists', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation();
            const options = { overwrite: true, createBackup: true };
            await file_operations_1.FileOperations.writeFile(filePath, content, options);
            expect(mockFs.copyFileSync).toHaveBeenCalled();
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });
        (0, node_test_1.it)('should use custom encoding when specified', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation();
            const options = { encoding: 'ascii' };
            await file_operations_1.FileOperations.writeFile(filePath, content, options);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'ascii');
        });
        (0, node_test_1.it)('should throw error when write fails', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });
            await expect(file_operations_1.FileOperations.writeFile(filePath, content)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.writeFile(filePath, content)).rejects.toThrow('Failed to write file');
        });
    });
    (0, node_test_2.describe)('copyFile()', () => {
        const sourcePath = '/mock/source.txt';
        const targetPath = '/mock/target.txt';
        (0, node_test_1.it)('should copy file successfully', async () => {
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === sourcePath; // source exists, target doesn't
            });
            mockFs.readFileSync.mockReturnValue('file content');
            mockFs.mkdirSync.mockImplementation();
            mockFs.writeFileSync.mockImplementation();
            await file_operations_1.FileOperations.copyFile(sourcePath, targetPath);
            expect(mockFs.readFileSync).toHaveBeenCalledWith(sourcePath, 'utf-8');
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(targetPath, 'file content', 'utf-8');
        });
        (0, node_test_1.it)('should throw error when source file does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(file_operations_1.FileOperations.copyFile(sourcePath, targetPath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.copyFile(sourcePath, targetPath)).rejects.toThrow('Source file not found');
        });
    });
    (0, node_test_2.describe)('createBackup()', () => {
        const filePath = '/mock/test.txt';
        (0, node_test_1.it)('should create backup with timestamp', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation();
            const backupPath = await file_operations_1.FileOperations.createBackup(filePath);
            expect(backupPath).toContain('.backup.');
            expect(mockFs.copyFileSync).toHaveBeenCalledWith(filePath, backupPath);
        });
        (0, node_test_1.it)('should throw error when file does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(file_operations_1.FileOperations.createBackup(filePath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.createBackup(filePath)).rejects.toThrow('File not found for backup');
        });
        (0, node_test_1.it)('should throw error when backup fails', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation(() => {
                throw new Error('Copy failed');
            });
            await expect(file_operations_1.FileOperations.createBackup(filePath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.createBackup(filePath)).rejects.toThrow('Failed to create backup');
        });
    });
    (0, node_test_2.describe)('ensureDirectory()', () => {
        const dirPath = '/mock/directory';
        (0, node_test_1.it)('should create directory when it does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation();
            await file_operations_1.FileOperations.ensureDirectory(dirPath);
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
        });
        (0, node_test_1.it)('should not create directory when it already exists', async () => {
            mockFs.existsSync.mockReturnValue(true);
            await file_operations_1.FileOperations.ensureDirectory(dirPath);
            expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        });
        (0, node_test_1.it)('should throw error when directory creation fails', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation(() => {
                throw new Error('Creation failed');
            });
            await expect(file_operations_1.FileOperations.ensureDirectory(dirPath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.ensureDirectory(dirPath)).rejects.toThrow('Failed to create directory');
        });
    });
    (0, node_test_2.describe)('checkFileConflict()', () => {
        const filePath = '/mock/test.txt';
        (0, node_test_1.it)('should return exists false when file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = file_operations_1.FileOperations.checkFileConflict(filePath);
            expect(result.exists).toBe(false);
            expect(result.isDirectory).toBe(false);
        });
        (0, node_test_1.it)('should return file information when file exists', () => {
            const mockStats = {
                isDirectory: () => false,
                size: 1024,
                mtime: new Date('2023-01-01')
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.statSync.mockReturnValue(mockStats);
            const result = file_operations_1.FileOperations.checkFileConflict(filePath);
            expect(result.exists).toBe(true);
            expect(result.isDirectory).toBe(false);
            expect(result.size).toBe(1024);
            expect(result.modified).toEqual(new Date('2023-01-01'));
        });
        (0, node_test_1.it)('should detect directories', () => {
            const mockStats = {
                isDirectory: () => true,
                size: 0,
                mtime: new Date('2023-01-01')
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.statSync.mockReturnValue(mockStats);
            const result = file_operations_1.FileOperations.checkFileConflict(filePath);
            expect(result.isDirectory).toBe(true);
        });
    });
    (0, node_test_2.describe)('deleteFile()', () => {
        const filePath = '/mock/test.txt';
        (0, node_test_1.it)('should delete file successfully', async () => {
            const mockStats = { isDirectory: () => false };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.statSync.mockReturnValue(mockStats);
            mockFs.unlinkSync.mockImplementation();
            await file_operations_1.FileOperations.deleteFile(filePath);
            expect(mockFs.unlinkSync).toHaveBeenCalledWith(filePath);
        });
        (0, node_test_1.it)('should delete directory recursively when specified', async () => {
            const mockStats = { isDirectory: () => true };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.statSync.mockReturnValue(mockStats);
            mockFs.rmSync.mockImplementation();
            await file_operations_1.FileOperations.deleteFile(filePath, true);
            expect(mockFs.rmSync).toHaveBeenCalledWith(filePath, { recursive: true, force: true });
        });
        (0, node_test_1.it)('should not throw error when file does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(file_operations_1.FileOperations.deleteFile(filePath)).resolves.not.toThrow();
        });
        (0, node_test_1.it)('should throw error when deletion fails', async () => {
            const mockStats = { isDirectory: () => false };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.statSync.mockReturnValue(mockStats);
            mockFs.unlinkSync.mockImplementation(() => {
                throw new Error('Delete failed');
            });
            await expect(file_operations_1.FileOperations.deleteFile(filePath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.deleteFile(filePath)).rejects.toThrow('Failed to delete');
        });
    });
    (0, node_test_2.describe)('readFile()', () => {
        const filePath = '/mock/test.txt';
        (0, node_test_1.it)('should read file successfully', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('file content');
            const result = await file_operations_1.FileOperations.readFile(filePath);
            expect(result).toBe('file content');
            expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
        });
        (0, node_test_1.it)('should throw error when file does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(file_operations_1.FileOperations.readFile(filePath)).rejects.toThrow(types_1.CLIError);
            await expect(file_operations_1.FileOperations.readFile(filePath)).rejects.toThrow('File not found');
        });
        (0, node_test_1.it)('should use custom encoding when specified', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('file content');
            await file_operations_1.FileOperations.readFile(filePath, 'ascii');
            expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'ascii');
        });
    });
    (0, node_test_2.describe)('validatePath()', () => {
        const basePath = '/mock/project';
        (0, node_test_1.it)('should return true for valid paths within base', () => {
            const validPath = 'components/button.tsx';
            const result = file_operations_1.FileOperations.validatePath(validPath, basePath);
            expect(result).toBe(true);
        });
        (0, node_test_1.it)('should return false for path traversal attempts', () => {
            const maliciousPath = '../../../etc/passwd';
            const result = file_operations_1.FileOperations.validatePath(maliciousPath, basePath);
            expect(result).toBe(false);
        });
        (0, node_test_1.it)('should return true for absolute paths within base', () => {
            const absolutePath = path.join(basePath, 'components/button.tsx');
            const result = file_operations_1.FileOperations.validatePath(absolutePath, basePath);
            expect(result).toBe(true);
        });
    });
});
//# sourceMappingURL=file-operations.test.js.map