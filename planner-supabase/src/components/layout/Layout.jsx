import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="h-[100dvh] flex bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* On desktop, we want a clean breathable top padding since we don't have a top Navbar anymore.
            The sidebar handles navigation entirely. Mobile gets the bottom tab bar. */}
        <div className="flex-1 shrink-0 p-0 md:p-6 pb-safe">
          <Outlet />
        </div>
        <MobileNav />
      </main>
    </div>
  )
}
