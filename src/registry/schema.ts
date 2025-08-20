/**
 * Schema definitions and validation for the component registry
 */

export interface ComponentFile {
  path: string;
  content: string;
  type: 'component' | 'utility' | 'type';
}

export interface ComponentMetadata {
  name: string;
  description: string;
  dependencies: string[];
  files: ComponentFile[];
  npmDependencies: string[];
}

export interface RegistryComponent {
  metadata: ComponentMetadata;
  component: {
    path: string;
    content: string;
  };
  utils?: ComponentFile[];
  types?: ComponentFile[];
  examples?: string[];
}

export interface ComponentRegistry {
  components: Record<string, RegistryComponent>;
  utils?: Record<string, ComponentFile>;
  version?: string;
  lastUpdated?: string;
}

/**
 * Validates a component file structure
 */
export function validateComponentFile(file: ComponentFile): string[] {
  const errors: string[] = [];
  
  if (!file.path || typeof file.path !== 'string') {
    errors.push('Component file must have a valid path');
  }
  
  if (!file.content || typeof file.content !== 'string') {
    errors.push('Component file must have content');
  }
  
  if (!file.type || !['component', 'utility', 'type'].includes(file.type)) {
    errors.push('Component file must have a valid type (component, utility, or type)');
  }
  
  return errors;
}

/**
 * Validates component metadata
 */
export function validateComponentMetadata(metadata: ComponentMetadata): string[] {
  const errors: string[] = [];
  
  if (!metadata.name || typeof metadata.name !== 'string') {
    errors.push('Component must have a valid name');
  }
  
  if (!metadata.description || typeof metadata.description !== 'string') {
    errors.push('Component must have a description');
  }
  
  if (!Array.isArray(metadata.dependencies)) {
    errors.push('Component dependencies must be an array');
  }
  
  if (!Array.isArray(metadata.files)) {
    errors.push('Component files must be an array');
  } else {
    metadata.files.forEach((file, index) => {
      const fileErrors = validateComponentFile(file);
      fileErrors.forEach(error => {
        errors.push(`File ${index}: ${error}`);
      });
    });
  }
  
  if (!Array.isArray(metadata.npmDependencies)) {
    errors.push('Component npmDependencies must be an array');
  }
  
  return errors;
}

/**
 * Validates a registry component
 */
export function validateRegistryComponent(component: RegistryComponent): string[] {
  const errors: string[] = [];
  
  // Validate metadata
  if (!component.metadata) {
    errors.push('Component must have metadata');
  } else {
    const metadataErrors = validateComponentMetadata(component.metadata);
    errors.push(...metadataErrors);
  }
  
  // Validate component structure
  if (!component.component) {
    errors.push('Component must have a component definition');
  } else {
    if (!component.component.path || typeof component.component.path !== 'string') {
      errors.push('Component must have a valid path');
    }
    
    if (!component.component.content || typeof component.component.content !== 'string') {
      errors.push('Component must have content');
    }
  }
  
  // Validate utils if present
  if (component.utils) {
    if (!Array.isArray(component.utils)) {
      errors.push('Component utils must be an array');
    } else {
      component.utils.forEach((util, index) => {
        const utilErrors = validateComponentFile(util);
        utilErrors.forEach(error => {
          errors.push(`Util ${index}: ${error}`);
        });
      });
    }
  }
  
  // Validate examples if present
  if (component.examples) {
    if (!Array.isArray(component.examples)) {
      errors.push('Component examples must be an array');
    } else {
      component.examples.forEach((example, index) => {
        if (typeof example !== 'string') {
          errors.push(`Example ${index} must be a string`);
        }
      });
    }
  }
  
  return errors;
}

/**
 * Validates the entire component registry
 */
export function validateRegistry(registry: ComponentRegistry): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!registry.components || typeof registry.components !== 'object') {
    errors.push('Registry must have a components object');
    return { isValid: false, errors };
  }
  
  // Validate each component
  Object.entries(registry.components).forEach(([key, component]) => {
    const componentErrors = validateRegistryComponent(component);
    componentErrors.forEach(error => {
      errors.push(`Component '${key}': ${error}`);
    });
  });
  
  // Validate utils if present
  if (registry.utils) {
    if (typeof registry.utils !== 'object') {
      errors.push('Registry utils must be an object');
    } else {
      Object.entries(registry.utils).forEach(([key, util]) => {
        const utilErrors = validateComponentFile(util);
        utilErrors.forEach(error => {
          errors.push(`Util '${key}': ${error}`);
        });
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that required npm dependencies are present
 */
export function validateNpmDependencies(component: RegistryComponent): string[] {
  const errors: string[] = [];
  const requiredDeps = component.metadata.npmDependencies;
  
  // Check if component content uses dependencies that aren't listed
  const content = component.component.content;
  
  // Common patterns to check
  const patterns = [
    { pattern: /@radix-ui\/react-/, dep: '@radix-ui/react-*' },
    { pattern: /from ["']class-variance-authority["']/, dep: 'class-variance-authority' },
    { pattern: /from ["']clsx["']/, dep: 'clsx' },
    { pattern: /from ["']tailwind-merge["']/, dep: 'tailwind-merge' },
    { pattern: /from ["']lucide-react["']/, dep: 'lucide-react' }
  ];
  
  patterns.forEach(({ pattern, dep }) => {
    if (pattern.test(content)) {
      const actualDep = dep === '@radix-ui/react-*' 
        ? content.match(/@radix-ui\/react-[\w-]+/)?.[0]
        : dep;
      
      if (actualDep && !requiredDeps.includes(actualDep)) {
        errors.push(`Component uses ${actualDep} but it's not listed in npmDependencies`);
      }
    }
  });
  
  return errors;
}