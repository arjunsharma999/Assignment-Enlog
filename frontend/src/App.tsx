import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import ClientDashboard from './ClientDashboard'
import Register from './Register'

const PROFILE_URL = 'http://127.0.0.1:8000/api/profile/';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<'admin' | 'client' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
    if (token) {
      fetchUserProfile(token)
    }
  }, [])

  const fetchUserProfile = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(PROFILE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setRole(data.is_staff ? 'admin' : 'client')
      setProfile(data)
    } catch (err) {
      setError('Could not fetch user profile')
      setRole(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(true)
    if (token) fetchUserProfile(token)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    setRole(null)
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <div><Register /><button onClick={() => setShowRegister(false)} style={{marginTop: 16}}>Back to Login</button></div>
    }
    return <div><Login onLogin={handleLogin} /><button onClick={() => setShowRegister(true)} style={{marginTop: 16}}>Register</button></div>
  }

  if (loading) {
    return <div>Loading profile...</div>
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>
  }

  return (
    <>
      <div>
        <h2>Welcome, {profile?.username}!</h2>
        <button onClick={handleLogout}>Logout</button>
        {role === 'client' && profile && <ClientDashboard userId={profile.id} />}
        {role === 'admin' && <AdminDashboard />}
      </div>
    </>
  )
}

export default App
