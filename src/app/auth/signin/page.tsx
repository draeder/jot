'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Github, Mail, Building, Apple, User } from 'lucide-react'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

const providerIcons = {
  local: User,
  google: Mail,
  apple: Apple,
  github: Github,
  'azure-ad': Building,
}

const providerColors = {
  local: 'bg-green-500 hover:bg-green-600',
  google: 'bg-red-500 hover:bg-red-600',
  apple: 'bg-black hover:bg-gray-800',
  github: 'bg-gray-800 hover:bg-gray-900',
  'azure-ad': 'bg-blue-500 hover:bg-blue-600',
}

// Define the order we want providers to appear
const providerOrder = ['local', 'google', 'apple', 'github', 'azure-ad']

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [localName, setLocalName] = useState('')

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

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
            <img 
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
          {providers &&
            providerOrder
              .map(providerId => providers[providerId])
              .filter(Boolean)
              .map((provider) => {
                const Icon = providerIcons[provider.id as keyof typeof providerIcons]
                const colorClass = providerColors[provider.id as keyof typeof providerColors]

                // Handle local provider with form
                if (provider.id === 'local') {
                  return (
                    <form key={provider.id} onSubmit={handleLocalSignIn} className="space-y-3">
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
                        className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-colors ${colorClass}`}
                      >
                        {Icon && <Icon size={20} />}
                        Sign in with {provider.name}
                      </button>
                    </form>
                  )
                }

                // Handle OAuth providers
                return (
                  <button
                    key={provider.name}
                    onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-colors ${colorClass}`}
                  >
                    {Icon && <Icon size={20} />}
                    Sign in with {provider.name}
                  </button>
                )
              })}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  )
}
