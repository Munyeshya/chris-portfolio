import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import BookingPage from './pages/BookingPage.jsx'
import TicketingPage from './pages/TicketingPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/ticketing" element={<TicketingPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
