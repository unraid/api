import { createRouter, createWebHistory } from 'vue-router';

// Import dev pages
import Home from '@/src/dev/pages/Home.vue';
import WebComponents from '@/src/dev/pages/WebComponents.vue';
import DockerDetail from '@/src/dev/pages/DockerDetail.vue';
import DockerCard from '@/src/dev/pages/DockerCard.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/dev'
  },
  {
    path: '/dev',
    name: 'Dev',
    component: Home,
    meta: { title: 'Home' }
  },
  {
    path: '/dev/web-components',
    name: 'WebComponents',
    component: WebComponents,
    meta: { title: 'Web Components' }
  },
  {
    path: '/dev/docker/detail',
    name: 'DockerDetail',
    component: DockerDetail,
    meta: { title: 'Docker Detail' }
  },
  {
    path: '/dev/docker/card',
    name: 'DockerCard', 
    component: DockerCard,
    meta: { title: 'Docker Card' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;