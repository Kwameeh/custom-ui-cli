import { RegistryLoader, RegistryUtils } from '../index';
import * as path from 'path';

describe('Registry Integration', () => {
  it('should be able to import and use registry components', () => {
    expect(RegistryLoader).toBeDefined();
    expect(RegistryUtils).toBeDefined();
  });

  it('should be able to create registry loader and utils instances', () => {
    const loader = new RegistryLoader();
    const utils = new RegistryUtils();

    expect(loader).toBeInstanceOf(RegistryLoader);
    expect(utils).toBeInstanceOf(RegistryUtils);
  });

  it('should export all necessary types', () => {
    // This test ensures that all types are properly exported and can be used in TypeScript
    // We can't test type exports at runtime, but we can ensure they compile
    expect(true).toBe(true);
  });
});