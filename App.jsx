import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Group from './pages/Group'
import Duels from './pages/Duels'
import Profile from './pages/Profile'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f5f3]">
      <span className="logo text-4xl text-[#3B6D11]">SPOTTER</span>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Home session={session} /> : <Navigate to="/login" />} />
        <Route path="/group/:id" element={session ? <Group session={session} /> : <Navigate to="/login" />} />
        <Route path="/duels" element={session ? <Duels session={session} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}