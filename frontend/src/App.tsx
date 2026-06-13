import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import AgentChat from './pages/AgentChat'

const Campaigns = lazy(() => import('./pages/Campaigns'))
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'))
const Customers = lazy(() => import('./pages/Customers'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const Segments = lazy(() => import('./pages/Segments'))
const Analytics = lazy(() => import('./pages/Analytics'))

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agent" element={<AgentChat />} />
          <Route path="/campaigns" element={<Suspense fallback={<PageLoader />}><Campaigns /></Suspense>} />
          <Route path="/campaigns/:id" element={<Suspense fallback={<PageLoader />}><CampaignDetail /></Suspense>} />
          <Route path="/customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="/customers/:id" element={<Suspense fallback={<PageLoader />}><CustomerProfile /></Suspense>} />
          <Route path="/segments" element={<Suspense fallback={<PageLoader />}><Segments /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
