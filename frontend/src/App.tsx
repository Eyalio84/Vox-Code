import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider, useThemeContext } from './context/ThemeContext'
import NavBar from './components/NavBar'
import ThemeShell from './components/ThemeShell'
import WelcomePage from './pages/WelcomePage'
import StudioPage from './pages/StudioPage'
import SettingsPage from './pages/SettingsPage'

/** Inner shell that binds containerRef for dissolve-rebuild animations */
const AppShell: React.FC = () => {
  const { themeId, containerRef } = useThemeContext()
  const location = useLocation()
  const isStudioRoute = location.pathname === '/studio'
  const [isToolsOpen, setIsToolsOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--t-bg)' }}>
      <NavBar
        isToolsOpen={isToolsOpen}
        onToolsToggle={isStudioRoute ? () => setIsToolsOpen((prev) => !prev) : undefined}
      />
      <ThemeShell themeId={themeId}>
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route
              path="/studio"
              element={
                <StudioPage
                  isToolsOpen={isToolsOpen}
                  onCloseTools={() => setIsToolsOpen(false)}
                />
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeShell>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

export default App
