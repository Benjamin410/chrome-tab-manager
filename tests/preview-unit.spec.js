const { test, expect } = require('@playwright/test');
const { preview } = require('../extension/features/tab-browser/page-meta-labels.js');

/**
 * Unit tests for the preview function found in extension/features/tab-browser/page-meta-labels.js
 */
test.describe('preview function unit tests', () => {
  test('handles null and undefined input', () => {
    expect(preview(null, 10)).toBe('');
    expect(preview(undefined, 10)).toBe('');
  });

  test('handles empty string', () => {
    expect(preview('', 10)).toBe('');
  });

  test('returns the same string if length is less than max', () => {
    expect(preview('hello', 10)).toBe('hello');
  });

  test('returns the same string if length is exactly max', () => {
    expect(preview('helloworld', 10)).toBe('helloworld');
  });

  test('truncates and adds ellipsis if length is greater than max', () => {
    expect(preview('hello world', 5)).toBe('hello…');
  });

  test('trims whitespace before comparing length', () => {
    expect(preview('  hello  ', 10)).toBe('hello');
    expect(preview('  hello world  ', 5)).toBe('hello…');
  });

  test('handles max length of 0', () => {
    expect(preview('hello', 0)).toBe('…');
  });

  test('handles empty string with max length 0', () => {
    expect(preview('', 0)).toBe('');
  });
});
