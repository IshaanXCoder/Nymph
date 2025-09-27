/**
 * Polyfills for React Native and Web
 */

import { Buffer } from 'buffer';

// Make Buffer available globally for React Native and Web
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// For web environments
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export {};
