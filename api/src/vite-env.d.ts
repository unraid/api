/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Add other env variables you need here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Add type declaration for Vite's glob import
declare module 'vite' {
    interface ImportMeta {
        glob: (pattern: string, options?: { as: 'raw' }) => Record<string, () => Promise<string>>;
    }
}
