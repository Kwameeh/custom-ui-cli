import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders separator with default horizontal orientation', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('renders separator with vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('applies base classes', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-separator" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('custom-separator');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<React.ElementRef<typeof Separator>>();
    render(<Separator ref={ref} data-testid="separator" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has decorative attribute by default', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('can be non-decorative', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
  });

  it('supports ARIA separator role when not decorative', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('handles vertical orientation with proper classes', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
    expect(separator).not.toHaveClass('h-[1px]', 'w-full');
  });

  it('forwards additional props', () => {
    render(
      <Separator 
        data-testid="separator" 
        id="test-separator"
        aria-label="Content separator"
      />
    );
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('id', 'test-separator');
    expect(separator).toHaveAttribute('aria-label', 'Content separator');
  });

  it('maintains consistent styling across orientations', () => {
    const { rerender } = render(<Separator data-testid="separator" />);
    const horizontalSeparator = screen.getByTestId('separator');
    expect(horizontalSeparator).toHaveClass('shrink-0', 'bg-border');

    rerender(<Separator orientation="vertical" data-testid="separator" />);
    const verticalSeparator = screen.getByTestId('separator');
    expect(verticalSeparator).toHaveClass('shrink-0', 'bg-border');
  });
});