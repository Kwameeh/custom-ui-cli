"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
describe('Registry Integration', () => {
    it('should be able to import and use registry components', () => {
        expect(index_1.RegistryLoader).toBeDefined();
        expect(index_1.RegistryUtils).toBeDefined();
    });
    it('should be able to create registry loader and utils instances', () => {
        const loader = new index_1.RegistryLoader();
        const utils = new index_1.RegistryUtils();
        expect(loader).toBeInstanceOf(index_1.RegistryLoader);
        expect(utils).toBeInstanceOf(index_1.RegistryUtils);
    });
    it('should export all necessary types', () => {
        // This test ensures that all types are properly exported and can be used in TypeScript
        // We can't test type exports at runtime, but we can ensure they compile
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=integration.test.js.map