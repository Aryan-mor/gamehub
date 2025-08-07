import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic arithmetic', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(15 / 3).toBe(5);
  });

  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.length).toBe(4);
    expect('GAMEHUB'.toLowerCase()).toBe('gamehub');
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers.length).toBe(5);
    expect(numbers[0]).toBe(1);
    expect(numbers.includes(3)).toBe(true);
  });

  it('should work with objects', () => {
    const user = { id: '123', name: 'Test User' };
    expect(user.id).toBe('123');
    expect(user.name).toBe('Test User');
    expect(Object.keys(user)).toEqual(['id', 'name']);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should handle errors', () => {
    expect(() => {
      throw new Error('Test error');
    }).toThrow('Test error');
  });
});

describe('File System Tests', () => {
  it('should have package.json', () => {
    const fs = require('fs');
    const path = require('path');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
  });

  it('should have src directory', () => {
    const fs = require('fs');
    const path = require('path');
    
    const srcPath = path.join(process.cwd(), 'src');
    expect(fs.existsSync(srcPath)).toBe(true);
  });

  it('should have locales directory', () => {
    const fs = require('fs');
    const path = require('path');
    
    const localesPath = path.join(process.cwd(), 'locales');
    expect(fs.existsSync(localesPath)).toBe(true);
  });
});
