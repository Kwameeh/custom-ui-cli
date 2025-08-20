import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders alert with content', () => {
    render(<Alert>Alert content</Alert>);
    expect(screen.getByText('Alert content')).toBeInTheDocument();
  });

  it('has proper role attribute', () => {
    render(<Alert>Alert message</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Alert>Default Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-background', 'text-foreground');
  });

  it('applies destructive variant classes', () => {
    render(<Alert variant="destructive">Destructive Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
  });

  it('applies custom className', () => {
    render(<Alert className="custom-alert">Custom Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Alert with ref</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has proper base classes', () => {
    render(<Alert>Base Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'relative',
      'w-full',
      'rounded-lg',
      'border',
      'p-4'
    );
  });
});

describe('AlertTitle', () => {
  it('renders alert title', () => {
    render(<AlertTitle>Alert Title</AlertTitle>);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders as h5 element', () => {
    render(<AlertTitle>Title</AlertTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H5');
  });

  it('applies proper classes', () => {
    render(<AlertTitle>Styled Title</AlertTitle>);
    const title = screen.getByText('Styled Title');
    expect(title).toHaveClass(
      'mb-1',
      'font-medium',
      'leading-none',
      'tracking-tight'
    );
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>);
    const title = screen.getByText('Custom Title');
    expect(title).toHaveClass('custom-title');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertTitle ref={ref}>Title with ref</AlertTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('AlertDescription', () => {
  it('renders alert description', () => {
    render(<AlertDescription>Alert Description</AlertDescription>);
    expect(screen.getByText('Alert Description')).toBeInTheDocument();
  });

  it('renders as div element', () => {
    render(<AlertDescription>Description</AlertDescription>);
    const description = screen.getByText('Description');
    expect(description.tagName).toBe('DIV');
  });

  it('applies proper classes', () => {
    render(<AlertDescription>Styled Description</AlertDescription>);
    const description = screen.getByText('Styled Description');
    expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom-desc">Custom Description</AlertDescription>);
    const description = screen.getByText('Custom Description');
    expect(description).toHaveClass('custom-desc');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertDescription ref={ref}>Description with ref</AlertDescription>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Alert with Title and Description', () => {
  it('renders complete alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning message.</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message.')).toBeInTheDocument();
  });

  it('renders destructive alert with icon support', () => {
    render(
      <Alert variant="destructive">
        <svg data-testid="alert-icon" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-destructive');
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});