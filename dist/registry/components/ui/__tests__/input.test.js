"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const input_1 = require("../input");
describe('Input', () => {
    it('renders correctly', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Enter text" }));
        expect(react_2.screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
    it('applies default classes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { "data-testid": "input" }));
        const input = react_2.screen.getByTestId('input');
        expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border', 'border-input', 'bg-background', 'px-3', 'py-2', 'text-sm');
    });
    it('forwards custom className', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { className: "custom-class", "data-testid": "input" }));
        const input = react_2.screen.getByTestId('input');
        expect(input).toHaveClass('custom-class');
    });
    it('handles different input types', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { type: "email", "data-testid": "email-input" }));
        const input = react_2.screen.getByTestId('email-input');
        expect(input).toHaveAttribute('type', 'email');
    });
    it('handles password type', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { type: "password", "data-testid": "password-input" }));
        const input = react_2.screen.getByTestId('password-input');
        expect(input).toHaveAttribute('type', 'password');
    });
    it('handles number type', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", "data-testid": "number-input" }));
        const input = react_2.screen.getByTestId('number-input');
        expect(input).toHaveAttribute('type', 'number');
    });
    it('handles user input', async () => {
        const user = user_event_1.default.setup();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Type here" }));
        const input = react_2.screen.getByPlaceholderText('Type here');
        await user.type(input, 'Hello World');
        expect(input).toHaveValue('Hello World');
    });
    it('handles onChange events', async () => {
        const user = user_event_1.default.setup();
        const handleChange = jest.fn();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { onChange: handleChange, placeholder: "Type here" }));
        const input = react_2.screen.getByPlaceholderText('Type here');
        await user.type(input, 'a');
        expect(handleChange).toHaveBeenCalled();
    });
    it('forwards ref correctly', () => {
        const ref = react_1.default.createRef();
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { ref: ref }));
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
    it('supports disabled state', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { disabled: true, "data-testid": "disabled-input" }));
        const input = react_2.screen.getByTestId('disabled-input');
        expect(input).toBeDisabled();
        expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
    it('supports required attribute', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { required: true, "data-testid": "required-input" }));
        const input = react_2.screen.getByTestId('required-input');
        expect(input).toBeRequired();
    });
    it('supports custom HTML attributes', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { maxLength: 10, "data-testid": "input-with-attrs" }));
        const input = react_2.screen.getByTestId('input-with-attrs');
        expect(input).toHaveAttribute('maxLength', '10');
    });
    it('handles placeholder text', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Enter your name" }));
        expect(react_2.screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });
    it('handles default value', () => {
        (0, react_2.render)((0, jsx_runtime_1.jsx)(input_1.Input, { defaultValue: "Default text", "data-testid": "input-with-default" }));
        const input = react_2.screen.getByTestId('input-with-default');
        expect(input).toHaveValue('Default text');
    });
});
//# sourceMappingURL=input.test.js.map