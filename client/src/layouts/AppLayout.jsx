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
    <div className="flex min-h-screen bg-[#000000] text-[#F1F5F9] font-sans antialiased selection:bg-[#6366F1] selection:text-white">
      <Sidebar />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[260px] bg-[#000000] border-r border-white/[0.08] animate-fadeUp z-10">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col bg-[#000000]">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
