import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const tabs = [
    {
      label: 'Home', path: '/', icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" />
        </svg>
      )
    },
    {
      label: 'Duels', path: '/duels', icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M6 4l12 8-12 8V4z" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      label: 'Me', path: '/profile', icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={active ? '#3B6D11' : '#888'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex max-w-md mx-auto">
      {tabs.map(tab => {
        const active = path === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center gap-1 py-3 cursor-pointer border-none bg-transparent"
          >
            {tab.icon(active)}
            <span className={`text-[11px] ${active ? 'text-[#3B6D11]' : 'text-gray-400'}`}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}