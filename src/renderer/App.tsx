import { Routes, Route } from 'react-router-dom'
import Layout from './app/Layout'
import Dashboard from './pages/Dashboard'
import Triggers from './pages/Triggers'
import OverlayStudio from './pages/OverlayStudio'
import Assets from './pages/Assets'
import Profiles from './pages/Profiles'
import Plugins from './pages/Plugins'
import Settings from './pages/Settings'
import Live from './pages/Live'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="live" element={<Live />} />
        <Route path="triggers" element={<Triggers />} />
        <Route path="overlay" element={<OverlayStudio />} />
        <Route path="assets" element={<Assets />} />
        <Route path="profiles" element={<Profiles />} />
        <Route path="plugins" element={<Plugins />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
