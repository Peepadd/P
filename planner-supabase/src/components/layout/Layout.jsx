import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="h-[100dvh] flex bg-bg overflow-hidden text-fg font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="flex-1 shrink-0 p-0 md:p-6 pb-safe">
          <Outlet />
        </div>
        <MobileNav />
      </main>
    </div>
  )
}
