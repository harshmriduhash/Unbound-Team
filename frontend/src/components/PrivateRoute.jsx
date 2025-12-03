import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        navigate('/login')
        return
      }
      setChecking(false)
    }
    check()
    return () => { mounted = false }
  }, [])

  if (checking) return <div className="text-center p-8">Checking authentication...</div>
  return children
}
