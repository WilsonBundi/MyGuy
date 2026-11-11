import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffaf6_0%,_#f5efe9_48%,_#ece3dd_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center">
        <div className="w-full overflow-hidden rounded-[34px] border border-[#f0e1d4] bg-white/80 p-5 shadow-[0_28px_70px_rgba(28,25,23,0.08)] backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-orange-400 via-amber-400 to-rose-500 text-xl font-black text-white shadow-[0_18px_28px_rgba(249,115,22,0.22)]">
                M
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">MyGuy</p>
                <p className="text-xs text-stone-500">Stay close</p>
              </div>
            </div>

            <div className="rounded-full bg-[#fff3ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
              Live
            </div>
          </div>

          <section className="rounded-[28px] bg-gradient-to-br from-[#201d1b] via-[#2c2623] to-[#201d1b] p-4 text-white shadow-[0_18px_36px_rgba(32,29,27,0.18)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">People. Moments. Everywhere.</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Find your people.</h1>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Talk, share, and discover what&apos;s happening around you in real time.
            </p>
          </section>

          <div className="mt-5 space-y-3">
            <Link
              href="/auth/signup"
              className="flex w-full items-center justify-center rounded-[18px] bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(249,115,22,0.22)] transition hover:brightness-105"
            >
              Create your account
            </Link>

            <Link
              href="/auth/signin"
              className="flex w-full items-center justify-center rounded-[18px] border border-[#eedfd1] bg-[#fffaf7] px-4 py-3.5 text-base font-semibold text-[#201b18] transition hover:bg-[#fff4ee]"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-stone-600">
            <div className="rounded-[18px] border border-[#f2e7df] bg-[#fffaf6] px-2 py-3">
              <div className="mb-1 text-base">🌍</div>
              Nearby
            </div>
            <div className="rounded-[18px] border border-[#f2e7df] bg-[#fffaf6] px-2 py-3">
              <div className="mb-1 text-base">💬</div>
              Real-time
            </div>
            <div className="rounded-[18px] border border-[#f2e7df] bg-[#fffaf6] px-2 py-3">
              <div className="mb-1 text-base">🔒</div>
              Private
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
