'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faLock, faUser, faGlobe } from '@fortawesome/free-solid-svg-icons'

export default function SigninPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier: formData.identifier,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'Invalid credentials') {
          setError('Invalid email, phone, or username')
        } else {
          setError(result.error)
        }
        throw new Error(result.error)
      }

      router.push('/home')
      router.refresh()
    } catch (err) {
      if (!error) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffaf4_0%,_#f4eee8_45%,_#eee7df_100%)] px-4 py-8">
      <div className="mx-auto flex max-w-[430px] flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-400 via-amber-400 to-rose-500 text-2xl font-black text-white shadow-[0_20px_35px_rgba(249,115,22,0.22)]">
            M
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">Global community</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1c1917]">MyGuy</h1>
        </div>

        <section className="rounded-[30px] border border-[#eedfd1] bg-white/90 p-5 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Welcome back</p>
              <h2 className="text-2xl font-bold text-[#1c1917]">Sign in</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e9] text-orange-600">
              <FontAwesomeIcon icon={faGlobe} className="h-5 w-5" />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-stone-700">
                Username, email, or phone number
              </label>
              <div className="flex items-center gap-3 rounded-[18px] border border-[#f0e2d6] bg-[#faf7f4] px-3 py-3 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-stone-400" />
                <input
                  id="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full border-0 bg-transparent text-base text-[#1c1917] placeholder:text-stone-400 focus:outline-none"
                  placeholder="Username, email, or phone with country code"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-[18px] border border-[#f0e2d6] bg-[#faf7f4] px-3 py-3 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-stone-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border-0 bg-transparent text-base text-[#1c1917] placeholder:text-stone-400 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.22)] transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-orange-600 underline-offset-2 hover:underline">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
