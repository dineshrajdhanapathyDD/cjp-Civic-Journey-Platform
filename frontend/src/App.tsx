import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CivicAgent from './pages/CivicAgent'
import Issues from './pages/Issues'
import IssueDetails from './pages/IssueDetails'
import Jobs from './pages/Jobs'
import AgentActivity from './pages/AgentActivity'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agent" element={<CivicAgent />} />
          <Route path="issues" element={<Issues />} />
          <Route path="issues/:id" element={<IssueDetails />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="activity" element={<AgentActivity />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
