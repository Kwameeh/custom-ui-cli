#!/usr/bin/env node
"use strict";
/**
 * Registry validation script
 * Validates the component registry against the schema
 */
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
exports.validateRegistryFile = validateRegistryFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_1 = require("./schema");
function loadRegistry() {
    const registryPath = path.join(__dirname, 'registry.json');
    if (!fs.existsSync(registryPath)) {
        throw new Error('Registry file not found');
    }
    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    try {
        return JSON.parse(registryContent);
    }
    catch (error) {
        throw new Error(`Invalid JSON in registry file: ${error}`);
    }
}
function validateRegistryFile() {
    console.log('🔍 Validating component registry...\n');
    try {
        const registry = loadRegistry();
        // Validate registry structure
        const { isValid, errors } = (0, schema_1.validateRegistry)(registry);
        if (!isValid) {
            console.error('❌ Registry validation failed:\n');
            errors.forEach(error => {
                console.error(`  • ${error}`);
            });
            process.exit(1);
        }
        // Validate npm dependencies for each component
        let dependencyErrors = 0;
        Object.entries(registry.components).forEach(([key, component]) => {
            const depErrors = (0, schema_1.validateNpmDependencies)(component);
            if (depErrors.length > 0) {
                console.warn(`⚠️  Component '${key}' dependency issues:`);
                depErrors.forEach(error => {
                    console.warn(`  • ${error}`);
                });
                dependencyErrors += depErrors.length;
            }
        });
        // Summary
        const componentCount = Object.keys(registry.components).length;
        console.log('✅ Registry validation completed successfully!\n');
        console.log(`📊 Summary:`);
        console.log(`  • Components: ${componentCount}`);
        console.log(`  • Dependency warnings: ${dependencyErrors}`);
        if (dependencyErrors > 0) {
            console.log('\n💡 Dependency warnings are not fatal but should be reviewed.');
        }
    }
    catch (error) {
        console.error('❌ Registry validation failed:');
        console.error(`  ${error}`);
        process.exit(1);
    }
}
// Run validation if called directly
if (require.main === module) {
    validateRegistryFile();
}
//# sourceMappingURL=validate.js.map