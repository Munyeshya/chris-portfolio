import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import BookingPage from './pages/BookingPage.jsx'
import TicketingPage from './pages/TicketingPage.jsx'
import TicketPage from './pages/TicketPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PlannerPage from './pages/PlannerPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/ticketing" element={<TicketingPage />} />
        <Route path="/ticket/:token" element={<TicketPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/planner" element={<PlannerPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
