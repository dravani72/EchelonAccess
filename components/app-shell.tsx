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
import { OfflineStatus } from "@/components/offline-status";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Add Relationship", icon: SquarePen },
  { label: "People", icon: Users },
  { label: "Organizations", icon: Building2 },
  { label: "Business Cards", icon: FileStack },
  { label: "Mandates", icon: GitBranch },
  { label: "Relationship Graph", icon: Network },
  { label: "Outreach Queue", icon: ContactRound },
  { label: "Timeline", icon: Clock3 },
  { label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
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
            <a className={`nav-item ${item.active ? "active" : ""}`} href={`#${item.label}`} key={item.label}>
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
          <a className="button primary" href="#Add Relationship">
            <Plus size={16} />
            Add
          </a>
        </header>
        {children}
      </main>
    </div>
  );
}
