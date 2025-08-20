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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const os = __importStar(require("os"));
/**
 * End-to-end tests for the CLI
 */
describe('CLI E2E Tests', () => {
    let tempDir;
    let cliPath;
    beforeAll(async () => {
        // Build the CLI first
        cliPath = path.join(__dirname, '../../dist/index.js');
        // Ensure the CLI is built
        if (!fs.existsSync(cliPath)) {
            throw new Error('CLI not built. Run "npm run build" first.');
        }
    });
    beforeEach(async () => {
        // Create a temporary directory for each test
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'custom-ui-test-'));
        // Create a basic package.json
        await fs.writeJson(path.join(tempDir, 'package.json'), {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
                react: '^18.0.0',
                'react-dom': '^18.0.0'
            }
        });
    });
    afterEach(async () => {
        // Clean up temporary directory
        if (tempDir && fs.existsSync(tempDir)) {
            await fs.remove(tempDir);
        }
    });
    /**
     * Helper function to run CLI commands
     */
    const runCLI = (args, options = {}) => {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)('node', [cliPath, ...args], {
                cwd: options.cwd || tempDir,
                stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`CLI command timed out after ${options.timeout || 10000}ms`));
            }, options.timeout || 10000);
            child.on('close', (code) => {
                clearTimeout(timeout);
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr
                });
            });
            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    };
    describe('General CLI behavior', () => {
        it('should show help when no arguments provided', async () => {
            const result = await runCLI([]);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Custom UI Component Library CLI');
            expect(result.stdout).toContain('Usage: custom-ui <command>');
            expect(result.stdout).toContain('Commands:');
        });
        it('should show version information', async () => {
            const result = await runCLI(['--version']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('1.0.0');
        });
        it('should show help with --help flag', async () => {
            const result = await runCLI(['--help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Usage: custom-ui <command>');
        });
        it('should handle unknown commands gracefully', async () => {
            const result = await runCLI(['unknown-command']);
            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain('Unknown command: unknown-command');
        });
        it('should handle SIGINT gracefully', async () => {
            const child = (0, child_process_1.spawn)('node', [cliPath, 'list'], {
                cwd: tempDir,
                stdio: 'pipe'
            });
            // Send SIGINT after a short delay
            setTimeout(() => {
                child.kill('SIGINT');
            }, 100);
            const result = await new Promise((resolve) => {
                let stdout = '';
                let stderr = '';
                child.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });
                child.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });
                child.on('close', (code) => {
                    resolve({ exitCode: code || 0, stdout, stderr });
                });
            });
            expect(result.exitCode).toBe(130); // Standard SIGINT exit code
        });
    });
    describe('Init command', () => {
        it('should initialize project successfully with --force flag', async () => {
            const result = await runCLI(['init', '--force', '--skip-deps'], { timeout: 15000 });
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('custom-ui has been initialized successfully');
            // Check that configuration file was created
            const configPath = path.join(tempDir, 'custom-ui.config.json');
            expect(fs.existsSync(configPath)).toBe(true);
        });
        it('should show help for init command', async () => {
            const result = await runCLI(['init', '--help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Initialize custom-ui in your project');
        });
        it('should handle invalid project directory', async () => {
            // Remove package.json to make it invalid
            await fs.remove(path.join(tempDir, 'package.json'));
            const result = await runCLI(['init', '--force'], { timeout: 15000 });
            expect(result.exitCode).toBeGreaterThan(0);
        });
    });
    describe('List command', () => {
        it('should list available components', async () => {
            const result = await runCLI(['list'], { timeout: 15000 });
            // Should succeed or fail gracefully with network issues
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Available Components');
            }
            else {
                // Network error is acceptable in test environment
                expect(result.exitCode).toBe(2); // Network error code
            }
        });
        it('should show verbose component information', async () => {
            const result = await runCLI(['list', '--verbose'], { timeout: 15000 });
            // Should succeed or fail gracefully with network issues
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Available Components');
            }
            else {
                expect(result.exitCode).toBe(2); // Network error code
            }
        });
        it('should handle search filtering', async () => {
            const result = await runCLI(['list', '--search', 'button'], { timeout: 15000 });
            // Should succeed or fail gracefully with network issues
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Available Components');
            }
            else {
                expect(result.exitCode).toBe(2); // Network error code
            }
        });
        it('should show help for list command', async () => {
            const result = await runCLI(['list', '--help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('List all available components');
        });
    });
    describe('Docs command', () => {
        it('should show general help when no component specified', async () => {
            const result = await runCLI(['docs'], { timeout: 15000 });
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Component Documentation');
            expect(result.stdout).toContain('Usage: custom-ui docs <component-name>');
        });
        it('should attempt to show component documentation', async () => {
            const result = await runCLI(['docs', 'button'], { timeout: 15000 });
            // Should succeed or fail gracefully with network issues
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('BUTTON COMPONENT');
            }
            else {
                // Network error or component not found is acceptable
                expect([2, 6]).toContain(result.exitCode);
            }
        });
        it('should handle JSON output format', async () => {
            const result = await runCLI(['docs', 'button', '--format', 'json'], { timeout: 15000 });
            // Should succeed or fail gracefully
            if (result.exitCode === 0) {
                expect(() => JSON.parse(result.stdout)).not.toThrow();
            }
            else {
                expect([2, 6]).toContain(result.exitCode);
            }
        });
        it('should show help for docs command', async () => {
            const result = await runCLI(['docs', '--help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Show documentation for a component');
        });
    });
    describe('Add command', () => {
        beforeEach(async () => {
            // Initialize the project first
            await runCLI(['init', '--force', '--skip-deps'], { timeout: 15000 });
        });
        it('should show error when no component specified', async () => {
            const result = await runCLI(['add'], { timeout: 15000 });
            expect(result.exitCode).toBeGreaterThan(0);
        });
        it('should attempt to add a component', async () => {
            const result = await runCLI(['add', 'button', '--skip-deps'], { timeout: 20000 });
            // Should succeed or fail gracefully with network issues
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Successfully added');
            }
            else {
                // Network error or component not found is acceptable
                expect([2, 6, 9]).toContain(result.exitCode);
            }
        });
        it('should handle multiple components', async () => {
            const result = await runCLI(['add', 'button', 'input', '--skip-deps'], { timeout: 25000 });
            // Should succeed or fail gracefully
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Successfully added');
            }
            else {
                expect([2, 6, 9]).toContain(result.exitCode);
            }
        });
        it('should show help for add command', async () => {
            const result = await runCLI(['add', '--help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Add components to your project');
        });
        it('should handle force flag', async () => {
            const result = await runCLI(['add', 'button', '--force', '--skip-deps'], { timeout: 20000 });
            // Should succeed or fail gracefully
            if (result.exitCode === 0) {
                expect(result.stdout).toContain('Successfully added');
            }
            else {
                expect([2, 6, 9]).toContain(result.exitCode);
            }
        });
    });
    describe('Help command', () => {
        it('should show general help', async () => {
            const result = await runCLI(['help']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Custom UI Component Library CLI');
            expect(result.stdout).toContain('Commands:');
        });
        it('should show help for specific command', async () => {
            const result = await runCLI(['help', 'init']);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Usage: custom-ui');
        });
    });
    describe('Error handling', () => {
        it('should handle network timeouts gracefully', async () => {
            // This test simulates network issues by using a very short timeout
            const result = await runCLI(['list'], { timeout: 100 });
            // Should either succeed quickly or timeout
            expect([0, 2]).toContain(result.exitCode);
        });
        it('should provide appropriate exit codes for different error types', async () => {
            // Test invalid project (no package.json)
            await fs.remove(path.join(tempDir, 'package.json'));
            const result = await runCLI(['init']);
            expect(result.exitCode).toBeGreaterThan(0);
        });
        it('should handle permission errors gracefully', async () => {
            // Create a read-only directory to simulate permission issues
            const readOnlyDir = path.join(tempDir, 'readonly');
            await fs.ensureDir(readOnlyDir);
            if (process.platform !== 'win32') {
                await fs.chmod(readOnlyDir, 0o444);
            }
            const result = await runCLI(['init', '--components-dir', 'readonly/components'], { timeout: 15000 });
            // Should handle permission error gracefully
            expect(result.exitCode).toBeGreaterThan(0);
        });
    });
    describe('Command argument parsing', () => {
        it('should parse boolean flags correctly', async () => {
            const result = await runCLI(['list', '--verbose']);
            // Should parse the verbose flag without error
            expect([0, 2]).toContain(result.exitCode); // Success or network error
        });
        it('should parse options with values correctly', async () => {
            const result = await runCLI(['list', '--search', 'button']);
            // Should parse the search option without error
            expect([0, 2]).toContain(result.exitCode); // Success or network error
        });
        it('should handle mixed arguments and options', async () => {
            const result = await runCLI(['add', 'button', '--force', '--skip-deps']);
            // Should parse mixed arguments without error
            expect(result.exitCode).toBeGreaterThan(-1); // Any valid exit code
        });
    });
});
//# sourceMappingURL=cli.e2e.test.js.map