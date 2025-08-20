"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const card_1 = require("../card");
describe('Card Components', () => {
    describe('Card', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.Card, { "data-testid": "card", children: "Card content" }));
            expect(react_2.screen.getByTestId('card')).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.Card, { "data-testid": "card", children: "Card content" }));
            const card = react_2.screen.getByTestId('card');
            expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.Card, { className: "custom-class", "data-testid": "card", children: "Card content" }));
            const card = react_2.screen.getByTestId('card');
            expect(card).toHaveClass('custom-class');
        });
        it('forwards ref correctly', () => {
            const ref = react_1.default.createRef();
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.Card, { ref: ref, children: "Card content" }));
            expect(ref.current).toBeInstanceOf(HTMLDivElement);
        });
    });
    describe('CardHeader', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardHeader, { "data-testid": "card-header", children: "Header content" }));
            expect(react_2.screen.getByTestId('card-header')).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardHeader, { "data-testid": "card-header", children: "Header content" }));
            const header = react_2.screen.getByTestId('card-header');
            expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "custom-header", "data-testid": "card-header", children: "Header" }));
            const header = react_2.screen.getByTestId('card-header');
            expect(header).toHaveClass('custom-header');
        });
    });
    describe('CardTitle', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardTitle, { "data-testid": "card-title", children: "Title text" }));
            expect(react_2.screen.getByTestId('card-title')).toBeInTheDocument();
        });
        it('renders as h3 element', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Title text" }));
            const title = react_2.screen.getByRole('heading', { level: 3 });
            expect(title).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardTitle, { "data-testid": "card-title", children: "Title text" }));
            const title = react_2.screen.getByTestId('card-title');
            expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "custom-title", "data-testid": "card-title", children: "Title" }));
            const title = react_2.screen.getByTestId('card-title');
            expect(title).toHaveClass('custom-title');
        });
    });
    describe('CardDescription', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardDescription, { "data-testid": "card-description", children: "Description text" }));
            expect(react_2.screen.getByTestId('card-description')).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardDescription, { "data-testid": "card-description", children: "Description" }));
            const description = react_2.screen.getByTestId('card-description');
            expect(description).toHaveClass('text-sm', 'text-muted-foreground');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "custom-desc", "data-testid": "card-description", children: "Desc" }));
            const description = react_2.screen.getByTestId('card-description');
            expect(description).toHaveClass('custom-desc');
        });
    });
    describe('CardContent', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardContent, { "data-testid": "card-content", children: "Content text" }));
            expect(react_2.screen.getByTestId('card-content')).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardContent, { "data-testid": "card-content", children: "Content" }));
            const content = react_2.screen.getByTestId('card-content');
            expect(content).toHaveClass('p-6', 'pt-0');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "custom-content", "data-testid": "card-content", children: "Content" }));
            const content = react_2.screen.getByTestId('card-content');
            expect(content).toHaveClass('custom-content');
        });
    });
    describe('CardFooter', () => {
        it('renders correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardFooter, { "data-testid": "card-footer", children: "Footer content" }));
            expect(react_2.screen.getByTestId('card-footer')).toBeInTheDocument();
        });
        it('applies default classes', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardFooter, { "data-testid": "card-footer", children: "Footer" }));
            const footer = react_2.screen.getByTestId('card-footer');
            expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
        });
        it('forwards custom className', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(card_1.CardFooter, { className: "custom-footer", "data-testid": "card-footer", children: "Footer" }));
            const footer = react_2.screen.getByTestId('card-footer');
            expect(footer).toHaveClass('custom-footer');
        });
    });
    describe('Complete Card Example', () => {
        it('renders a complete card with all components', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsxs)(card_1.Card, { "data-testid": "complete-card", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Card Title" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Card Description" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("p", { children: "Card content goes here" }) }), (0, jsx_runtime_1.jsx)(card_1.CardFooter, { children: (0, jsx_runtime_1.jsx)("button", { children: "Action" }) })] }));
            expect(react_2.screen.getByTestId('complete-card')).toBeInTheDocument();
            expect(react_2.screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
            expect(react_2.screen.getByText('Card Description')).toBeInTheDocument();
            expect(react_2.screen.getByText('Card content goes here')).toBeInTheDocument();
            expect(react_2.screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=card.test.js.map