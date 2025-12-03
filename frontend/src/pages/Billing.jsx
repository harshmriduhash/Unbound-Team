import React, { useState } from 'react'

export default function Billing() {
  const [tenant, setTenant] = useState('')
  const [user, setUser] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [result, setResult] = useState(null)

  const headers = () => {
    const h = { 'Content-Type': 'application/json' }
    if (!apiKey) return h
    if (apiKey.toLowerCase().startsWith('bearer ')) h['Authorization'] = apiKey
    else h['x-api-key'] = apiKey
    return h
  }

  const fetchStatus = async () => {
    if (!tenant || !user) return alert('Enter tenant and user')
    const res = await fetch(`/api/billing/${encodeURIComponent(tenant)}/${encodeURIComponent(user)}`, { headers: headers() })
    setResult(await res.json())
  }

  const createSubscription = async () => {
    const plan = 'starter'
    const res = await fetch('/api/billing/create-subscription', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ tenantId: tenant, userId: user, plan, country: 'IN' })
    })
    const data = await res.json()
    setResult(data)

    // Handle Razorpay checkout if server returned razorpay order info
    if (data?.razorpayOrder) {
      // Load Razorpay script dynamically if not present
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
      }
      if (window.Razorpay) {
        const options = {
          key: data.razorpayKey || '',
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency || 'INR',
          order_id: data.razorpayOrder.id,
          name: data.razorpayOrder.notes?.name || 'Unbound.team',
          description: data.razorpayOrder.notes?.description || plan,
          handler: async function (response) {
            // Optionally inform backend of payment success
            setResult(prev => ({ ...prev, paymentResponse: response }))
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }
    }
      const options = {
        key: data.razorpayKey || '',
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency || 'INR',
        order_id: data.razorpayOrder.id,
        name: data.razorpayOrder.notes?.name || 'Unbound.team',
        description: data.razorpayOrder.notes?.description || plan,
        handler: async function (response) {
          // Optionally inform backend of payment success
          setResult(prev => ({ ...prev, paymentResponse: response }))
        }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
      return
    }

    // Handle Stripe redirect URL
    if (data?.stripeCheckoutUrl) {
      window.location.href = data.stripeCheckoutUrl
      return
    }
  }

  const cancel = async () => {
    const res = await fetch(`/api/billing/${encodeURIComponent(tenant)}/${encodeURIComponent(user)}/cancel`, {
      method: 'POST', headers: headers()
    })
    setResult(await res.json())
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Billing (MVP)</h2>
      <div className="space-y-3">
        <input placeholder="Tenant ID" value={tenant} onChange={e => setTenant(e.target.value)} className="w-full p-2 border rounded" />
        <input placeholder="User ID / email" value={user} onChange={e => setUser(e.target.value)} className="w-full p-2 border rounded" />
        <input placeholder="Admin API Key or Bearer token" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-2 border rounded" />
        <div className="text-sm text-gray-500">Tip: for Razorpay test checkout, ensure `RAZORPAY_KEY_ID` is set server-side and use ngrok for webhooks.</div>
        <div className="flex gap-2">
          <button onClick={fetchStatus} className="px-4 py-2 bg-gray-200 rounded">Fetch Status</button>
          <button onClick={createSubscription} className="px-4 py-2 bg-blue-600 text-white rounded">Create Subscription</button>
          <button onClick={cancel} className="px-4 py-2 bg-red-600 text-white rounded">Cancel</button>
        </div>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}
