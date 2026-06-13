import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Shell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto border-l border-border-subtle">
        <Outlet />
      </main>
    </div>
  )
}
