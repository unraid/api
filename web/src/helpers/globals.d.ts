declare global {
  var csrf_token: string;
  interface Window {
    __unifiedApp?: unknown;
    __mountedComponents?: Array<{ element: HTMLElement; unmount: () => void }>;
    LOCALE?: string;
    toast?: {
      success: (title: string, options?: { description?: string }) => void;
      error?: (title: string, options?: { description?: string }) => void;
    };
  }
}

// an export or import statement is required to make this file a module
export {};
