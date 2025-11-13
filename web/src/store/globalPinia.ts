import { createPinia, setActivePinia } from 'pinia';

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// Create a single shared Pinia instance for all web components
export const globalPinia = createPinia();
globalPinia.use(piniaPluginPersistedstate);

// IMPORTANT: Set it as the active pinia instance immediately
// This ensures stores work even when called during component setup
setActivePinia(globalPinia);
