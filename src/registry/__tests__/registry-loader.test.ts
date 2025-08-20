import { RegistryLoader } from '../registry-loader';
import { CLIError, ERROR_CODES } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockReadFile = require('fs').promises.readFile;

describe('RegistryLoader', () => {
  let registryLoader: RegistryLoader;
  const mockRegistryPath = '/mock/registry.json';

  beforeEach(() => {
    registryLoader = new RegistryLoader(mockRegistryPath);
    jest.clearAllMocks();
    mockReadFile.mockClear();
  });

  const validRegistry = {
    components: {
      button: {
        metadata: {
          name: 'Button',
          description: 'A button component',
          dependencies: [],
          files: [
            {
              path: 'components/ui/button.tsx',
              content: 'export const Button = () => <button />;',
              type: 'component' as const,
            },
          ],
          npmDependencies: ['react'],
        },
        component: {
          path: 'components/ui/button.tsx',
          content: 'export const Button = () => <button />;',
        },
        utils: [],
        examples: ['<Button>Click me</Button>'],
      },
    },
    utils: {
      cn: {
        path: 'lib/utils.ts',
        content: 'export const cn = () => {};',
        description: 'Class name utility',
      },
    },
  };

  describe('loadRegistry', () => {
    it('should load and validate a valid registry', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));

      const result = await registryLoader.loadRegistry();

      expect(result).toEqual(validRegistry);
      expect(mockReadFile).toHaveBeenCalledWith(mockRegistryPath, 'utf-8');
    });

    it('should cache the registry after first load', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));

      await registryLoader.loadRegistry();
      await registryLoader.loadRegistry();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should throw CLIError for invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json');

      await expect(registryLoader.loadRegistry()).rejects.toThrow(CLIError);
      await expect(registryLoader.loadRegistry()).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_PROJECT,
      });
    });

    it('should throw CLIError when registry file not found', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      await expect(registryLoader.loadRegistry()).rejects.toThrow(CLIError);
      await expect(registryLoader.loadRegistry()).rejects.toMatchObject({
        code: ERROR_CODES.NETWORK_ERROR,
      });
    });

    it('should throw CLIError for missing components object', async () => {
      const invalidRegistry = { utils: {} };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow(CLIError);
    });

    it('should throw CLIError for missing utils object', async () => {
      const invalidRegistry = { components: {} };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow(CLIError);
    });
  });

  describe('getComponent', () => {
    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));
    });

    it('should return a component when it exists', async () => {
      const result = await registryLoader.getComponent('button');

      expect(result).toEqual(validRegistry.components.button);
    });

    it('should return null when component does not exist', async () => {
      const result = await registryLoader.getComponent('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getComponentNames', () => {
    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));
    });

    it('should return all component names', async () => {
      const result = await registryLoader.getComponentNames();

      expect(result).toEqual(['button']);
    });
  });

  describe('getComponentMetadata', () => {
    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));
    });

    it('should return component metadata when component exists', async () => {
      const result = await registryLoader.getComponentMetadata('button');

      expect(result).toEqual(validRegistry.components.button.metadata);
    });

    it('should return null when component does not exist', async () => {
      const result = await registryLoader.getComponentMetadata('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllComponents', () => {
    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));
    });

    it('should return all components', async () => {
      const result = await registryLoader.getAllComponents();

      expect(result).toEqual(validRegistry.components);
    });
  });

  describe('getUtils', () => {
    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));
    });

    it('should return all utils', async () => {
      const result = await registryLoader.getUtils();

      expect(result).toEqual(validRegistry.utils);
    });
  });

  describe('clearCache', () => {
    it('should clear the cached registry', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(validRegistry));

      await registryLoader.loadRegistry();
      registryLoader.clearCache();
      await registryLoader.loadRegistry();

      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('validation', () => {
    it('should throw error for component missing metadata', async () => {
      const invalidRegistry = {
        components: {
          button: {
            component: { path: 'test', content: 'test' },
          },
        },
        utils: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow('missing metadata');
    });

    it('should throw error for component missing required metadata fields', async () => {
      const invalidRegistry = {
        components: {
          button: {
            metadata: {
              name: 'Button',
              // missing other required fields
            },
            component: { path: 'test', content: 'test' },
          },
        },
        utils: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow('missing metadata field');
    });

    it('should throw error for invalid file type', async () => {
      const invalidRegistry = {
        components: {
          button: {
            metadata: {
              name: 'Button',
              description: 'A button',
              dependencies: [],
              files: [
                {
                  path: 'test',
                  content: 'test',
                  type: 'invalid-type',
                },
              ],
              npmDependencies: [],
            },
            component: { path: 'test', content: 'test' },
          },
        },
        utils: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow('type must be one of');
    });

    it('should throw error for util missing required fields', async () => {
      const invalidRegistry = {
        components: {},
        utils: {
          cn: {
            path: 'lib/utils.ts',
            // missing content and description
          },
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(invalidRegistry));

      await expect(registryLoader.loadRegistry()).rejects.toThrow('missing field');
    });
  });
});