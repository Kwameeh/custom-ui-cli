/**
 * Comprehensive usage examples and documentation for components
 */

export interface ComponentExample {
  title: string;
  description: string;
  code: string;
  props?: Record<string, string>;
}

export interface ComponentDocumentation {
  name: string;
  description: string;
  props: Record<string, {
    type: string;
    description: string;
    default?: string;
    required?: boolean;
  }>;
  examples: ComponentExample[];
  dependencies: string[];
  installation: string;
}

export const componentDocs: Record<string, ComponentDocumentation> = {
  button: {
    name: "Button",
    description: "A customizable button component with multiple variants and sizes. Built with class-variance-authority for consistent styling.",
    props: {
      variant: {
        type: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
        description: "The visual style variant of the button",
        default: "'default'"
      },
      size: {
        type: "'default' | 'sm' | 'lg' | 'icon'",
        description: "The size of the button",
        default: "'default'"
      },
      asChild: {
        type: "boolean",
        description: "Change the default rendered element for the one passed as a child, merging their props and behavior",
        default: "false"
      }
    },
    examples: [
      {
        title: "Basic Usage",
        description: "Simple button with default styling",
        code: `<Button>Click me</Button>`
      },
      {
        title: "Button Variants",
        description: "Different visual styles for various use cases",
        code: `<div className="flex gap-2">
  <Button variant="default">Default</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
</div>`
      },
      {
        title: "Button Sizes",
        description: "Different sizes for various contexts",
        code: `<div className="flex items-center gap-2">
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
  <Button size="icon">
    <Plus className="h-4 w-4" />
  </Button>
</div>`
      },
      {
        title: "As Child Component",
        description: "Using the button as a wrapper for other elements",
        code: `<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>`
      }
    ],
    dependencies: ["@radix-ui/react-slot", "class-variance-authority"],
    installation: "npx custom-ui add button"
  },

  input: {
    name: "Input",
    description: "A customizable input component with proper TypeScript props and forwarded refs. Supports all standard HTML input attributes.",
    props: {
      type: {
        type: "string",
        description: "The type of input (text, email, password, etc.)",
        default: "'text'"
      },
      placeholder: {
        type: "string",
        description: "Placeholder text for the input"
      },
      disabled: {
        type: "boolean",
        description: "Whether the input is disabled",
        default: "false"
      }
    },
    examples: [
      {
        title: "Basic Input",
        description: "Simple text input with placeholder",
        code: `<Input placeholder="Enter your name" />`
      },
      {
        title: "Different Input Types",
        description: "Various input types for different data",
        code: `<div className="space-y-2">
  <Input type="text" placeholder="Full name" />
  <Input type="email" placeholder="Email address" />
  <Input type="password" placeholder="Password" />
  <Input type="number" placeholder="Age" />
</div>`
      },
      {
        title: "Controlled Input",
        description: "Input with controlled value using React state",
        code: `const [value, setValue] = useState("");

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Controlled input"
/>`
      },
      {
        title: "Disabled Input",
        description: "Disabled input for read-only scenarios",
        code: `<Input disabled placeholder="This input is disabled" />`
      }
    ],
    dependencies: [],
    installation: "npx custom-ui add input"
  },

  card: {
    name: "Card",
    description: "A flexible card component with header, content, and footer sections. Perfect for displaying grouped information.",
    props: {
      className: {
        type: "string",
        description: "Additional CSS classes to apply to the card"
      }
    },
    examples: [
      {
        title: "Basic Card",
        description: "Simple card with title and content",
        code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>This is the card content area.</p>
  </CardContent>
</Card>`
      },
      {
        title: "Card with Footer",
        description: "Card with action buttons in the footer",
        code: `<Card>
  <CardHeader>
    <CardTitle>Confirm Action</CardTitle>
    <CardDescription>Are you sure you want to proceed?</CardDescription>
  </CardHeader>
  <CardContent>
    <p>This action cannot be undone.</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </CardFooter>
</Card>`
      },
      {
        title: "Profile Card",
        description: "Example of a user profile card",
        code: `<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>John Doe</CardTitle>
    <CardDescription>Software Engineer</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-muted-foreground">
          Passionate about creating great user experiences
        </p>
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">View Profile</Button>
  </CardFooter>
</Card>`
      }
    ],
    dependencies: [],
    installation: "npx custom-ui add card"
  },

  dialog: {
    name: "Dialog",
    description: "A modal dialog component built on Radix UI primitives. Provides accessible modal functionality with overlay and content sections.",
    props: {
      open: {
        type: "boolean",
        description: "Whether the dialog is open"
      },
      onOpenChange: {
        type: "(open: boolean) => void",
        description: "Callback when the dialog open state changes"
      }
    },
    examples: [
      {
        title: "Basic Dialog",
        description: "Simple dialog with trigger button",
        code: `<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a dialog description that explains what the dialog is for.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`
      },
      {
        title: "Controlled Dialog",
        description: "Dialog with controlled open state",
        code: `const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Controlled Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
    </DialogHeader>
    <p>This dialog's state is controlled by React state.</p>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`
      },
      {
        title: "Form Dialog",
        description: "Dialog containing a form",
        code: `<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input id="name" defaultValue="John Doe" className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="username" className="text-right">
          Username
        </Label>
        <Input id="username" defaultValue="@johndoe" className="col-span-3" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`
      }
    ],
    dependencies: ["@radix-ui/react-dialog", "lucide-react"],
    installation: "npx custom-ui add dialog"
  },

  badge: {
    name: "Badge",
    description: "A badge component with variant support for displaying status, labels, or categories.",
    props: {
      variant: {
        type: "'default' | 'secondary' | 'destructive' | 'outline'",
        description: "The visual style variant of the badge",
        default: "'default'"
      }
    },
    examples: [
      {
        title: "Basic Badges",
        description: "Different badge variants",
        code: `<div className="flex gap-2">
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="outline">Outline</Badge>
</div>`
      },
      {
        title: "Status Badges",
        description: "Using badges to show status",
        code: `<div className="space-y-2">
  <div className="flex items-center gap-2">
    <span>Order Status:</span>
    <Badge variant="secondary">Pending</Badge>
  </div>
  <div className="flex items-center gap-2">
    <span>Payment:</span>
    <Badge>Completed</Badge>
  </div>
  <div className="flex items-center gap-2">
    <span>Shipping:</span>
    <Badge variant="destructive">Failed</Badge>
  </div>
</div>`
      },
      {
        title: "Category Tags",
        description: "Using badges as category tags",
        code: `<div className="flex flex-wrap gap-1">
  <Badge variant="outline">React</Badge>
  <Badge variant="outline">TypeScript</Badge>
  <Badge variant="outline">Tailwind CSS</Badge>
  <Badge variant="outline">Next.js</Badge>
</div>`
      }
    ],
    dependencies: ["class-variance-authority"],
    installation: "npx custom-ui add badge"
  },

  alert: {
    name: "Alert",
    description: "An alert component with different severity levels for displaying important messages to users.",
    props: {
      variant: {
        type: "'default' | 'destructive'",
        description: "The visual style variant of the alert",
        default: "'default'"
      }
    },
    examples: [
      {
        title: "Basic Alert",
        description: "Simple informational alert",
        code: `<Alert>
  <AlertTitle>Heads up!</Alert>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>`
      },
      {
        title: "Destructive Alert",
        description: "Alert for errors or warnings",
        code: `<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>`
      },
      {
        title: "Alert with Icon",
        description: "Alert with custom icon",
        code: `<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Terminal</AlertTitle>
  <AlertDescription>
    You can add components and dependencies to your app using the cli.
  </AlertDescription>
</Alert>`
      }
    ],
    dependencies: ["class-variance-authority"],
    installation: "npx custom-ui add alert"
  },

  separator: {
    name: "Separator",
    description: "A separator component for layout divisions with horizontal and vertical orientations. Built on Radix UI primitives.",
    props: {
      orientation: {
        type: "'horizontal' | 'vertical'",
        description: "The orientation of the separator",
        default: "'horizontal'"
      },
      decorative: {
        type: "boolean",
        description: "Whether the separator is decorative (not announced by screen readers)",
        default: "true"
      }
    },
    examples: [
      {
        title: "Horizontal Separator",
        description: "Default horizontal separator",
        code: `<div>
  <div className="space-y-1">
    <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
    <p className="text-sm text-muted-foreground">
      An open-source UI component library.
    </p>
  </div>
  <Separator className="my-4" />
  <div className="flex h-5 items-center space-x-4 text-sm">
    <div>Blog</div>
    <Separator orientation="vertical" />
    <div>Docs</div>
    <Separator orientation="vertical" />
    <div>Source</div>
  </div>
</div>`
      },
      {
        title: "Vertical Separator",
        description: "Vertical separator for inline content",
        code: `<div className="flex items-center space-x-2">
  <span>Home</span>
  <Separator orientation="vertical" className="h-4" />
  <span>Products</span>
  <Separator orientation="vertical" className="h-4" />
  <span>About</span>
</div>`
      },
      {
        title: "Menu Separator",
        description: "Using separator in a menu context",
        code: `<div className="w-48 p-2 border rounded-md">
  <div className="px-2 py-1 text-sm">Profile</div>
  <div className="px-2 py-1 text-sm">Settings</div>
  <Separator className="my-1" />
  <div className="px-2 py-1 text-sm">Help</div>
  <div className="px-2 py-1 text-sm text-red-600">Sign out</div>
</div>`
      }
    ],
    dependencies: ["@radix-ui/react-separator"],
    installation: "npx custom-ui add separator"
  }
};