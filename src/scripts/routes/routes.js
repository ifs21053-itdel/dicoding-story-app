// src/scripts/routes/routes.js

import HomePage from '../views/pages/home-page';
import DetailPage from '../views/pages/detail-page';
import AddPage from '../views/pages/add-page';
import LoginPage from '../views/pages/login-page';
import RegisterPage from '../views/pages/register-page';
import AboutPage from '../views/pages/about-page';
import FavoritesPage from '../views/pages/favorites-page';

const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/detail/:id': DetailPage,
  '/add': AddPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/about': AboutPage,
  '/favorites': FavoritesPage,
};

// Konfigurasi tambahan untuk PWA: Halaman mana yang memerlukan koneksi online
export const routeConfig = {
  '/': {
    needsOnline: false, // Dapat diakses offline jika data sudah di-cache
  },
  '/home': {
    needsOnline: false, // Dapat diakses offline jika data sudah di-cache
  },
  '/detail/:id': {
    needsOnline: true, // Memerlukan koneksi untuk mengambil detail
  },
  '/add': {
    needsOnline: true, // Memerlukan koneksi untuk submit data
    needAuth: true,
  },
  '/login': {
    needsOnline: true, // Memerlukan koneksi untuk proses login
  },
  '/register': {
    needsOnline: true, // Memerlukan koneksi untuk registrasi
  },
  '/about': {
    needsOnline: false, // Konten statis, dapat diakses offline
  },
  '/favorites': {
    needsOnline: false, // Dapat diakses offline karena menggunakan IndexedDB
  },
};

export default routes;