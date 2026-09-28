import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ExternalLink, HelpCircle, Images, Inbox, LayoutDashboard, Loader2, LogOut, Map, Menu, MessageSquareQuote, Newspaper, Package, PhoneCall, Plane, Settings as SettingsIcon, X } from "lucide-react";
import { getAdminStats, getCurrentUser, logoutAdmin } from "@/api";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import Enquiries from "./Enquiries";
import Contacts from "./Contacts";
import Destinations from "./Destinations";
import Packages from "./Packages";
import { BlogPage, FaqsPage, GalleryPage, TestimonialsPage } from "./ContentPages";
import SettingsPage from "./Settings";
import { displayFont } from "./ui";

const NAV = [
  { group: "Overview" },
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { group: "Leads" },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, badge: "new_enquiries" },
  { to: "/admin/contacts", label: "Contact Messages", icon: PhoneCall, badge: "new_contacts" },
  { group: "Content" },
  { to: "/admin/destinations", label: "Destinations", icon: Map },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { group: "System" },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

const navItemCls = "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors duration-150 border-l-4 border-transparent";
const navActiveCls = "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1E3E62] shadow-sm border-l-4 border-[#D97706]";

export default function AdminApp() {
  const [user, setUser] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { getCurrentUser().then(setUser).catch(() => setUser(null)); }, []);

  const refreshStats = useCallback(() => { getAdminStats().then(setStats).catch(() => {}); }, []);
  useEffect(() => { if (user) refreshStats(); }, [user, refreshStats]);
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex flex-col items-center justify-center gap-3 text-slate-300" data-testid="admin-loading">
        <Loader2 className="animate-spin" size={26} />
        <p className="text-sm">Preparing your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <AdminLogin onSuccess={setUser} />
      </>
    );
  }

  const current = NAV.filter((item) => item.to).find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));

  const logout = async () => {
    await logoutAdmin().catch(() => {});
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }} data-testid="admin-panel">
      <Toaster position="top-right" richColors closeButton />
      {navOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setNavOpen(false)} data-testid="admin-nav-overlay" />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800 shadow-xl transition-transform duration-200 ${navOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} data-testid="admin-sidebar">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-[#D97706] flex items-center justify-center"><Plane size={17} /></span>
            <div>
              <p className="text-sm font-extrabold tracking-wide leading-none" style={displayFont}>SUKHARA</p>
              <p className="text-[9px] tracking-[0.28em] text-slate-400 mt-1">ADMIN PANEL</p>
            </div>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white" onClick={() => setNavOpen(false)} aria-label="Close navigation" data-testid="admin-nav-close-button"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
          {NAV.map((item, index) => item.group ? (
            <p key={`group-${index}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-3.5 pt-4 pb-1 first:pt-1">{item.group}</p>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} data-testid={`admin-sidebar-nav-${item.label.toLowerCase().replaceAll(" ", "-")}`}
              className={({ isActive }) => (isActive ? navActiveCls : navItemCls)}>
              <item.icon size={17} strokeWidth={2} />
              {item.label}
              {item.badge && stats?.counts?.[item.badge] > 0 && (
                <span className="ml-auto text-[11px] font-bold bg-[#D97706] text-white rounded-full px-2 py-0.5" data-testid={`badge-${item.badge}`}>{stats.counts[item.badge]}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="h-9 w-9 rounded-full bg-[#1E3E62] border border-slate-700 flex items-center justify-center text-sm font-bold text-white" data-testid="admin-user-avatar">{(user.name || user.email || "A")[0].toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate" data-testid="admin-user-name">{user.name || "Administrator"}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Sign out" data-testid="admin-logout-button"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30" data-testid="admin-topbar">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors" onClick={() => setNavOpen(true)} aria-label="Open navigation" data-testid="admin-mobile-menu-button"><Menu size={20} /></button>
            <p className="text-sm text-slate-500">Admin <span className="mx-1 text-slate-300">/</span> <span className="font-semibold text-slate-800" data-testid="topbar-page-name">{current?.label || "Dashboard"}</span></p>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3E62] hover:text-[#0B192C] border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 transition-colors" data-testid="admin-view-website-link">View website <ExternalLink size={13} /></a>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route index element={<Dashboard stats={stats} user={user} />} />
            <Route path="enquiries" element={<Enquiries onChanged={refreshStats} />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="packages" element={<Packages />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
