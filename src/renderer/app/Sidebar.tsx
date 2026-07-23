import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radio,
  Zap,
  Palette,
  FolderOpen,
  User,
  Puzzle,
  Settings
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live', icon: Radio },
  { path: '/triggers', label: 'Triggers', icon: Zap },
  { path: '/overlay', label: 'Overlay Studio', icon: Palette },
  { path: '/assets', label: 'Assets', icon: FolderOpen },
  { path: '/profiles', label: 'Profiles', icon: User },
  { path: '/plugins', label: 'Plugins', icon: Puzzle },
  { path: '/settings', label: 'Settings', icon: Settings }
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-text-primary">Maulfinity</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-bg-dark hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-text-secondary text-center">
          v0.1.0
        </div>
      </div>
    </aside>
  )
}
