"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
const separator_1 = require("../separator");
describe('Separator', () => {
    it('renders separator with default horizontal orientation', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toBeInTheDocument();
        expect(separator).toHaveClass('h-[1px]', 'w-full');
    });
    it('renders separator with vertical orientation', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { orientation: "vertical", "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveClass('h-full', 'w-[1px]');
    });
    it('applies base classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveClass('shrink-0', 'bg-border');
    });
    it('applies custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { className: "custom-separator", "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveClass('custom-separator');
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { ref: ref, "data-testid": "separator" }));
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
    it('has decorative attribute by default', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });
    it('can be non-decorative', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { decorative: false, "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toBeInTheDocument();
    });
    it('supports ARIA separator role when not decorative', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { decorative: false, "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveAttribute('role', 'separator');
    });
    it('handles vertical orientation with proper classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { orientation: "vertical", "data-testid": "separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveAttribute('data-orientation', 'vertical');
        expect(separator).toHaveClass('h-full', 'w-[1px]');
        expect(separator).not.toHaveClass('h-[1px]', 'w-full');
    });
    it('forwards additional props', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { "data-testid": "separator", id: "test-separator", "aria-label": "Content separator" }));
        const separator = react_2.screen.getByTestId('separator');
        expect(separator).toHaveAttribute('id', 'test-separator');
        expect(separator).toHaveAttribute('aria-label', 'Content separator');
    });
    it('maintains consistent styling across orientations', () => {
        const { rerender } = (0, react_2.render)((0, jsx_runtime_1.jsx)(separator_1.Separator, { "data-testid": "separator" }));
        const horizontalSeparator = react_2.screen.getByTestId('separator');
        expect(horizontalSeparator).toHaveClass('shrink-0', 'bg-border');
        rerender((0, jsx_runtime_1.jsx)(separator_1.Separator, { orientation: "vertical", "data-testid": "separator" }));
        const verticalSeparator = react_2.screen.getByTestId('separator');
        expect(verticalSeparator).toHaveClass('shrink-0', 'bg-border');
    });
});
//# sourceMappingURL=separator.test.js.map