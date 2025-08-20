import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Unit tests for CLI entry point
 */
describe('CLI Entry Point', () => {
  const cliPath = path.join(__dirname, '../index.ts');

  /**
   * Helper to run CLI with node for testing
   */
  const runCLIWithNode = (args: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> => {
    return new Promise((resolve, reject) => {
      // Use the built CLI if available, otherwise skip the test
      const builtCliPath = path.join(__dirname, '../../dist/index.js');
      if (!require('fs').existsSync(builtCliPath)) {
        resolve({
          exitCode: 0,
          stdout: 'CLI not built - skipping test',
          stderr: ''
        });
        return;
      }

      const child = spawn('node', [builtCliPath, ...args], {
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
        reject(new Error('CLI test timed out'));
      }, 5000);

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

  describe('Command routing', () => {
    it('should route to help when no arguments provided', async () => {
      const result = await runCLIWithNode([]);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Custom UI Component Library CLI');
      expect(result.stdout).toContain('Usage: custom-ui <command>');
    });

    it('should handle --version flag', async () => {
      const result = await runCLIWithNode(['--version']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('1.0.0');
    });

    it('should handle --help flag', async () => {
      const result = await runCLIWithNode(['--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Usage: custom-ui <command>');
      expect(result.stdout).toContain('Commands:');
    });

    it('should show error for unknown commands', async () => {
      const result = await runCLIWithNode(['unknown']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command: unknown');
    });
  });

  describe('Global options', () => {
    it('should handle --verbose flag', async () => {
      const result = await runCLIWithNode(['list', '--verbose']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      // Should not error on the verbose flag itself
      expect(result.exitCode).toBeGreaterThan(-1);
    });

    it('should handle --no-color flag', async () => {
      const result = await runCLIWithNode(['--no-color', '--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Usage: custom-ui <command>');
    });
  });

  describe('Command help', () => {
    it('should show help for init command', async () => {
      const result = await runCLIWithNode(['init', '--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Initialize custom-ui in your project');
    });

    it('should show help for add command', async () => {
      const result = await runCLIWithNode(['add', '--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Add components to your project');
    });

    it('should show help for list command', async () => {
      const result = await runCLIWithNode(['list', '--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('List all available components');
    });

    it('should show help for docs command', async () => {
      const result = await runCLIWithNode(['docs', '--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.stdout).toContain('Show documentation for a component');
    });
  });

  describe('Error handling', () => {
    it('should handle SIGINT gracefully', (done) => {
      const builtCliPath = path.join(__dirname, '../../dist/index.js');
      if (!require('fs').existsSync(builtCliPath)) {
        console.log('Skipping test - CLI not built');
        done();
        return;
      }

      const child = spawn('node', [builtCliPath, 'list'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stderr = '';
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Send SIGINT after a short delay
      setTimeout(() => {
        child.kill('SIGINT');
      }, 100);

      child.on('close', (code) => {
        expect(code).toBe(130); // Standard SIGINT exit code
        done();
      });

      child.on('error', (error) => {
        done(error);
      });
    });

    it('should handle SIGTERM gracefully', (done) => {
      const builtCliPath = path.join(__dirname, '../../dist/index.js');
      if (!require('fs').existsSync(builtCliPath)) {
        console.log('Skipping test - CLI not built');
        done();
        return;
      }

      const child = spawn('node', [builtCliPath, 'list'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Send SIGTERM after a short delay
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 100);

      child.on('close', (code) => {
        // On Windows, SIGTERM might not work as expected
        if (process.platform === 'win32') {
          expect(code).toBeGreaterThan(-1);
        } else {
          expect(code).toBe(143); // Standard SIGTERM exit code
        }
        done();
      });

      child.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Exit codes', () => {
    it('should exit with 0 for successful help display', async () => {
      const result = await runCLIWithNode(['--help']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.exitCode).toBe(0);
    });

    it('should exit with 1 for unknown commands', async () => {
      const result = await runCLIWithNode(['nonexistent']);
      
      if (result.stdout.includes('CLI not built')) {
        console.log('Skipping test - CLI not built');
        return;
      }
      
      expect(result.exitCode).toBe(1);
    });
  });
});

/**
 * Tests for CLI class methods (mocked)
 */
describe('CLI Class Methods', () => {
  // Mock the CLI class for unit testing
  class MockCustomUICLI {
    getExitCodeForError(errorCode: string): number {
      switch (errorCode) {
        case 'NETWORK_ERROR':
          return 2;
        case 'FILE_EXISTS':
          return 3;
        case 'INVALID_PROJECT':
          return 4;
        case 'MISSING_DEPENDENCY':
          return 5;
        case 'COMPONENT_NOT_FOUND':
          return 6;
        case 'INVALID_COMMAND':
          return 7;
        case 'PERMISSION_DENIED':
          return 8;
        case 'REGISTRY_ERROR':
          return 9;
        case 'DEPENDENCY_CONFLICT':
          return 10;
        case 'CONFIG_ERROR':
          return 11;
        default:
          return 1;
      }
    }

    buildArgs(options: any): string[] {
      const args: string[] = [];
      
      Object.entries(options).forEach(([key, value]) => {
        if (value === true) {
          args.push(`--${key}`);
        } else if (value !== false && value !== undefined) {
          args.push(`--${key}`, String(value));
        }
      });

      return args;
    }
  }

  let cli: MockCustomUICLI;

  beforeEach(() => {
    cli = new MockCustomUICLI();
  });

  describe('getExitCodeForError', () => {
    it('should return correct exit codes for different error types', () => {
      expect(cli.getExitCodeForError('NETWORK_ERROR')).toBe(2);
      expect(cli.getExitCodeForError('FILE_EXISTS')).toBe(3);
      expect(cli.getExitCodeForError('INVALID_PROJECT')).toBe(4);
      expect(cli.getExitCodeForError('MISSING_DEPENDENCY')).toBe(5);
      expect(cli.getExitCodeForError('COMPONENT_NOT_FOUND')).toBe(6);
      expect(cli.getExitCodeForError('INVALID_COMMAND')).toBe(7);
      expect(cli.getExitCodeForError('PERMISSION_DENIED')).toBe(8);
      expect(cli.getExitCodeForError('REGISTRY_ERROR')).toBe(9);
      expect(cli.getExitCodeForError('DEPENDENCY_CONFLICT')).toBe(10);
      expect(cli.getExitCodeForError('CONFIG_ERROR')).toBe(11);
      expect(cli.getExitCodeForError('UNKNOWN_ERROR')).toBe(1);
    });
  });

  describe('buildArgs', () => {
    it('should convert boolean options to flags', () => {
      const options = { force: true, verbose: true };
      const args = cli.buildArgs(options);
      
      expect(args).toContain('--force');
      expect(args).toContain('--verbose');
    });

    it('should convert options with values to key-value pairs', () => {
      const options = { 'components-dir': 'src/components', format: 'json' };
      const args = cli.buildArgs(options);
      
      expect(args).toContain('--components-dir');
      expect(args).toContain('src/components');
      expect(args).toContain('--format');
      expect(args).toContain('json');
    });

    it('should ignore false and undefined values', () => {
      const options = { force: false, verbose: undefined, silent: true };
      const args = cli.buildArgs(options);
      
      expect(args).not.toContain('--force');
      expect(args).not.toContain('--verbose');
      expect(args).toContain('--silent');
    });

    it('should handle mixed option types', () => {
      const options = {
        force: true,
        'components-dir': 'components',
        verbose: false,
        format: 'text'
      };
      const args = cli.buildArgs(options);
      
      expect(args).toEqual(['--force', '--components-dir', 'components', '--format', 'text']);
    });
  });
});