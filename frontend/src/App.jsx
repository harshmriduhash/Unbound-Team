import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Billing from './pages/Billing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <div>
      <nav className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between">
          <div className="font-bold">Unbound.team</div>
          <div className="space-x-4">
            <Link to="/" className="text-gray-600">Home</Link>
            <Link to="/dashboard" className="text-gray-600">Dashboard</Link>
            <Link to="/billing" className="text-gray-600">Billing</Link>
          </div>
        </div>
      </nav>

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </main>
    </div>
  )
}
