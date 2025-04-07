import { beforeEach, vi } from 'vitest';

// Create a global mock file system that can be used across all tests
export const mockFileSystem = new Map<string, string>();

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
    writeFile: vi.fn().mockImplementation((path, content) => {
        mockFileSystem.set(path.toString(), content.toString());
        return Promise.resolve();
    }),
    readFile: vi.fn().mockImplementation((path) => {
        const content = mockFileSystem.get(path.toString());
        if (content === undefined) {
            return Promise.reject(new Error(`File not found: ${path}`));
        }
        return Promise.resolve(content);
    }),
    access: vi.fn().mockImplementation((path) => {
        if (mockFileSystem.has(path.toString())) {
            return Promise.resolve();
        }
        return Promise.reject(new Error(`File not found: ${path}`));
    }),
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
    emptyDir: vi.fn().mockImplementation(() => {
        mockFileSystem.clear();
        return Promise.resolve();
    }),
}));

// Mock file-exists utility
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn().mockImplementation((path) => {
        return Promise.resolve(mockFileSystem.has(path.toString()));
    }),
}));

// Clear the mock file system before each test
beforeEach(() => {
    mockFileSystem.clear();
});
