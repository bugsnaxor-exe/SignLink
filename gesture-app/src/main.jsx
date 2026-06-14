import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SignLanguageDetector from './Signlanguagedetector'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SignLanguageDetector />
  </StrictMode>
)