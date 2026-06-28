'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const raw = sp.get('next') || '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function signIn(e: FormEvent) {
    e.preventDefault()
    setStatus('working'); setError(null)
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(next)
    } catch (err: any) {
      setStatus('error'); setError(err?.message ?? 'Sign-in failed')
    }
  }

  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Group Maker</h1>
          <p className="text-slate-500 mt-2 text-sm">Staff sign-in</p>
        </div>

        <form onSubmit={signIn} className="space-y-4 bg-white border border-sky-200 rounded p-6">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@myrcs.ca"
            autoFocus
            required
            className="w-full px-4 py-3 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {error && <p className="text-rose-600 text-sm text-center font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={status === 'working'}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-lg py-3 rounded transition"
          >
            {status === 'working' ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-slate-400 text-xs text-center mt-6">
          Same account as TOC-Dayplans / Student Hub / Report Card Tool / Kawahoot.
        </p>
      </div>
    </main>
  )
}
