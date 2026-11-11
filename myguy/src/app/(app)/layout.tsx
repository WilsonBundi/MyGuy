import Navigation from '@/components/Navigation'
import OnlineStatusManager from '@/components/OnlineStatusManager'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#eae7e3] px-0">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#f5f5f5] shadow-[0_0_0_1px_rgba(17,17,17,0.04),0_18px_45px_rgba(17,17,17,0.08)]">
        <OnlineStatusManager />
        <Navigation />
        <div className="pb-20">{children}</div>
      </div>
    </div>
  )
}
