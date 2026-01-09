import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { HelmetProvider } from 'react-helmet-async'

// Simple loading indicator (optional)
const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
    </div>
  )
}

// Create root and render
const container = document.getElementById('root')

// Clear any existing skeleton content
if (container && container.children.length > 0) {
  container.innerHTML = ''
}

// Add loading screen temporarily
if (container) {
  const tempDiv = document.createElement('div')
  tempDiv.className = 'temp-loading'
  tempDiv.innerHTML = `
    <style>
      .temp-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      .temp-loading .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #000000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    <div class="spinner"></div>
  `
  container.appendChild(tempDiv)
}

// Create root
const root = createRoot(container)

// Render app
root.render(
  <HelmetProvider>
    <ShopContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ShopContextProvider>
  </HelmetProvider>
)

// Remove loading screen after render
setTimeout(() => {
  const tempLoader = document.querySelector('.temp-loading')
  if (tempLoader) {
    tempLoader.style.opacity = '0'
    setTimeout(() => tempLoader.remove(), 300)
  }
}, 500)