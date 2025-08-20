import { CLICommand, CLIError, ERROR_CODES, UserFeedback } from '../types';
import { RegistryLoader } from '../registry/registry-loader';
import { ErrorHandler, NetworkErrorHandler } from '../utils/error-handler';
import { feedback } from '../utils/user-feedback';

export interface DocsCommandOptions {
  format?: 'text' | 'json';
  examples?: boolean;
}

interface DocsCommandDependencies {
  registryLoader: RegistryLoader;
  feedback: UserFeedback;
}

/**
 * Command to show component documentation
 */
export class DocsCommand implements CLICommand {
  name = 'docs';
  description = 'Show documentation for a component';

  private registryLoader: RegistryLoader;
  private feedback: UserFeedback;

  constructor(dependencies?: Partial<DocsCommandDependencies>) {
    this.registryLoader = dependencies?.registryLoader || new RegistryLoader();
    this.feedback = dependencies?.feedback || feedback;
  }

  async execute(args: string[]): Promise<void> {
    try {
      const options = this.parseOptions(args);
      const componentNames = this.extractComponentNames(args);

      if (componentNames.length === 0) {
        await this.showGeneralHelp();
        return;
      }

      if (componentNames.length > 1) {
        this.feedback.warning('Multiple components specified. Showing documentation for the first one.');
      }

      const componentName = componentNames[0];
      await this.showComponentDocs(componentName, options);

    } catch (error) {
      if (error instanceof CLIError) {
        this.feedback.error(ErrorHandler.formatError(error));
        throw error;
      } else {
        const cliError = ErrorHandler.createError(
          ERROR_CODES.REGISTRY_ERROR,
          `Failed to show documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { originalError: error }
        );
        this.feedback.error(ErrorHandler.formatError(cliError));
        throw cliError;
      }
    }
  }

  /**
   * Shows documentation for a specific component
   */
  private async showComponentDocs(componentName: string, options: DocsCommandOptions): Promise<void> {
    this.feedback.info(`Loading documentation for ${componentName}...`);

    // Get component from registry with network retry
    const component = await NetworkErrorHandler.withRetry(
      async () => {
        const comp = await this.registryLoader.getComponent(componentName);
        if (!comp) {
          throw ErrorHandler.createError(
            ERROR_CODES.COMPONENT_NOT_FOUND,
            `Component "${componentName}" not found in registry`,
            { componentName, availableComponents: await this.getAvailableComponentNames() }
          );
        }
        return comp;
      },
      { componentName }
    );

    if (options.format === 'json') {
      this.displayJsonDocs(componentName, component);
    } else {
      this.displayTextDocs(componentName, component, options);
    }
  }

  /**
   * Shows general help and available components
   */
  private async showGeneralHelp(): Promise<void> {
    this.feedback.info('Component Documentation\n');
    
    console.log('Usage: custom-ui docs <component-name> [options]\n');
    console.log('Options:');
    console.log('  --format <format>    Output format (text, json) [default: text]');
    console.log('  --examples           Show usage examples');
    console.log('  -h, --help          Show this help message\n');

    try {
      const componentNames = await this.getAvailableComponentNames();
      
      if (componentNames.length > 0) {
        console.log('Available components:');
        componentNames.forEach(name => {
          console.log(`  ${name}`);
        });
        console.log('\nExample: custom-ui docs button');
      } else {
        this.feedback.warning('No components available in registry');
      }
    } catch (error) {
      this.feedback.warning('Could not load available components');
    }
  }

  /**
   * Displays documentation in text format
   */
  private displayTextDocs(componentName: string, component: any, options: DocsCommandOptions): void {
    console.log(`\n📖 ${componentName.toUpperCase()} COMPONENT\n`);
    
    // Basic information
    console.log(`Description: ${component.metadata.description}\n`);
    
    // Dependencies
    if (component.metadata.dependencies.length > 0) {
      console.log('Component Dependencies:');
      component.metadata.dependencies.forEach((dep: string) => {
        console.log(`  - ${dep}`);
      });
      console.log('');
    }

    // NPM Dependencies
    if (component.metadata.npmDependencies.length > 0) {
      console.log('NPM Dependencies:');
      component.metadata.npmDependencies.forEach((dep: string) => {
        console.log(`  - ${dep}`);
      });
      console.log('');
    }

    // Files
    console.log('Files:');
    component.metadata.files.forEach((file: any) => {
      console.log(`  - ${file.path} (${file.type})`);
    });
    console.log('');

    // Installation command
    console.log('Installation:');
    console.log(`  custom-ui add ${componentName}\n`);

    // Usage examples
    if (options.examples || component.examples) {
      this.displayExamples(componentName, component);
    }

    // Component props (if available in the component content)
    this.displayComponentProps(componentName, component);
  }

  /**
   * Displays documentation in JSON format
   */
  private displayJsonDocs(componentName: string, component: any): void {
    const docs = {
      name: componentName,
      description: component.metadata.description,
      dependencies: component.metadata.dependencies,
      npmDependencies: component.metadata.npmDependencies,
      files: component.metadata.files,
      examples: component.examples || [],
      installation: `custom-ui add ${componentName}`
    };

    console.log(JSON.stringify(docs, null, 2));
  }

  /**
   * Displays usage examples
   */
  private displayExamples(componentName: string, component: any): void {
    console.log('Usage Examples:\n');

    if (component.examples && component.examples.length > 0) {
      component.examples.forEach((example: string, index: number) => {
        console.log(`Example ${index + 1}:`);
        console.log('```tsx');
        console.log(example);
        console.log('```\n');
      });
    } else {
      // Generate basic example based on component name
      const basicExample = this.generateBasicExample(componentName);
      console.log('Basic Usage:');
      console.log('```tsx');
      console.log(basicExample);
      console.log('```\n');
    }
  }

  /**
   * Displays component props extracted from TypeScript interface
   */
  private displayComponentProps(componentName: string, component: any): void {
    try {
      const componentContent = component.component.content;
      const propsInterface = this.extractPropsInterface(componentContent);
      
      if (propsInterface) {
        console.log('Props:');
        console.log('```typescript');
        console.log(propsInterface);
        console.log('```\n');
      }
    } catch (error) {
      // Silently fail if we can't extract props
    }
  }

  /**
   * Extracts props interface from component content
   */
  private extractPropsInterface(content: string): string | null {
    // Simple regex to extract interface definitions
    const interfaceRegex = /interface\s+\w*Props[^{]*\{[^}]*\}/g;
    const matches = content.match(interfaceRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }

    // Try to extract type definitions
    const typeRegex = /type\s+\w*Props[^=]*=\s*[^;]+;/g;
    const typeMatches = content.match(typeRegex);
    
    if (typeMatches && typeMatches.length > 0) {
      return typeMatches[0];
    }

    return null;
  }

  /**
   * Generates a basic usage example for a component
   */
  private generateBasicExample(componentName: string): string {
    const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    
    switch (componentName.toLowerCase()) {
      case 'button':
        return `import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <Button variant="default" size="default">
      Click me
    </Button>
  )
}`;
      
      case 'input':
        return `import { Input } from "@/components/ui/input"

export function Example() {
  return (
    <Input 
      type="text" 
      placeholder="Enter text..." 
    />
  )
}`;
      
      case 'card':
        return `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
    </Card>
  )
}`;
      
      default:
        return `import { ${capitalizedName} } from "@/components/ui/${componentName}"

export function Example() {
  return (
    <${capitalizedName} />
  )
}`;
    }
  }

  /**
   * Gets list of available component names
   */
  private async getAvailableComponentNames(): Promise<string[]> {
    try {
      const components = await this.registryLoader.getAllComponents();
      return Object.keys(components).sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Parses command line options
   */
  private parseOptions(args: string[]): DocsCommandOptions {
    const options: DocsCommandOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--format':
          if (i + 1 < args.length) {
            const format = args[++i];
            if (format === 'text' || format === 'json') {
              options.format = format;
            }
          }
          break;
        case '--examples':
          options.examples = true;
          break;
      }
    }

    return options;
  }

  /**
   * Extracts component names from arguments (non-option arguments)
   */
  private extractComponentNames(args: string[]): string[] {
    const components: string[] = [];
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // Skip options and their values
      if (arg.startsWith('-')) {
        if (arg === '--format') {
          i++; // Skip the next argument (the format value)
        }
        continue;
      }
      
      components.push(arg);
    }

    return components;
  }
}