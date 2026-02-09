import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import GoogleAuth from './otp.jsx';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App/>
  </StrictMode>
)
