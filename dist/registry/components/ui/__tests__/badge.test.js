"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const badge_1 = require("../badge");
describe('Badge', () => {
    it('renders badge with text content', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { children: "Test Badge" }));
        expect(react_1.screen.getByText('Test Badge')).toBeInTheDocument();
    });
    it('applies default variant classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { children: "Default Badge" }));
        const badge = react_1.screen.getByText('Default Badge');
        expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });
    it('applies secondary variant classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "secondary", children: "Secondary Badge" }));
        const badge = react_1.screen.getByText('Secondary Badge');
        expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
    it('applies destructive variant classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "destructive", children: "Destructive Badge" }));
        const badge = react_1.screen.getByText('Destructive Badge');
        expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
    it('applies outline variant classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", children: "Outline Badge" }));
        const badge = react_1.screen.getByText('Outline Badge');
        expect(badge).toHaveClass('text-foreground');
        expect(badge).not.toHaveClass('border-transparent');
    });
    it('applies custom className', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "custom-badge", children: "Custom Badge" }));
        const badge = react_1.screen.getByText('Custom Badge');
        expect(badge).toHaveClass('custom-badge');
    });
    it('forwards HTML attributes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { "data-testid": "test-badge", id: "badge-id", children: "Badge" }));
        const badge = react_1.screen.getByTestId('test-badge');
        expect(badge).toHaveAttribute('id', 'badge-id');
    });
    it('renders as div element', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { children: "Badge Content" }));
        const badge = react_1.screen.getByText('Badge Content');
        expect(badge.tagName).toBe('DIV');
    });
    it('has proper base classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { children: "Base Badge" }));
        const badge = react_1.screen.getByText('Base Badge');
        expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');
    });
    it('supports focus ring classes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(badge_1.Badge, { children: "Focusable Badge" }));
        const badge = react_1.screen.getByText('Focusable Badge');
        expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
});
//# sourceMappingURL=badge.test.js.map