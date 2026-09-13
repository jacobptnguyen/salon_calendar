import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { theme } from './src/config/theme.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // No offline caching of API/data requests — appointments must always be
      // fetched live, never served stale. This plugin only makes the shell
      // installable to a home screen.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/setup/],
      },
      manifest: {
        name: 'Salon Calendar',
        short_name: 'Calendar',
        start_url: '/',
        display: 'standalone',
        background_color: theme.bg,
        // White, not gold: the installed app's title bar should match the
        // stark-white page rather than frame it in color.
        theme_color: theme.bg,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
