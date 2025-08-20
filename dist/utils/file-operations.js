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
exports.FileOperations = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../types");
/**
 * Safe file system operations with conflict handling
 */
class FileOperations {
    /**
     * Safely writes content to a file with conflict handling
     */
    static async writeFile(filePath, content, options = {}) {
        const { overwrite = false, createBackup = false, encoding = 'utf-8' } = options;
        const exists = fs.existsSync(filePath);
        if (exists && !overwrite) {
            throw new types_1.CLIError(`File already exists: ${filePath}`, types_1.ERROR_CODES.FILE_EXISTS, [
                'Use --force flag to overwrite',
                'Use --backup flag to create a backup before overwriting'
            ]);
        }
        // Create backup if requested and file exists
        if (exists && createBackup) {
            await this.createBackup(filePath);
        }
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        try {
            fs.writeFileSync(filePath, content, encoding);
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to write file ${filePath}: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Safely copies a file with conflict handling
     */
    static async copyFile(sourcePath, targetPath, options = {}) {
        if (!fs.existsSync(sourcePath)) {
            throw new types_1.CLIError(`Source file not found: ${sourcePath}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        const content = fs.readFileSync(sourcePath, 'utf-8');
        await this.writeFile(targetPath, content, options);
    }
    /**
     * Creates a backup of an existing file
     */
    static async createBackup(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new types_1.CLIError(`File not found for backup: ${filePath}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.backup.${timestamp}`;
        try {
            fs.copyFileSync(filePath, backupPath);
            return backupPath;
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to create backup: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Safely creates a directory structure
     */
    static async ensureDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to create directory ${dirPath}: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Checks if a file exists and returns conflict information
     */
    static checkFileConflict(filePath) {
        if (!fs.existsSync(filePath)) {
            return { exists: false, isDirectory: false };
        }
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
        };
    }
    /**
     * Resolves file conflicts interactively (for CLI use)
     */
    static async resolveConflict(filePath, promptCallback) {
        const conflict = this.checkFileConflict(filePath);
        if (!conflict.exists) {
            return { action: 'overwrite' };
        }
        if (!promptCallback) {
            // Default behavior when no prompt callback is provided
            return { action: 'skip' };
        }
        const choices = ['overwrite', 'skip', 'backup'];
        const message = `File ${filePath} already exists. What would you like to do?`;
        const choice = await promptCallback(message, choices);
        switch (choice) {
            case 'backup':
                const backupPath = await this.createBackup(filePath);
                return { action: 'backup', backupPath };
            case 'overwrite':
                return { action: 'overwrite' };
            case 'skip':
            default:
                return { action: 'skip' };
        }
    }
    /**
     * Safely deletes a file or directory
     */
    static async deleteFile(filePath, recursive = false) {
        if (!fs.existsSync(filePath)) {
            return; // Already deleted
        }
        try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                if (recursive) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
                else {
                    fs.rmdirSync(filePath);
                }
            }
            else {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to delete ${filePath}: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Reads file content safely
     */
    static async readFile(filePath, encoding = 'utf-8') {
        if (!fs.existsSync(filePath)) {
            throw new types_1.CLIError(`File not found: ${filePath}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
        try {
            return fs.readFileSync(filePath, encoding);
        }
        catch (error) {
            throw new types_1.CLIError(`Failed to read file ${filePath}: ${error}`, types_1.ERROR_CODES.INVALID_PROJECT);
        }
    }
    /**
     * Lists files in a directory with optional filtering
     */
    static async listFiles(dirPath, options = {}) {
        const { recursive = false, extensions = [], includeDirectories = false } = options;
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        const files = [];
        const processDirectory = (currentPath) => {
            const items = fs.readdirSync(currentPath);
            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    if (includeDirectories) {
                        files.push(fullPath);
                    }
                    if (recursive) {
                        processDirectory(fullPath);
                    }
                }
                else {
                    if (extensions.length === 0 || extensions.includes(path.extname(item))) {
                        files.push(fullPath);
                    }
                }
            }
        };
        processDirectory(dirPath);
        return files;
    }
    /**
     * Validates file path for security (prevents path traversal)
     */
    static validatePath(filePath, basePath) {
        const resolvedPath = path.resolve(basePath, filePath);
        const resolvedBase = path.resolve(basePath);
        return resolvedPath.startsWith(resolvedBase);
    }
}
exports.FileOperations = FileOperations;
//# sourceMappingURL=file-operations.js.map