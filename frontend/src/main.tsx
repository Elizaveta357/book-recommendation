/**
 * Точка входа фронта: монтирует приложение в <div id="root"> из index.html.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) {
  throw new Error('В index.html нет элемента #root — приложению некуда монтироваться')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
