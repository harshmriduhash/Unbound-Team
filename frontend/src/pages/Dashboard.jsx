import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('problems')
  const [problems, setProblems] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return window.location.href = '/login'
      setUser(user)
      loadProblems()
      loadProducts()
    }
    init()
  }, [])

  async function loadProblems() {
    const { data } = await supabase.from('problems').select('*, profiles(username)').order('created_at', { ascending: false }).limit(20)
    setProblems(data || [])
  }

  async function loadProducts() {
    const { data } = await supabase.from('products_listed').select('*, profiles(username)').order('created_at', { ascending: false }).limit(20)
    setProducts(data || [])
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div>{user?.email}</div>
      </div>

      <div className="mb-6">
        <button onClick={() => setTab('problems')} className={`px-3 py-2 mr-2 ${tab==='problems' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Problems</button>
        <button onClick={() => setTab('products')} className={`px-3 py-2 mr-2 ${tab==='products' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Products</button>
        <button onClick={() => setTab('revenue')} className={`px-3 py-2 ${tab==='revenue' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Revenue</button>
      </div>

      {tab === 'problems' && (
        <div className="space-y-4">
          {problems.length === 0 && <div className="text-gray-500">No problems yet.</div>}
          {problems.map(p => (
            <div key={p.id} className="bg-white p-4 rounded shadow">
              <div className="font-bold">{p.title}</div>
              <div className="text-sm text-gray-600">by @{p.profiles?.username || 'anon'}</div>
              <p className="mt-2">{p.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 && <div className="text-gray-500">No products yet.</div>}
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded shadow">
              <div className="font-bold">{p.name}</div>
              <div className="text-sm text-gray-600">by @{p.profiles?.username || 'anon'}</div>
              <p className="mt-2">{p.tagline}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'revenue' && (
        <div className="text-gray-600">Revenue reporting coming soon.</div>
      )}
    </div>
  )
}
