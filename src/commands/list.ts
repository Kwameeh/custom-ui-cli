import { CLICommand, CLIError, ERROR_CODES, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
import { ErrorHandler, NetworkErrorHandler } from '../utils/error-handler';
import { feedback } from '../utils/user-feedback';

export interface ListCommandOptions {
  verbose?: boolean;
  category?: string;
  search?: string;
}

interface ListCommandDependencies {
  registryLoader: RegistryLoader;
  feedback: UserFeedback;
}

/**
 * Command to list available components
 */
export class ListCommand implements CLICommand {
  name = 'list';
  description = 'List all available components';

  private registryLoader: RegistryLoader;
  private feedback: UserFeedback;

  constructor(dependencies?: Partial<ListCommandDependencies>) {
    this.registryLoader = dependencies?.registryLoader || new RegistryLoader();
    this.feedback = dependencies?.feedback || feedback;
  }

  async execute(args: string[]): Promise<void> {
    try {
      const options = this.parseOptions(args);
      
      this.feedback.info('Loading component registry...');
      
      // Load components with network retry
      const components = await NetworkErrorHandler.withRetry(
        () => this.registryLoader.getAllComponents(),
        { operation: 'fetch component list' }
      );

      if (Object.keys(components).length === 0) {
        this.feedback.warning('No components found in registry');
        return;
      }

      // Filter components based on options
      const filteredComponents = this.filterComponents(components, options);
      
      if (Object.keys(filteredComponents).length === 0) {
        this.feedback.warning('No components match the specified criteria');
        return;
      }

      // Display components
      this.displayComponents(filteredComponents, options);
      
      this.feedback.info(`\nFound ${Object.keys(filteredComponents).length} component(s)`);
      this.feedback.info('Use "custom-ui add <component>" to install a component');
      this.feedback.info('Use "custom-ui docs <component>" to see documentation');

    } catch (error) {
      if (error instanceof CLIError) {
        this.feedback.error(ErrorHandler.formatError(error));
        throw error;
      } else {
        const cliError = ErrorHandler.createError(
          ERROR_CODES.REGISTRY_ERROR,
          `Failed to list components: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { originalError: error }
        );
        this.feedback.error(ErrorHandler.formatError(cliError));
        throw cliError;
      }
    }
  }

  /**
   * Filters components based on search criteria
   */
  private filterComponents(components: any, options: ListCommandOptions): any {
    let filtered = { ...components };

    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([name, component]: [string, any]) => {
          return (
            name.toLowerCase().includes(searchTerm) ||
            component.metadata.description.toLowerCase().includes(searchTerm)
          );
        })
      );
    }

    // Filter by category (if we had categories in the future)
    if (options.category) {
      // For now, we don't have categories, but this is where we'd filter
      this.feedback.warning('Category filtering not yet implemented');
    }

    return filtered;
  }

  /**
   * Displays components in a formatted list
   */
  private displayComponents(components: any, options: ListCommandOptions): void {
    this.feedback.info('\nAvailable Components:\n');

    const componentEntries = Object.entries(components);
    
    if (options.verbose) {
      // Verbose output with full details
      componentEntries.forEach(([name, component]: [string, any]) => {
        this.displayVerboseComponent(name, component);
      });
    } else {
      // Compact output
      componentEntries.forEach(([name, component]: [string, any]) => {
        this.displayCompactComponent(name, component);
      });
    }
  }

  /**
   * Displays a component in verbose format
   */
  private displayVerboseComponent(name: string, component: any): void {
    console.log(`📦 ${name}`);
    console.log(`   Description: ${component.metadata.description}`);
    
    if (component.metadata.dependencies.length > 0) {
      console.log(`   Dependencies: ${component.metadata.dependencies.join(', ')}`);
    }
    
    if (component.metadata.npmDependencies.length > 0) {
      console.log(`   NPM Dependencies: ${component.metadata.npmDependencies.join(', ')}`);
    }
    
    console.log(`   Files: ${component.metadata.files.length} file(s)`);
    console.log('');
  }

  /**
   * Displays a component in compact format
   */
  private displayCompactComponent(name: string, component: any): void {
    const padding = ' '.repeat(Math.max(0, 15 - name.length));
    console.log(`  ${name}${padding} - ${component.metadata.description}`);
  }

  /**
   * Parses command line options
   */
  private parseOptions(args: string[]): ListCommandOptions {
    const options: ListCommandOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--category':
        case '-c':
          if (i + 1 < args.length) {
            options.category = args[++i];
          }
          break;
        case '--search':
        case '-s':
          if (i + 1 < args.length) {
            options.search = args[++i];
          }
          break;
      }
    }

    return options;
  }
}