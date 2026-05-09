import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'attendance_banner.webp', 
        'banner.webp', 
        'facereq.webp', 
        'geotag.webp', 
        'help_char.webp', 
        'login_banner.webp', 
        'shortcuts/login.webp',
        'shortcuts/leave.webp',
        'shortcuts/complaint.webp',
      ],
      manifest: {
        name: 'HostelX Student-NEC',
        short_name: 'HostelX Student-NEC',
        description: 'Advanced Hostel Management System',
        version: '2.0.0',
        theme_color: '#0f172a',
        start_url: '/',
        id: '/',
        scope: '/',
        orientation: 'portrait',
        background_color: '#0f172a',
        categories: ['education', 'productivity'],
        prefer_related_applications: false,
        display: 'standalone',
        icons: [
          {
            "src": "HostelX.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "HostelX.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
        shortcuts: [
          {
            name: 'Login',
            short_name: 'Login',
            description: 'Login to the app',
            url: '/',
            icons: [{ src: 'shortcuts/login.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' }]
          },
          {
            name: 'Leave Request',
            short_name: 'Leave',
            description: 'Apply for leave',
            url: '/leave',
            icons: [{ src: 'shortcuts/leave.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' }]
          },
          {
            name: 'Complaint',
            short_name: 'Complaint',
            description: 'File a complaint',
            url: '/complaint',
            icons: [{ src: 'shortcuts/complaint.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' }]
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'face-api': ['face-api.js'],
        }
      }
    }
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/hostel-backend\.vercel\.app\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] }
        }
      }
    ]
  }
})