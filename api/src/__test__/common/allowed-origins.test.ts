import { getAllowedOrigins, getExtraOrigins } from '@app/common/allowed-origins.js';
import { store } from '@app/store/index.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { getServerIps } from '@app/graphql/resolvers/subscription/network.js';

import 'reflect-metadata';

import { expect, test, vi, beforeEach } from 'vitest';

// Mock the dependencies that provide dynamic values
vi.mock('@app/graphql/resolvers/subscription/network.js', () => ({
  getServerIps: vi.fn(),
  getUrlForField: vi.fn(({ url, port, portSsl }) => {
    if (port) return `http://${url}:${port}`;
    if (portSsl) return `https://${url}:${portSsl}`;
    return `https://${url}`;
  }),
}));

vi.mock('@app/store/index.js', () => ({
  store: {
    getState: vi.fn(() => ({
      emhttp: {
        status: 'LOADED',
        nginx: {
          httpPort: 8080,
          httpsPort: 4443,
        },
      },
    })),
    dispatch: vi.fn(),
  },
  getters: {
    config: vi.fn(() => ({
      api: {
        extraOrigins: 'https://google.com,https://test.com',
      },
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock getServerIps to return a consistent set of URLs
  (getServerIps as any).mockReturnValue({
    urls: [
      { ipv4: 'https://tower.local:4443' },
      { ipv4: 'https://192.168.1.150:4443' },
      { ipv4: 'https://tower:4443' },
      { ipv4: 'https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net:4443' },
      { ipv4: 'https://10-252-0-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-252-1-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-253-3-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-253-4-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-253-5-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-100-0-1.hash.myunraid.net:4443' },
      { ipv4: 'https://10-100-0-2.hash.myunraid.net:4443' },
      { ipv4: 'https://10-123-1-2.hash.myunraid.net:4443' },
      { ipv4: 'https://221-123-121-112.hash.myunraid.net:4443' },
    ],
  });
});

test('Returns allowed origins', async () => {
  // Load state files into store
  await store.dispatch(loadStateFiles());
  await store.dispatch(loadConfigFile());

  // Get allowed origins
  const allowedOrigins = getAllowedOrigins();
  
  // Test that the result is an array
  expect(Array.isArray(allowedOrigins)).toBe(true);
  
  // Test that it contains the expected socket paths
  expect(allowedOrigins).toContain('/var/run/unraid-notifications.sock');
  expect(allowedOrigins).toContain('/var/run/unraid-php.sock');
  expect(allowedOrigins).toContain('/var/run/unraid-cli.sock');
  
  // Test that it contains the expected local URLs
  expect(allowedOrigins).toContain('http://localhost:8080');
  expect(allowedOrigins).toContain('https://localhost:4443');
  
  // Test that it contains the expected connect URLs
  expect(allowedOrigins).toContain('https://connect.myunraid.net');
  expect(allowedOrigins).toContain('https://connect-staging.myunraid.net');
  expect(allowedOrigins).toContain('https://dev-my.myunraid.net:4000');
  
  // Test that it contains the extra origins from config
  expect(allowedOrigins).toContain('https://google.com');
  expect(allowedOrigins).toContain('https://test.com');
  
  // Test that it contains some of the remote URLs
  expect(allowedOrigins).toContain('https://tower.local:4443');
  expect(allowedOrigins).toContain('https://192.168.1.150:4443');
  
  // Test that there are no duplicates
  expect(allowedOrigins.length).toBe(new Set(allowedOrigins).size);
});
