import { createPinia, setActivePinia } from 'pinia';

import { persistedStatePlugin } from '~/store/plugins/persistedState';

// Create a single shared Pinia instance for all web components
export const globalPinia = createPinia();

globalPinia.use(persistedStatePlugin);

// IMPORTANT: Set it as the active pinia instance immediately
// This ensures stores work even when called during component setup
setActivePinia(globalPinia);
