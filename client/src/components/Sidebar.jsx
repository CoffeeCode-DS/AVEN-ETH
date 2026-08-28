import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M3 10.5 10 4l7 6.5M5 9v7h10V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  agreements: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <rect x="4" y="2.5" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 6.5h6M7 9.5h6M7 12.5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M4 7h9l-2.5-2.5M16 13H7l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M6 8a4 4 0 0 1 8 0c0 3.2 1 4 1 4H5s1-.8 1-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  blockchain: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <rect x="2.5" y="3" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="12" y="3" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7.25" y="11.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6h4M5.25 8.5v3M14.75 8.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M10 2.5 16 5v4.5c0 4-2.5 6.8-6 8-3.5-1.2-6-4-6-8V5l6-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 10 9.3 11.8 12.8 8.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function navItemsFor(role) {
  if (role === "CLIENT") {
    return [
      { to: "/", label: "Overview", icon: ICONS.overview, end: true },
      { to: "/agreements", label: "Agreements", icon: ICONS.agreements },
      { to: "/transactions", label: "Transactions", icon: ICONS.transactions },
      { to: "/blockchain", label: "Blockchain", icon: ICONS.blockchain },
      { to: "/security", label: "Security", icon: ICONS.security },
      { to: "/notifications", label: "Notifications", icon: ICONS.notifications },
      { to: "/profile", label: "Profile", icon: ICONS.profile },
    ];
  }
  return [
    { to: "/", label: "Overview", icon: ICONS.overview, end: true },
    { to: "/agreements", label: "Projects", icon: ICONS.agreements },
    { to: "/work-sessions", label: "Work Sessions", icon: ICONS.work },
    { to: "/transactions", label: "Transactions", icon: ICONS.transactions },
    { to: "/blockchain", label: "Blockchain", icon: ICONS.blockchain },
    { to: "/security", label: "Security", icon: ICONS.security },
    { to: "/notifications", label: "Notifications", icon: ICONS.notifications },
    { to: "/profile", label: "Profile", icon: ICONS.profile },
  ];
}

export function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const items = navItemsFor(user.role);

  return (
    <div className="flex flex-col h-full text-white">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-sm">
          A
        </div>
        <div>
          <p className="font-display font-semibold text-[15px] leading-none">AVEN-ETH</p>
          <p className="text-[10px] text-white/40 mt-1 tracking-wide">SIMULATION MODE</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/10 mt-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
            {user.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-white/40 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
              <path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M13 6.5 16.5 10 13 13.5M7 10h9.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-navy-900 h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}
