"use client";

import {
  Bell,
  Building2,
  Command,
  ContactRound,
  FileStack,
  GitBranch,
  LayoutDashboard,
  Network,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  Users
} from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { BASE_PATH, withBasePath } from "@/lib/base-path";
import { OfflineStatus } from "@/components/offline-status";
import { SignOutButton } from "@/components/sign-out-button";

const workspaceItems = [
  { id: "dashboard", label: "Network Desk", icon: LayoutDashboard, href: "/#graph", meta: "Map" },
  { id: "opportunities", label: "Intro Paths", icon: Network, href: "/#opportunities", meta: "Score" },
  { id: "people", label: "People", icon: Users, href: "/#people", meta: "Edit" },
  { id: "dossier", label: "Dossier", icon: FileStack, href: "/#dossier", meta: "Inspect" },
  { id: "mandates", label: "Mandates", icon: GitBranch, href: "/#mandates", meta: "Define" },
  { id: "organizations", label: "Organizations", icon: Building2, href: "/#organizations", meta: "Scope" },
  { id: "outreach", label: "Outreach", icon: ContactRound, href: "/#outreach", meta: "Queue" }
];

const actionItems = [
  { id: "add", label: "New Relationship", icon: SquarePen, href: "/relationships/new", tone: "blue" },
  { id: "define-mandate", label: "New Mandate", icon: GitBranch, href: "/mandates/new", tone: "purple" }
];

const hashSectionMap: Record<string, string> = {
  graph: "dashboard",
  opportunities: "opportunities",
  people: "people",
  dossier: "dossier",
  mandates: "mandates",
  organizations: "organizations",
  outreach: "outreach"
};

const sidebarStyles = `
  .nav {
    gap: 18px;
  }

  .nav-section {
    display: grid;
    gap: 6px;
  }

  .nav-section-title {
    color: var(--subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .nav-item {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 9px;
    border: 1px solid transparent;
    padding: 8px 9px;
  }

  .nav-item.active,
  .nav-item:hover {
    border-color: rgba(105, 167, 255, 0.28);
    background: rgba(105, 167, 255, 0.08);
  }

  .nav-icon {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    color: var(--blue);
    background: rgba(105, 167, 255, 0.07);
  }

  .nav-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-meta {
    color: var(--subtle);
    font-size: 11px;
  }

  .nav-action-section {
    border-top: 1px solid var(--line-soft);
    padding-top: 14px;
  }

  .nav-action {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0 11px;
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
  }

  .nav-action-blue {
    border-color: rgba(105, 167, 255, 0.42);
    background: rgba(105, 167, 255, 0.1);
  }

  .nav-action-purple {
    border-color: rgba(185, 149, 255, 0.42);
    background: rgba(185, 149, 255, 0.1);
  }

  .nav-action.active,
  .nav-action:hover {
    filter: brightness(1.12);
  }
`;

export function AppShell({ activeSection = "dashboard", children }: { activeSection?: string; children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState(activeSection);

  function handleWorkspaceNavigation(event: MouseEvent<HTMLAnchorElement>, hash: string) {
    const normalizedBasePath = BASE_PATH || "";
    const currentPath = window.location.pathname;
    const isHomePath = currentPath === `${normalizedBasePath}/` || currentPath === normalizedBasePath || currentPath === "/";

    if (!isHomePath) return;

    event.preventDefault();
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  useEffect(() => {
    function syncActiveSection() {
      const hash = window.location.hash.replace("#", "");
      setCurrentSection(hashSectionMap[hash] ?? activeSection);
    }

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, [activeSection]);

  return (
    <div className="app-shell">
      <style>{sidebarStyles}</style>
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
          <div className="nav-section">
            <div className="nav-section-title">Workspace</div>
            {workspaceItems.map((item) => (
              <a
                className={`nav-item ${currentSection === item.id ? "active" : ""}`}
                href={withBasePath(item.href)}
                key={item.label}
                onClick={(event) => handleWorkspaceNavigation(event, item.href.replace("/", ""))}
              >
                <span className="nav-icon">
                  <item.icon size={16} />
                </span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-meta">{item.meta}</span>
              </a>
            ))}
          </div>

          <div className="nav-section nav-action-section">
            <div className="nav-section-title">Create</div>
            {actionItems.map((item) => (
              <a
                className={`nav-action nav-action-${item.tone} ${currentSection === item.id ? "active" : ""}`}
                href={withBasePath(item.href)}
                key={item.label}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
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
          <a className="button" href={withBasePath("/#outreach")} onClick={(event) => handleWorkspaceNavigation(event, "#outreach")}>
            <Bell size={16} />
            Review queue
          </a>
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
