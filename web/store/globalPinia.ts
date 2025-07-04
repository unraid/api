import { createPinia, setActivePinia } from 'pinia';

// Create a single shared Pinia instance for all web components
export const globalPinia = createPinia();

// Set it as the active pinia instance
setActivePinia(globalPinia); 