import * as fs from 'fs';
import * as path from 'path';
import { ComponentMetadata, RegistryComponent, ComponentFile, CLIError, ERROR_CODES } from '../types';

export interface Registry {
  components: Record<string, RegistryComponent>;
  utils: Record<string, {
    path: string;
    content: string;
    description: string;
  }>;
}

export class RegistryLoader {
  private registryPath: string;
  private cachedRegistry: Registry | null = null;

  constructor(registryPath?: string) {
    this.registryPath = registryPath || path.join(__dirname, 'registry.json');
  }

  /**
   * Load the component registry from JSON file
   */
  async loadRegistry(): Promise<Registry> {
    try {
      if (this.cachedRegistry) {
        return this.cachedRegistry;
      }

      const registryContent = await fs.promises.readFile(this.registryPath, 'utf-8');
      const registry = JSON.parse(registryContent) as Registry;
      
      // Validate the registry structure
      this.validateRegistry(registry);
      
      this.cachedRegistry = registry;
      return registry;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new CLIError(
          'Invalid registry JSON format',
          ERROR_CODES.INVALID_PROJECT,
          ['Check the registry.json file for syntax errors']
        );
      }
      
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new CLIError(
          'Registry file not found',
          ERROR_CODES.NETWORK_ERROR,
          ['Ensure the registry.json file exists', 'Try reinstalling the package']
        );
      }
      
      throw error;
    }
  }

  /**
   * Get a specific component from the registry
   */
  async getComponent(componentName: string): Promise<RegistryComponent | null> {
    const registry = await this.loadRegistry();
    return registry.components[componentName] || null;
  }

  /**
   * Get all available component names
   */
  async getComponentNames(): Promise<string[]> {
    const registry = await this.loadRegistry();
    return Object.keys(registry.components);
  }

  /**
   * Get component metadata only (without full content)
   */
  async getComponentMetadata(componentName: string): Promise<ComponentMetadata | null> {
    const component = await this.getComponent(componentName);
    return component?.metadata || null;
  }

  /**
   * Get all components with their metadata
   */
  async getAllComponents(): Promise<Record<string, RegistryComponent>> {
    const registry = await this.loadRegistry();
    return registry.components;
  }

  /**
   * Get utility functions from the registry
   */
  async getUtils(): Promise<Record<string, { path: string; content: string; description: string }>> {
    const registry = await this.loadRegistry();
    return registry.utils;
  }

  /**
   * Clear the cached registry (useful for testing or updates)
   */
  clearCache(): void {
    this.cachedRegistry = null;
  }

  /**
   * Validate the registry structure
   */
  private validateRegistry(registry: Registry): void {
    if (!registry || typeof registry !== 'object') {
      throw new CLIError(
        'Invalid registry structure: must be an object',
        ERROR_CODES.INVALID_PROJECT
      );
    }

    if (!registry.components || typeof registry.components !== 'object') {
      throw new CLIError(
        'Invalid registry structure: missing components object',
        ERROR_CODES.INVALID_PROJECT
      );
    }

    if (!registry.utils || typeof registry.utils !== 'object') {
      throw new CLIError(
        'Invalid registry structure: missing utils object',
        ERROR_CODES.INVALID_PROJECT
      );
    }

    // Validate each component
    for (const [componentName, component] of Object.entries(registry.components)) {
      this.validateComponent(componentName, component);
    }

    // Validate utils
    for (const [utilName, util] of Object.entries(registry.utils)) {
      this.validateUtil(utilName, util);
    }
  }

  /**
   * Validate a single component structure
   */
  private validateComponent(componentName: string, component: RegistryComponent): void {
    if (!component.metadata) {
      throw new CLIError(
        `Invalid component ${componentName}: missing metadata`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    this.validateComponentMetadata(componentName, component.metadata);

    if (!component.component || !component.component.path || !component.component.content) {
      throw new CLIError(
        `Invalid component ${componentName}: missing component definition`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    // Validate optional utils array
    if (component.utils) {
      if (!Array.isArray(component.utils)) {
        throw new CLIError(
          `Invalid component ${componentName}: utils must be an array`,
          ERROR_CODES.INVALID_PROJECT
        );
      }

      component.utils.forEach((util, index) => {
        this.validateComponentFile(`${componentName}.utils[${index}]`, util);
      });
    }

    // Validate optional types array
    if (component.types) {
      if (!Array.isArray(component.types)) {
        throw new CLIError(
          `Invalid component ${componentName}: types must be an array`,
          ERROR_CODES.INVALID_PROJECT
        );
      }

      component.types.forEach((type, index) => {
        this.validateComponentFile(`${componentName}.types[${index}]`, type);
      });
    }

    // Validate optional examples array
    if (component.examples && !Array.isArray(component.examples)) {
      throw new CLIError(
        `Invalid component ${componentName}: examples must be an array`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Validate component metadata structure
   */
  private validateComponentMetadata(componentName: string, metadata: ComponentMetadata): void {
    const requiredFields = ['name', 'description', 'dependencies', 'files', 'npmDependencies'];
    
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        throw new CLIError(
          `Invalid component ${componentName}: missing metadata field '${field}'`,
          ERROR_CODES.INVALID_PROJECT
        );
      }
    }

    if (!Array.isArray(metadata.dependencies)) {
      throw new CLIError(
        `Invalid component ${componentName}: dependencies must be an array`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    if (!Array.isArray(metadata.files)) {
      throw new CLIError(
        `Invalid component ${componentName}: files must be an array`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    if (!Array.isArray(metadata.npmDependencies)) {
      throw new CLIError(
        `Invalid component ${componentName}: npmDependencies must be an array`,
        ERROR_CODES.INVALID_PROJECT
      );
    }

    // Validate each file in metadata
    metadata.files.forEach((file, index) => {
      this.validateComponentFile(`${componentName}.metadata.files[${index}]`, file);
    });
  }

  /**
   * Validate component file structure
   */
  private validateComponentFile(context: string, file: ComponentFile): void {
    const requiredFields = ['path', 'content', 'type'];
    
    for (const field of requiredFields) {
      if (!(field in file)) {
        throw new CLIError(
          `Invalid file in ${context}: missing field '${field}'`,
          ERROR_CODES.INVALID_PROJECT
        );
      }
    }

    const validTypes = ['component', 'utility', 'type'];
    if (!validTypes.includes(file.type)) {
      throw new CLIError(
        `Invalid file in ${context}: type must be one of ${validTypes.join(', ')}`,
        ERROR_CODES.INVALID_PROJECT
      );
    }
  }

  /**
   * Validate utility structure
   */
  private validateUtil(utilName: string, util: any): void {
    const requiredFields = ['path', 'content', 'description'];
    
    for (const field of requiredFields) {
      if (!(field in util)) {
        throw new CLIError(
          `Invalid util ${utilName}: missing field '${field}'`,
          ERROR_CODES.INVALID_PROJECT
        );
      }
    }
  }
}