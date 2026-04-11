import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ListDocumentPage from './admin/pages/ListDocumentPage.tsx'
import ImportDocumentPage from './admin/pages/ImportDocumentPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ImportDocumentPage />
  </StrictMode>,
)
