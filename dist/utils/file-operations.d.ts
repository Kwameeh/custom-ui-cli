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
export declare class FileOperations {
    /**
     * Safely writes content to a file with conflict handling
     */
    static writeFile(filePath: string, content: string, options?: WriteFileOptions): Promise<void>;
    /**
     * Safely copies a file with conflict handling
     */
    static copyFile(sourcePath: string, targetPath: string, options?: WriteFileOptions): Promise<void>;
    /**
     * Creates a backup of an existing file
     */
    static createBackup(filePath: string): Promise<string>;
    /**
     * Safely creates a directory structure
     */
    static ensureDirectory(dirPath: string): Promise<void>;
    /**
     * Checks if a file exists and returns conflict information
     */
    static checkFileConflict(filePath: string): {
        exists: boolean;
        isDirectory: boolean;
        size?: number;
        modified?: Date;
    };
    /**
     * Resolves file conflicts interactively (for CLI use)
     */
    static resolveConflict(filePath: string, promptCallback?: (message: string, choices: string[]) => Promise<string>): Promise<FileConflictResolution>;
    /**
     * Safely deletes a file or directory
     */
    static deleteFile(filePath: string, recursive?: boolean): Promise<void>;
    /**
     * Reads file content safely
     */
    static readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    /**
     * Lists files in a directory with optional filtering
     */
    static listFiles(dirPath: string, options?: {
        recursive?: boolean;
        extensions?: string[];
        includeDirectories?: boolean;
    }): Promise<string[]>;
    /**
     * Validates file path for security (prevents path traversal)
     */
    static validatePath(filePath: string, basePath: string): boolean;
}
//# sourceMappingURL=file-operations.d.ts.map