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
const project_detector_1 = require("../project-detector");
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
const node_test_3 = require("node:test");
// Mock fs module
jest.mock('fs');
const mockFs = fs;
(0, node_test_2.describe)('ProjectDetector', () => {
    let detector;
    let mockProjectRoot;
    (0, node_test_3.beforeEach)(() => {
        jest.clearAllMocks();
        mockProjectRoot = '/mock/project';
        detector = new project_detector_1.ProjectDetector(mockProjectRoot);
    });
    (0, node_test_2.describe)('detect()', () => {
        (0, node_test_1.it)('should detect Next.js project with next dependency', async () => {
            const packageJson = {
                dependencies: { next: '^13.0.0', react: '^18.0.0' },
                devDependencies: { typescript: '^4.0.0' }
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                if (pathStr === path.join(mockProjectRoot, 'tsconfig.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('nextjs');
            expect(result.hasTypeScript).toBe(true);
            expect(result.hasTailwind).toBe(false);
        });
        (0, node_test_1.it)('should detect Next.js project with next.config.js', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                if (pathStr === path.join(mockProjectRoot, 'next.config.js'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('nextjs');
        });
        (0, node_test_1.it)('should detect Vite project with vite dependency', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: { vite: '^4.0.0', '@vitejs/plugin-react': '^3.0.0' }
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('vite');
        });
        (0, node_test_1.it)('should detect Vite project with vite.config.ts', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                if (pathStr === path.join(mockProjectRoot, 'vite.config.ts'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('vite');
        });
        (0, node_test_1.it)('should detect Create React App project', async () => {
            const packageJson = {
                dependencies: {
                    react: '^18.0.0',
                    'react-scripts': '^5.0.0'
                },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('cra');
        });
        (0, node_test_1.it)('should detect generic React project', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.type).toBe('generic');
        });
        (0, node_test_1.it)('should detect TypeScript from tsconfig.json', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                if (pathStr === path.join(mockProjectRoot, 'tsconfig.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.hasTypeScript).toBe(true);
        });
        (0, node_test_1.it)('should detect TypeScript from typescript dependency', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: { typescript: '^4.0.0' }
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.hasTypeScript).toBe(true);
        });
        (0, node_test_1.it)('should detect Tailwind CSS from dependency', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: { tailwindcss: '^3.0.0' }
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.hasTailwind).toBe(true);
        });
        (0, node_test_1.it)('should detect Tailwind CSS from config file', async () => {
            const packageJson = {
                dependencies: { react: '^18.0.0' },
                devDependencies: {}
            };
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join(mockProjectRoot, 'package.json'))
                    return true;
                if (pathStr === path.join(mockProjectRoot, 'tailwind.config.js'))
                    return true;
                return false;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
            const result = await detector.detect();
            expect(result.hasTailwind).toBe(true);
        });
        (0, node_test_1.it)('should throw error when no package.json found', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(detector.detect()).rejects.toThrow('No package.json found in current directory or parent directories');
        });
        (0, node_test_1.it)('should throw error when package.json is invalid JSON', async () => {
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'package.json');
            });
            mockFs.readFileSync.mockReturnValue('invalid json');
            await expect(detector.detect()).rejects.toThrow('Failed to read package.json');
        });
    });
    (0, node_test_2.describe)('createDefaultConfig()', () => {
        (0, node_test_1.it)('should create Next.js app router config', () => {
            const detection = {
                type: 'nextjs',
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
        (0, node_test_1.it)('should create Vite project config', () => {
            const detection = {
                type: 'vite',
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
        (0, node_test_1.it)('should create CRA project config', () => {
            const detection = {
                type: 'cra',
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
        (0, node_test_1.it)('should create generic project config', () => {
            const detection = {
                type: 'generic',
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
    (0, node_test_2.describe)('findPackageJson()', () => {
        (0, node_test_1.it)('should find package.json in parent directories', async () => {
            const deepPath = '/mock/project/src/components';
            detector = new project_detector_1.ProjectDetector(deepPath);
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                if (pathStr === path.join('/mock/project', 'package.json'))
                    return true;
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
//# sourceMappingURL=project-detector.test.js.map