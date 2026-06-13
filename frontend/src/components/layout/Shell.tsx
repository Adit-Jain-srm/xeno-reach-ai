import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import GradientMesh from '../ui/GradientMesh'

export default function Shell() {
  return (
    <div className="flex h-screen overflow-hidden bg-base relative">
      <GradientMesh />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
