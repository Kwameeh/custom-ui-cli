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
const config_manager_1 = require("../config-manager");
const types_1 = require("../../types");
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
const node_test_3 = require("node:test");
// Mock fs module
jest.mock('fs');
const mockFs = fs;
(0, node_test_2.describe)('ConfigManager', () => {
    let configManager;
    let mockProjectRoot;
    let mockConfigPath;
    const validConfig = {
        componentsDir: 'components/ui',
        utilsDir: 'lib',
        cssFramework: 'tailwind',
        typescript: true,
        projectType: 'nextjs'
    };
    (0, node_test_3.beforeEach)(() => {
        jest.clearAllMocks();
        mockProjectRoot = '/mock/project';
        mockConfigPath = path.join(mockProjectRoot, config_manager_1.CONFIG_FILENAME);
        configManager = new config_manager_1.ConfigManager(mockProjectRoot);
    });
    (0, node_test_2.describe)('exists()', () => {
        (0, node_test_1.it)('should return true when config file exists', () => {
            mockFs.existsSync.mockReturnValue(true);
            expect(configManager.exists()).toBe(true);
            expect(mockFs.existsSync).toHaveBeenCalledWith(mockConfigPath);
        });
        (0, node_test_1.it)('should return false when config file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            expect(configManager.exists()).toBe(false);
        });
    });
    (0, node_test_2.describe)('read()', () => {
        (0, node_test_1.it)('should read and parse valid configuration', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
            const result = configManager.read();
            expect(result).toEqual(validConfig);
            expect(mockFs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
        });
        (0, node_test_1.it)('should throw error when config file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            expect(() => configManager.read()).toThrow(types_1.CLIError);
            expect(() => configManager.read()).toThrow('Configuration file not found');
        });
        (0, node_test_1.it)('should throw error when config file contains invalid JSON', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('invalid json');
            expect(() => configManager.read()).toThrow(types_1.CLIError);
            expect(() => configManager.read()).toThrow('Failed to read configuration file');
        });
        (0, node_test_1.it)('should throw error when config is missing required fields', () => {
            const invalidConfig = { componentsDir: 'components' }; // missing other fields
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));
            expect(() => configManager.read()).toThrow('Missing required field');
        });
        (0, node_test_1.it)('should throw error when config has invalid field types', () => {
            const invalidConfig = { ...validConfig, typescript: 'yes' }; // should be boolean
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));
            expect(() => configManager.read()).toThrow('typescript must be a boolean');
        });
        (0, node_test_1.it)('should throw error when cssFramework is invalid', () => {
            const invalidConfig = { ...validConfig, cssFramework: 'invalid' };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));
            expect(() => configManager.read()).toThrow('cssFramework must be one of');
        });
        (0, node_test_1.it)('should throw error when projectType is invalid', () => {
            const invalidConfig = { ...validConfig, projectType: 'invalid' };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));
            expect(() => configManager.read()).toThrow('projectType must be one of');
        });
    });
    (0, node_test_2.describe)('write()', () => {
        (0, node_test_1.it)('should write valid configuration to file', () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.writeFileSync.mockImplementation();
            configManager.write(validConfig);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, JSON.stringify(validConfig, null, 2), 'utf-8');
        });
        (0, node_test_1.it)('should throw error when file exists and overwrite is false', () => {
            mockFs.existsSync.mockReturnValue(true);
            expect(() => configManager.write(validConfig)).toThrow(types_1.CLIError);
            expect(() => configManager.write(validConfig)).toThrow('Configuration file already exists');
        });
        (0, node_test_1.it)('should overwrite when file exists and overwrite is true', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.writeFileSync.mockImplementation();
            configManager.write(validConfig, true);
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });
        (0, node_test_1.it)('should throw error when write fails', () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });
            expect(() => configManager.write(validConfig)).toThrow(types_1.CLIError);
            expect(() => configManager.write(validConfig)).toThrow('Failed to write configuration file');
        });
    });
    (0, node_test_2.describe)('update()', () => {
        (0, node_test_1.it)('should update existing configuration', () => {
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
    (0, node_test_2.describe)('getComponentsPath()', () => {
        (0, node_test_1.it)('should return absolute path to components directory', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
            const result = configManager.getComponentsPath();
            expect(result).toBe(path.resolve(mockProjectRoot, validConfig.componentsDir));
        });
    });
    (0, node_test_2.describe)('getUtilsPath()', () => {
        (0, node_test_1.it)('should return absolute path to utils directory', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
            const result = configManager.getUtilsPath();
            expect(result).toBe(path.resolve(mockProjectRoot, validConfig.utilsDir));
        });
    });
    (0, node_test_2.describe)('createDirectories()', () => {
        (0, node_test_1.it)('should create components and utils directories', () => {
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === mockConfigPath)
                    return true;
                return false; // directories don't exist
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
            mockFs.mkdirSync.mockImplementation();
            configManager.createDirectories();
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.resolve(mockProjectRoot, validConfig.componentsDir), { recursive: true });
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.resolve(mockProjectRoot, validConfig.utilsDir), { recursive: true });
        });
        (0, node_test_1.it)('should not create directories if they already exist', () => {
            mockFs.existsSync.mockReturnValue(true); // all paths exist
            mockFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
            configManager.createDirectories();
            expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        });
    });
    (0, node_test_2.describe)('backup()', () => {
        (0, node_test_1.it)('should create backup of existing config file', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation();
            const backupPath = configManager.backup();
            expect(backupPath).toContain(`${config_manager_1.CONFIG_FILENAME}.backup.`);
            expect(mockFs.copyFileSync).toHaveBeenCalledWith(mockConfigPath, backupPath);
        });
        (0, node_test_1.it)('should throw error when no config file exists', () => {
            mockFs.existsSync.mockReturnValue(false);
            expect(() => configManager.backup()).toThrow(types_1.CLIError);
            expect(() => configManager.backup()).toThrow('No configuration file to backup');
        });
    });
    (0, node_test_2.describe)('restore()', () => {
        (0, node_test_1.it)('should restore config from backup', () => {
            const backupPath = '/mock/backup.json';
            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation();
            configManager.restore(backupPath);
            expect(mockFs.copyFileSync).toHaveBeenCalledWith(backupPath, mockConfigPath);
        });
        (0, node_test_1.it)('should throw error when backup file does not exist', () => {
            const backupPath = '/mock/backup.json';
            mockFs.existsSync.mockReturnValue(false);
            expect(() => configManager.restore(backupPath)).toThrow(types_1.CLIError);
            expect(() => configManager.restore(backupPath)).toThrow('Backup file not found');
        });
    });
});
//# sourceMappingURL=config-manager.test.js.map