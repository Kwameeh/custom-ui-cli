"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const button_1 = require("../button");
describe('Button', () => {
    it('renders correctly', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { children: "Click me" }));
        expect(react_2.screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
    it('applies default variant and size classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { children: "Default Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-10', 'px-4', 'py-2');
    });
    it('applies destructive variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "destructive", children: "Destructive Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
    it('applies outline variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "Outline Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });
    it('applies secondary variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", children: "Secondary Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
    it('applies ghost variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", children: "Ghost Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });
    it('applies link variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "link", children: "Link Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
    it('applies small size classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", children: "Small Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('h-9', 'px-3');
    });
    it('applies large size classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { size: "lg", children: "Large Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('h-11', 'px-8');
    });
    it('applies icon size classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { size: "icon", children: "Icon" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('h-10', 'w-10');
    });
    it('forwards custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { className: "custom-class", children: "Custom Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });
    it('handles click events', async () => {
        const user = user_event_1.default.setup();
        const handleClick = jest.fn();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleClick, children: "Clickable Button" }));
        await user.click(react_2.screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { ref: ref, children: "Button with ref" }));
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
    it('supports disabled state', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { disabled: true, children: "Disabled Button" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
    it('supports custom HTML attributes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", "data-testid": "submit-btn", children: "Submit" }));
        const button = react_2.screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveAttribute('data-testid', 'submit-btn');
    });
});
//# sourceMappingURL=button.test.js.map