import { useEffect, useState } from "react";
import Sidebar, { SidebarContent } from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function AppLayout({ title, subtitle, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[260px] bg-navy-900 animate-fadeUp">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setDrawerOpen(true)} />
        <main className="px-4 sm:px-8 py-7 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
