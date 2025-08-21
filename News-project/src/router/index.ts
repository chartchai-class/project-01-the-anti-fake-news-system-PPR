import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'), 
  },
  {
    path: '/post/:id',
    name: 'PostDetails',
    component: () => import('../views/PostDetails.vue'),
    props: true,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfilePage.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsPage.vue'),
  },
  {
    path: '/error',
    name: 'Error',
    component: () => import('../views/ErrorPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router