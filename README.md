# Custom UI CLI

A powerful CLI tool for installing and managing custom UI components in React projects.

## Features

- 🚀 **Easy Installation**: Initialize custom-ui in any React project
- 📦 **Component Management**: Add, list, and manage UI components
- 🎨 **Multiple Frameworks**: Support for Tailwind CSS, CSS Modules, and Styled Components
- 🔧 **Project Detection**: Automatically detects Next.js, Vite, CRA, and generic React projects
- 📚 **Documentation**: Built-in component documentation
- ✅ **TypeScript Support**: Full TypeScript support with proper type definitions

## Installation

### Global Installation
```bash
npm install -g @kwameeh_1/custom-ui-cli
```

### Use with npx (Recommended)
```bash
npx @kwameeh_1/custom-ui-cli init
```

## Quick Start

1. **Initialize in your project:**
   ```bash
   npx @kwameeh_1/custom-ui-cli init
   ```

2. **Add components:**
   ```bash
   npx @kwameeh_1/custom-ui-cli add button
   npx @kwameeh_1/custom-ui-cli add dialog
   ```

3. **List available components:**
   ```bash
   npx @kwameeh_1/custom-ui-cli list
   ```

4. **View component documentation:**
   ```bash
   npx @kwameeh_1/custom-ui-cli docs button
   ```

## Commands

### `init`
Initialize custom-ui in your project.

```bash
npx @kwameeh_1/custom-ui-cli init [options]
```

**Options:**
- `-f, --force` - Overwrite existing configuration
- `--skip-deps` - Skip dependency installation
- `--components-dir <dir>` - Custom components directory
- `--utils-dir <dir>` - Custom utils directory

### `add`
Add components to your project.

```bash
npx @kwameeh_1/custom-ui-cli add [components...]
```

**Examples:**
```bash
npx @kwameeh_1/custom-ui-cli add button
npx @kwameeh_1/custom-ui-cli add button dialog alert
npx @kwameeh_1/custom-ui-cli add --all
```

### `list`
List all available components.

```bash
npx @kwameeh_1/custom-ui-cli list [options]
```

**Options:**
- `--installed` - Show only installed components
- `--available` - Show only available components

### `docs`
Show documentation for a component.

```bash
npx @kwameeh_1/custom-ui-cli docs <component>
```

## Supported Frameworks

- **Next.js** (App Router & Pages Router)
- **Vite**
- **Create React App**
- **Generic React Projects**

## Supported CSS Frameworks

- **Tailwind CSS** (Recommended)
- **CSS Modules**
- **Styled Components**

## Available Components

- **Alert** - Flexible alert component with variants
- **Badge** - Small status indicators
- **Button** - Customizable button component
- **Dialog** - Modal dialog with accessibility features
- **Separator** - Visual divider component
- And more...

## Configuration

The CLI creates a `custom-ui.json` configuration file in your project root:

```json
{
  "componentsDir": "components/ui",
  "utilsDir": "lib",
  "cssFramework": "tailwind",
  "typescript": true,
  "projectType": "nextjs"
}
```

## Development

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Setup
```bash
git clone https://github.com/Kwameeh/custom-ui-cli.git
cd custom-ui-cli
npm install
npm run build
```

### Testing
```bash
npm test
npm run test:watch
npm run test:integration
```

### Building
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/Kwameeh/custom-ui-cli#readme)
- 🐛 [Report Issues](https://github.com/Kwameeh/custom-ui-cli/issues)
- 💬 [Discussions](https://github.com/Kwameeh/custom-ui-cli/discussions)

## Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js/)
- UI components powered by [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Testing with [Jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/)