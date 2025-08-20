#!/usr/bin/env node

/**
 * Registry validation script
 * Validates the component registry against the schema
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateRegistry, validateNpmDependencies, ComponentRegistry } from './schema';

function loadRegistry(): ComponentRegistry {
  const registryPath = path.join(__dirname, 'registry.json');
  
  if (!fs.existsSync(registryPath)) {
    throw new Error('Registry file not found');
  }
  
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  
  try {
    return JSON.parse(registryContent);
  } catch (error) {
    throw new Error(`Invalid JSON in registry file: ${error}`);
  }
}

function validateRegistryFile(): void {
  console.log('🔍 Validating component registry...\n');
  
  try {
    const registry = loadRegistry();
    
    // Validate registry structure
    const { isValid, errors } = validateRegistry(registry);
    
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
      const depErrors = validateNpmDependencies(component);
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
    
  } catch (error) {
    console.error('❌ Registry validation failed:');
    console.error(`  ${error}`);
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateRegistryFile();
}

export { validateRegistryFile };