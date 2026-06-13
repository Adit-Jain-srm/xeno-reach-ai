import { Routes, Route } from 'react-router-dom'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import AgentChat from './pages/AgentChat'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Customers from './pages/Customers'
import Segments from './pages/Segments'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agent" element={<AgentChat />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/segments" element={<Segments />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}
