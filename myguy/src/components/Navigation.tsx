'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faShieldHalved, faUser } from '@fortawesome/free-solid-svg-icons'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-[#2b2b2b] bg-[#1a1a1a] text-white">
      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">MyGuy</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/10" aria-label="Notifications">
            <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5" />
          </button>

          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-[10px] font-bold text-white">
                {session.user?.name?.charAt(0) || 'U'}
              </span>
              <span>{session.user?.name || 'User'}</span>
            </button>
          ) : (
            <Link href="/auth/signin" className="flex items-center gap-2 rounded-full bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">
              <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-2 border-t border-white/5 px-3 pb-3 pt-2">
        <div className="flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#2a2a2a] px-2.5 py-1.5 text-[10px] text-white/80">
          <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 text-emerald-400" />
          Passkeys secured
        </div>
      </div>
    </nav>
  )
}
