import * as fs from 'fs';
import * as path from 'path';
import { CLIError, ERROR_CODES } from '../types';

export interface FileConflictResolution {
  action: 'overwrite' | 'skip' | 'backup';
  backupPath?: string;
}

export interface WriteFileOptions {
  overwrite?: boolean;
  createBackup?: boolean;
  encoding?: BufferEncoding;
}

/**
 * Safe file system operations with conflict handling
 */
export class FileOperations {
  /**
   * Safely writes content to a file with conflict handling
   */
  static async writeFile(
    filePath: string, 
    content: string, 
    options: WriteFileOptions = {}
  ): Promise<void> {
    const {
      overwrite = false,
      createBackup = false,
      encoding = 'utf-8'
    } = options;

    const exists = fs.existsSync(filePath);

    if (exists && !overwrite) {
      throw new CLIError(
        `File already exists: ${filePath}`,
        ERROR_CODES.FILE_EXISTS,
        [
          'Use --force flag to overwrite',
          'Use --backup flag to create a backup before overwriting'
        ]
      );
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
    } catch (error) {
      throw new CLIError(
        `Failed to write file ${filePath}: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Safely copies a file with conflict handling
   */
  static async copyFile(
    sourcePath: string,
    targetPath: string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    if (!fs.existsSync(sourcePath)) {
      throw new CLIError(
        `Source file not found: ${sourcePath}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    const content = fs.readFileSync(sourcePath, 'utf-8');
    await this.writeFile(targetPath, content, options);
  }

  /**
   * Creates a backup of an existing file
   */
  static async createBackup(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `File not found for backup: ${filePath}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    try {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new CLIError(
        `Failed to create backup: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Safely creates a directory structure
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      throw new CLIError(
        `Failed to create directory ${dirPath}: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Checks if a file exists and returns conflict information
   */
  static checkFileConflict(filePath: string): {
    exists: boolean;
    isDirectory: boolean;
    size?: number;
    modified?: Date;
  } {
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
  static async resolveConflict(
    filePath: string,
    promptCallback?: (message: string, choices: string[]) => Promise<string>
  ): Promise<FileConflictResolution> {
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
  static async deleteFile(filePath: string, recursive: boolean = false): Promise<void> {
    if (!fs.existsSync(filePath)) {
      return; // Already deleted
    }

    try {
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        if (recursive) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.rmdirSync(filePath);
        }
      } else {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new CLIError(
        `Failed to delete ${filePath}: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Reads file content safely
   */
  static async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `File not found: ${filePath}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    try {
      return fs.readFileSync(filePath, encoding);
    } catch (error) {
      throw new CLIError(
        `Failed to read file ${filePath}: ${error}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Lists files in a directory with optional filtering
   */
  static async listFiles(
    dirPath: string,
    options: {
      recursive?: boolean;
      extensions?: string[];
      includeDirectories?: boolean;
    } = {}
  ): Promise<string[]> {
    const {
      recursive = false,
      extensions = [],
      includeDirectories = false
    } = options;

    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files: string[] = [];
    
    const processDirectory = (currentPath: string) => {
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
        } else {
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
  static validatePath(filePath: string, basePath: string): boolean {
    const resolvedPath = path.resolve(basePath, filePath);
    const resolvedBase = path.resolve(basePath);
    
    return resolvedPath.startsWith(resolvedBase);
  }
}