import { getCurrentInstance, inject } from 'vue';

export function useAppConfig() {
  // Only try inject if we're in a component context
  const instance = getCurrentInstance();
  
  if (instance) {
    // Try to get from injection first (only works in setup context)
    try {
      const injected = inject('appConfig', null);
      if (injected) {
        return injected;
      }
    } catch {
      // inject failed, continue with fallbacks
    }
    
    // Fallback to global
    if (instance.appContext.config.globalProperties.$appConfig) {
      return instance.appContext.config.globalProperties.$appConfig;
    }
  }
  
  // Last resort - return from window
  if (typeof window !== 'undefined') {
    const globalWindow = window as typeof globalThis & { appConfig?: unknown };
    if (globalWindow.appConfig) {
      return globalWindow.appConfig;
    }
  }
  
  // Default config
  return {
    ui: {
      colors: {
        primary: 'blue',
        neutral: 'gray'
      }
    },
    toaster: {
      position: 'bottom-right' as const,
      expand: true,
      duration: 5000
    }
  };
}
