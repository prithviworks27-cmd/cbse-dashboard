import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './dashboard.css'
import { DataLoader } from './DataLoader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DataLoader />
    </BrowserRouter>
  </StrictMode>,
)
