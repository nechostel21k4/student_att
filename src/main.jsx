import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Pre-warm the backend serverless function (production only)
import axios from 'axios';

// Global response interceptor for 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event('app:session-expired'));
    }
    return Promise.reject(error);
  }
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const IS_PROD = import.meta.env.PROD;

if (IS_PROD) {
  // Disable console.log, info, and warn in production
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  
  // Keep console.error but maybe sanitize it or limit it
  const originalError = console.error;
  console.error = (...args) => {
    // Only allow critical errors to show in devtools, but hide the sensitive parts if any
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('token') || args[0].includes('key'))) {
      return;
    }
    originalError(...args);
  };

  // Prevent right-click to make it harder to open DevTools (optional but requested "protect")
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Print a security warning to users who DO open the console
console.log(
  '%cSTOP!',
  'color: #ef4444; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000;'
);
console.log(
  '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your account.',
  'font-size: 18px; line-height: 1.4;'
);

if (IS_PROD && API_BASE_URL) {
  fetch(`${API_BASE_URL}/ping`, { method: 'GET' }).catch(() => {});
}

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
