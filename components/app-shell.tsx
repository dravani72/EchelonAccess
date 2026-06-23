import {
  Bell,
  Building2,
  Clock3,
  Command,
  ContactRound,
  FileStack,
  GitBranch,
  LayoutDashboard,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Users
} from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { OfflineStatus } from "@/components/offline-status";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { id: "dashboard", label: "Network Desk", icon: LayoutDashboard, href: "/" },
  { id: "add", label: "Add Relationship", icon: SquarePen, href: "/relationships/new" },
  { id: "people", label: "People", icon: Users, href: "/#people" },
  { id: "organizations", label: "Organizations", icon: Building2, href: "/#organizations" },
  { id: "cards", label: "Business Cards", icon: FileStack, href: "/#cards" },
  { id: "mandates", label: "Mandates", icon: GitBranch, href: "/#mandates" },
  { id: "graph", label: "Relationship Graph", icon: Network, href: "/#graph" },
  { id: "outreach", label: "Outreach Queue", icon: ContactRound, href: "/#outreach" },
  { id: "timeline", label: "Timeline", icon: Clock3, href: "/#timeline" },
  { id: "settings", label: "Settings", icon: Settings, href: "/#settings" }
];

export function AppShell({ activeSection = "dashboard", children }: { activeSection?: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="brand-title">EchelonAccess</div>
            <div className="brand-subtitle">Relationship intelligence</div>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          {navItems.map((item) => (
            <a className={`nav-item ${activeSection === item.id ? "active" : ""}`} href={withBasePath(item.href)} key={item.label}>
              <item.icon size={17} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="workspace-note">
          Private operator workspace. Current context: infrastructure, energy, and strategic capital mandates.
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <label className="search">
            <Search size={17} />
            <input placeholder="Search people, old titles, card text, mandates..." />
            <span className="kbd">
              <Command size={11} /> K
            </span>
          </label>
          <button className="button" type="button">
            <Bell size={16} />
            Review queue
          </button>
          <OfflineStatus />
          <SignOutButton />
          <a className="button primary" href={withBasePath("/relationships/new")}>
            <Plus size={16} />
            Add
          </a>
        </header>
        {children}
      </main>
    </div>
  );
}
