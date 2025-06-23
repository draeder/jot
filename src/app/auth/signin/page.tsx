'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { User } from 'lucide-react'
import Image from 'next/image'

export default function SignIn() {
  const [localName, setLocalName] = useState('')

  const handleLocalSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (localName.trim()) {
      await signIn('local', { 
        name: localName.trim(),
        callbackUrl: '/' 
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/jotlogo.png" 
              alt="Jot Logo" 
              width={120} 
              height={80}
              className="object-contain"
            />
          </div>
          <p className="text-gray-600">Your intelligent note-taking workspace</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleLocalSignIn} className="space-y-3">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-colors bg-green-500 hover:bg-green-600"
            >
              <User size={20} />
              Get Started
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Your data stays private and secure on your device
        </div>
      </div>
    </div>
  )
}
