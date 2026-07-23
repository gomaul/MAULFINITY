import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function Header() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [platform, setPlatform] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const result = await window.maulfinity.system.getStatus()
      setStatus(result.connected ? 'connected' : 'disconnected')
      setPlatform(result.platform)
    } catch {
      setStatus('disconnected')
    }
  }

  return (
    <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-4 no-drag">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          status === 'connected'
            ? 'bg-success/10 text-success'
            : status === 'connecting'
            ? 'bg-warning/10 text-warning'
            : 'bg-error/10 text-error'
        }`}>
          {status === 'connected' ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Connected to {platform || 'Platform'}</span>
            </>
          ) : status === 'connecting' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Disconnected</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 no-drag">
        {/* Placeholder for future controls */}
      </div>
    </header>
  )
}
