import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Hostel Student App',
        short_name: 'StudentApp',
        description: 'Student Hostel Management App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'Nec.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Nec.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
