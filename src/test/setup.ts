import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Default mock credentials for testing environment so component imports don't fail
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://mock-project.supabase.co';
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key-for-tests';
}

// Prevent unhandled background WebSocket connections to mock URLs in jsdom tests
if (typeof window !== 'undefined') {
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    url: string;
    onopen: any = null;
    onclose: any = null;
    onerror: any = null;
    onmessage: any = null;
    constructor(url: string) {
      this.url = url;
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  }
  (globalThis as any).WebSocket = MockWebSocket;
}
