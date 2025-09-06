import { createRouter, createWebHistory } from 'vue-router';

import type { RouteRecordRaw } from 'vue-router';

// Simple router for the main Vue app (if needed)
// Test pages are now served as static HTML from /test-pages/
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/test-pages/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
