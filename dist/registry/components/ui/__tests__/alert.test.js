"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
const alert_1 = require("../alert");
describe('Alert', () => {
    it('renders alert with content', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { children: "Alert content" }));
        expect(react_2.screen.getByText('Alert content')).toBeInTheDocument();
    });
    it('has proper role attribute', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { children: "Alert message" }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
    });
    it('applies default variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { children: "Default Alert" }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toHaveClass('bg-background', 'text-foreground');
    });
    it('applies destructive variant classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { variant: "destructive", children: "Destructive Alert" }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });
    it('applies custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { className: "custom-alert", children: "Custom Alert" }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toHaveClass('custom-alert');
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { ref: ref, children: "Alert with ref" }));
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
    it('has proper base classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.Alert, { children: "Base Alert" }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4');
    });
});
describe('AlertTitle', () => {
    it('renders alert title', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Alert Title" }));
        expect(react_2.screen.getByText('Alert Title')).toBeInTheDocument();
    });
    it('renders as h5 element', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Title" }));
        const title = react_2.screen.getByText('Title');
        expect(title.tagName).toBe('H5');
    });
    it('applies proper classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Styled Title" }));
        const title = react_2.screen.getByText('Styled Title');
        expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
    });
    it('applies custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { className: "custom-title", children: "Custom Title" }));
        const title = react_2.screen.getByText('Custom Title');
        expect(title).toHaveClass('custom-title');
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { ref: ref, children: "Title with ref" }));
        expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
});
describe('AlertDescription', () => {
    it('renders alert description', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { children: "Alert Description" }));
        expect(react_2.screen.getByText('Alert Description')).toBeInTheDocument();
    });
    it('renders as div element', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { children: "Description" }));
        const description = react_2.screen.getByText('Description');
        expect(description.tagName).toBe('DIV');
    });
    it('applies proper classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { children: "Styled Description" }));
        const description = react_2.screen.getByText('Styled Description');
        expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
    });
    it('applies custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { className: "custom-desc", children: "Custom Description" }));
        const description = react_2.screen.getByText('Custom Description');
        expect(description).toHaveClass('custom-desc');
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { ref: ref, children: "Description with ref" }));
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});
describe('Alert with Title and Description', () => {
    it('renders complete alert with title and description', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsxs)(alert_1.Alert, { children: [(0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Warning" }), (0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { children: "This is a warning message." })] }));
        expect(react_2.screen.getByText('Warning')).toBeInTheDocument();
        expect(react_2.screen.getByText('This is a warning message.')).toBeInTheDocument();
    });
    it('renders destructive alert with icon support', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsxs)(alert_1.Alert, { variant: "destructive", children: [(0, jsx_runtime_1.jsx)("svg", { "data-testid": "alert-icon" }), (0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Error" }), (0, jsx_runtime_1.jsx)(alert_1.AlertDescription, { children: "Something went wrong." })] }));
        const alert = react_2.screen.getByRole('alert');
        expect(alert).toHaveClass('text-destructive');
        expect(react_2.screen.getByTestId('alert-icon')).toBeInTheDocument();
        expect(react_2.screen.getByText('Error')).toBeInTheDocument();
        expect(react_2.screen.getByText('Something went wrong.')).toBeInTheDocument();
    });
});
//# sourceMappingURL=alert.test.js.map