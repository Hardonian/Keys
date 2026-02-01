import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateTime, formatRelativeTime, truncate } from './format';

describe('formatCurrency', () => {
  it('should format positive numbers as USD', () => {
    expect(formatCurrency(100)).toBe('$100.00');
    expect(formatCurrency(99.99)).toBe('$99.99');
  });

  it('should format negative numbers as USD', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle decimal precision', () => {
    expect(formatCurrency(123.456)).toBe('$123.46');
  });
});

describe('formatDateTime', () => {
  it('should format Date objects', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatDateTime(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('Jan');
  });

  it('should format date strings', () => {
    const formatted = formatDateTime('2024-06-20T10:00:00');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('Jun');
  });
});

describe('formatRelativeTime', () => {
  it('should return "just now" for recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('should return minutes ago for recent times', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should return hours ago for older times', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('should return days ago for recent days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });

  it('should format older dates with full datetime', () => {
    const oldDate = new Date('2023-01-01T00:00:00');
    const formatted = formatRelativeTime(oldDate);
    expect(formatted).toContain('2023');
  });
});

describe('truncate', () => {
  it('should return original text if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long text with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});
