import { cn } from '../utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('handles undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles empty strings', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('merges Tailwind classes correctly (removes duplicates)', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles objects with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true
    });
    expect(result).toBe('class1 class3');
  });

  it('handles complex combinations', () => {
    const result = cn(
      'base-class',
      ['array-class1', 'array-class2'],
      {
        'conditional-true': true,
        'conditional-false': false
      },
      undefined,
      'final-class'
    );
    expect(result).toBe('base-class array-class1 array-class2 conditional-true final-class');
  });

  it('handles Tailwind class conflicts correctly', () => {
    const result = cn('text-red-500 text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('preserves non-conflicting Tailwind classes', () => {
    const result = cn('text-red-500 bg-blue-500 hover:text-green-500');
    expect(result).toBe('text-red-500 bg-blue-500 hover:text-green-500');
  });
});