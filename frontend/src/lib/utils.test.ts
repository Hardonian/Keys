import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle objects for conditional classes', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should filter out falsy values', () => {
    expect(cn('class1', null, undefined, false, '', 'class2')).toBe('class1 class2');
  });
});
