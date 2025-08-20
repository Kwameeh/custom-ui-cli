import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly', () => {
      render(<Card data-testid="card">Card content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('forwards custom className', () => {
      render(<Card className="custom-class" data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('forwards custom className', () => {
      render(<CardHeader className="custom-header" data-testid="card-header">Header</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders correctly', () => {
      render(<CardTitle data-testid="card-title">Title text</CardTitle>);
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
    });

    it('renders as h3 element', () => {
      render(<CardTitle>Title text</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<CardTitle data-testid="card-title">Title text</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });

    it('forwards custom className', () => {
      render(<CardTitle className="custom-title" data-testid="card-title">Title</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders correctly', () => {
      render(<CardDescription data-testid="card-description">Description text</CardDescription>);
      expect(screen.getByTestId('card-description')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<CardDescription data-testid="card-description">Description</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('forwards custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="card-description">Desc</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(<CardContent data-testid="card-content">Content text</CardContent>);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('forwards custom className', () => {
      render(<CardContent className="custom-content" data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('renders correctly', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>);
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('forwards custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="card-footer">Footer</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Complete Card Example', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});