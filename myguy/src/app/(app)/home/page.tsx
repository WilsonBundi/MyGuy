import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faCompass, faComment, faUser, faPlus, faBell, faUsers, faStar } from '@fortawesome/free-solid-svg-icons'
import PingFeed from '@/components/PingFeed'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  const bottomNav = [
    { label: 'Home', href: '/home', icon: faHome, active: true },
    { label: 'Circles', href: '/circles', icon: faUsers, active: false },
    { label: 'Create', href: '/create', icon: faPlus, active: false },
    { label: 'Chats', href: '/chats', icon: faComment, active: false },
    { label: 'You', href: `/profile/${session.user?.username || ''}`, icon: faUser, active: false }
  ]

  const circleHighlights = [
    { name: 'City Walkers', tone: 'from-amber-400 to-orange-500', members: '2.4k' },
    { name: 'Night Creators', tone: 'from-violet-400 to-fuchsia-500', members: '860' },
    { name: 'Founders Lab', tone: 'from-cyan-400 to-sky-500', members: '1.2k' }
  ]

  return (
    <main className="min-h-screen bg-[#f3efe9] text-[#1a1a1a]">
      <div className="mx-auto max-w-[430px] pb-24">
        <header className="sticky top-0 z-20 border-b border-[#dccfc4] bg-[#f7f0ea]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-black text-white shadow-[0_10px_20px_rgba(249,115,22,0.28)]">
                M
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">MyGuy</div>
                <div className="text-sm font-semibold text-[#201b18]">Your world</div>
              </div>
            </div>

            <button
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ebddd3] bg-white text-[#4a4039] shadow-sm transition hover:bg-[#fffaf6]"
            >
              <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="space-y-4 px-4 pb-6 pt-4">
          <section className="rounded-[28px] bg-gradient-to-br from-[#201d1b] via-[#2a2320] to-[#201d1b] p-4 text-white shadow-[0_20px_40px_rgba(32,29,27,0.18)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Pulse</div>
                <h1 className="mt-2 text-2xl font-black tracking-tight">Good evening, {session.user?.name?.split(' ')[0] || 'friend'}</h1>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-orange-200">
                <FontAwesomeIcon icon={faStar} className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                <span>Today</span>
                <span>12 nearby</span>
              </div>
              <p className="text-base font-medium text-white">You are 3 conversations away from your next meaningful connection.</p>
            </div>
          </section>

          <section className="rounded-[26px] border border-[#eadfd5] bg-[#fffaf7] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Quick share</div>
                <h2 className="text-lg font-bold text-[#201b18]">Start a ping</h2>
              </div>
              <button className="rounded-full bg-[#fff1e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                New
              </button>
            </div>

            <button className="flex w-full items-center gap-3 rounded-[22px] border border-[#f1e3d8] bg-white px-3 py-3 text-left shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm">
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              </div>
              <span className="flex-1 text-base font-medium text-stone-500">Share what&apos;s happening in your world</span>
            </button>
          </section>

          <section className="rounded-[26px] border border-[#eadfd5] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Circles</div>
                <h2 className="text-lg font-bold text-[#201b18]">Communities close to you</h2>
              </div>
              <button className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">View</button>
            </div>

            <div className="space-y-3">
              {circleHighlights.map((circle) => (
                <div key={circle.name} className="flex items-center gap-3 rounded-[20px] border border-[#f1e7df] bg-[#fffaf6] p-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${circle.tone} text-lg font-black text-white`}>
                    {circle.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#201b18]">{circle.name}</div>
                    <div className="text-[11px] text-stone-500">{circle.members} members</div>
                  </div>
                  <button className="rounded-full bg-[#fdf1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-[#eadfd5] bg-[#fffaf7] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Feed</div>
                <h2 className="text-lg font-bold text-[#201b18]">Fresh from your network</h2>
              </div>
              <span className="rounded-full bg-[#f8efe9] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                0 posts
              </span>
            </div>

            <div className="flex min-h-[220px] items-center justify-center rounded-[22px] border border-dashed border-[#e5d4c6] bg-[#fffdfb] p-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1e7] text-orange-500">
                  <FontAwesomeIcon icon={faCompass} className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold text-[#201b18]">No pings yet</p>
                <p className="mt-2 text-sm text-stone-500">Your first conversation will appear here.</p>
              </div>
            </div>
          </section>

          <div className="pt-1">
            <PingFeed />
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#e8d9ce] bg-[#fffdfb]/95 backdrop-blur-sm shadow-[0_-12px_30px_rgba(17,17,17,0.04)]">
        <div className="mx-auto flex max-w-[430px] items-center justify-around px-2 py-2.5">
          {bottomNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                item.active ? 'text-orange-600' : 'text-stone-500 hover:text-orange-600'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </main>
  )
}
