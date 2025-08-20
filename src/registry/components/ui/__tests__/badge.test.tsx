import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders badge with text content', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('border-transparent');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('forwards HTML attributes', () => {
    render(<Badge data-testid="test-badge" id="badge-id">Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('id', 'badge-id');
  });

  it('renders as div element', () => {
    render(<Badge>Badge Content</Badge>);
    const badge = screen.getByText('Badge Content');
    expect(badge.tagName).toBe('DIV');
  });

  it('has proper base classes', () => {
    render(<Badge>Base Badge</Badge>);
    const badge = screen.getByText('Base Badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold'
    );
  });

  it('supports focus ring classes', () => {
    render(<Badge>Focusable Badge</Badge>);
    const badge = screen.getByText('Focusable Badge');
    expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});