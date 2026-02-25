import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  {
    to: '/',
    label: 'Welcome',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
  },
  {
    to: '/studio',
    label: 'Studio',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

interface NavBarProps {
  isToolsOpen?: boolean
  onToolsToggle?: () => void
}

const NavBar: React.FC<NavBarProps> = ({ isToolsOpen, onToolsToggle }) => {
  return (
    <nav
      className="flex items-center px-3 py-2 gap-1 border-b"
      style={{
        background: 'var(--t-surface)',
        borderColor: 'var(--t-border)',
      }}
    >
      {/* Brand */}
      <span
        className="font-bold text-sm mr-3 whitespace-nowrap"
        style={{ color: 'var(--t-primary)' }}
      >
        A(Us) Studio
      </span>

      {/* Links */}
      <div className="flex gap-1 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                isActive ? '' : 'hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--t-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--t-muted)',
              borderRadius: 'var(--t-radius)',
            })}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={l.icon} />
            </svg>
            {l.label}
          </NavLink>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tools toggle (only on /studio) */}
      {onToolsToggle && (
        <button
          onClick={onToolsToggle}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium mr-2"
          style={{
            background: isToolsOpen ? 'var(--t-primary)' : 'transparent',
            color: isToolsOpen ? '#fff' : 'var(--t-muted)',
            borderRadius: 'var(--t-radius)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 150ms, color 150ms',
          }}
          aria-label="Toggle tools drawer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
            />
          </svg>
          <span className="hidden sm:inline">Tools</span>
        </button>
      )}

      {/* Status badge */}
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={{
          background: 'var(--t-primary)',
          color: '#fff',
          opacity: 0.8,
        }}
      >
        v0.1
      </span>
    </nav>
  )
}

export default NavBar
