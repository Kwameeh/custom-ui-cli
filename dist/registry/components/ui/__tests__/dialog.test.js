"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const dialog_1 = require("../dialog");
describe('Dialog', () => {
    it('renders dialog trigger', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTrigger, { children: "Open Dialog" }) }));
        expect(react_1.screen.getByText('Open Dialog')).toBeInTheDocument();
    });
    it('opens dialog when trigger is clicked', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsxs)(dialog_1.Dialog, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTrigger, { children: "Open Dialog" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Dialog Title" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "Dialog Description" })] }) })] }));
        react_1.fireEvent.click(react_1.screen.getByText('Open Dialog'));
        expect(react_1.screen.getByText('Dialog Title')).toBeInTheDocument();
        expect(react_1.screen.getByText('Dialog Description')).toBeInTheDocument();
    });
    it('renders dialog header with title and description', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { defaultOpen: true, children: (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Test Title" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "Test Description" })] }) }) }));
        expect(react_1.screen.getByText('Test Title')).toBeInTheDocument();
        expect(react_1.screen.getByText('Test Description')).toBeInTheDocument();
    });
    it('renders dialog footer', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { defaultOpen: true, children: (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogFooter, { children: [(0, jsx_runtime_1.jsx)("button", { children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { children: "Save" })] }) }) }));
        expect(react_1.screen.getByText('Cancel')).toBeInTheDocument();
        expect(react_1.screen.getByText('Save')).toBeInTheDocument();
    });
    it('closes dialog when close button is clicked', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { defaultOpen: true, children: (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Dialog Title" }) }) }));
        const closeButton = react_1.screen.getByRole('button', { name: /close/i });
        react_1.fireEvent.click(closeButton);
        // Dialog should be closed, title should not be visible
        expect(react_1.screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });
    it('applies custom className to dialog content', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { defaultOpen: true, children: (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { className: "custom-dialog", children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Dialog Title" }) }) }));
        const dialogContent = react_1.screen.getByRole('dialog');
        expect(dialogContent).toHaveClass('custom-dialog');
    });
    it('renders with proper accessibility attributes', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { defaultOpen: true, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Accessible Dialog" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "This is an accessible dialog" })] }) }));
        const dialog = react_1.screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
    });
});
//# sourceMappingURL=dialog.test.js.map