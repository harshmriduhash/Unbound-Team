import React from 'react'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Own Your Data. Own Your Future.</h1>
        <p className="text-gray-100">The only entrepreneur community where everyone shares real problems, real products, and real revenue.</p>
        <div className="mt-6">
          <a href="/signup" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold mr-3">Join Free</a>
          <a href="/billing" className="border-2 border-white px-6 py-2 rounded-lg">Billing</a>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white rounded shadow">🎯 Real Problems</div>
        <div className="p-6 bg-white rounded shadow">💰 Transparent Revenue</div>
        <div className="p-6 bg-white rounded shadow">🤖 AI Insights</div>
      </section>
    </div>
  )
}
