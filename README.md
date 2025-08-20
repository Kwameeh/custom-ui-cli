# Custom UI CLI

A CLI tool for installing and managing custom UI components, similar to shadcn/ui. Build beautiful, accessible React components with TypeScript and Tailwind CSS.

## Features

- 🎨 **Beautiful Components**: Pre-built, customizable UI components
- 🔧 **TypeScript First**: Full TypeScript support with proper type definitions
- 🎯 **Tailwind CSS**: Styled with Tailwind CSS for easy customization
- ♿ **Accessible**: Built on Radix UI primitives for accessibility
- 📦 **Copy & Paste**: Components are copied to your project, not imported as dependencies
- 🚀 **Framework Agnostic**: Works with Next.js, Vite, Create React App, and more

## Installation

```bash
npx @custom-ui/cli@latest init
```

## Usage

### Initialize your project

```bash
npx @custom-ui/cli init
```

This will:
- Detect your project type (Next.js, Vite, etc.)
- Create the necessary folder structure
- Install required dependencies (Tailwind CSS, etc.)
- Set up configuration files

### Add components

```bash
# Add a single component
npx @custom-ui/cli add button

# Add multiple components
npx @custom-ui/cli add button input card
```

### List available components

```bash
npx @custom-ui/cli list
```

### View component documentation

```bash
npx @custom-ui/cli docs button
```

## Available Components

| Component | Description |
|-----------|-------------|
| `button` | Customizable button with variants and sizes |
| `input` | Input field with proper TypeScript props |
| `card` | Flexible card with header, content, and footer |
| `dialog` | Modal dialog with overlay and content |
| `badge` | Badge component for status and labels |
| `alert` | Alert component for important messages |
| `separator` | Separator for layout divisions |

## Component Examples

### Button

```tsx
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}
```

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CardDemo() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Get started by creating a new project.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  )
}
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Project Structure

After running `init`, your project will have the following structure:

```
your-project/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   └── utils.ts
└── ...
```

## Configuration

The CLI creates a configuration file at `.custom-ui/config.json`:

```json
{
  "componentsDir": "components/ui",
  "utilsDir": "lib",
  "cssFramework": "tailwind",
  "typescript": true,
  "projectType": "nextjs"
}
```

## Dependencies

Components may require the following dependencies:

- `@radix-ui/react-*` - Accessible component primitives
- `class-variance-authority` - For component variants
- `clsx` - Conditional class names
- `tailwind-merge` - Merge Tailwind classes
- `lucide-react` - Icons

These are automatically installed when you add components that require them.

## Customization

Since components are copied to your project, you have full control over them:

1. **Styling**: Modify the Tailwind classes directly in the component files
2. **Behavior**: Add or modify component logic as needed
3. **Props**: Extend component interfaces with additional props
4. **Variants**: Add new variants using `class-variance-authority`

## TypeScript Support

All components are written in TypeScript with proper type definitions:

```tsx
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

## Framework Support

The CLI supports the following frameworks:

- **Next.js** - Automatic detection and configuration
- **Vite** - React + TypeScript projects
- **Create React App** - Standard CRA projects
- **Generic React** - Any React project with TypeScript

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](https://github.com/custom-ui/cli#readme)
- 🐛 [Issues](https://github.com/custom-ui/cli/issues)
- 💬 [Discussions](https://github.com/custom-ui/cli/discussions)

---

Built with ❤️ by the Custom UI team.