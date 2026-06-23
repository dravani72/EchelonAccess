"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/badge";
import type { AppData } from "@/lib/data";

const RelationshipIntake = dynamic(() => import("@/components/relationship-intake").then((mod) => mod.RelationshipIntake), {
  ssr: false,
  loading: () => <PanelLoading label="Loading intake" />
});
const PeopleTable = dynamic(() => import("@/components/people-table").then((mod) => mod.PeopleTable), {
  ssr: false,
  loading: () => <PanelLoading label="Loading people" />
});
const PersonDossier = dynamic(() => import("@/components/person-dossier").then((mod) => mod.PersonDossier), {
  ssr: false,
  loading: () => <PanelLoading label="Loading dossier" />
});
const MandatesPanel = dynamic(() => import("@/components/mandates-panel").then((mod) => mod.MandatesPanel), {
  ssr: false,
  loading: () => <PanelLoading label="Loading mandates" />
});
const OutreachQueue = dynamic(() => import("@/components/outreach-queue").then((mod) => mod.OutreachQueue), {
  ssr: false,
  loading: () => <PanelLoading label="Loading outreach" />
});

type WorkspaceView = "overview" | "people" | "dossier" | "intake" | "mandates" | "outreach";

const views: { id: WorkspaceView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People" },
  { id: "dossier", label: "Dossier" },
  { id: "intake", label: "Add" },
  { id: "mandates", label: "Mandates" },
  { id: "outreach", label: "Outreach" }
];

export function ResponsiveWorkspace({ data }: { data: AppData }) {
  const [activeView, setActiveView] = useState<WorkspaceView>("overview");
  const [isPending, startTransition] = useTransition();
  const counts = useMemo(
    () => ({
      people: data.people.length,
      mandates: data.mandates.length,
      cards: data.businessCards.length,
      outreach: data.outreachQueue.length,
      review: data.reviewTasks.length
    }),
    [data.businessCards.length, data.mandates.length, data.outreachQueue.length, data.people.length, data.reviewTasks.length]
  );

  function openView(view: WorkspaceView) {
    startTransition(() => setActiveView(view));
  }

  return (
    <section className="panel" aria-busy={isPending} style={{ overflow: "visible" }}>
      <div className="panel-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 className="panel-title">Workspace</h2>
          <div className="section-kicker">
            Heavy views load one at a time to keep the interface responsive.
          </div>
        </div>
        <div className="badge-row">
          <Badge tone="blue">{counts.people} people</Badge>
          <Badge tone="purple">{counts.mandates} mandates</Badge>
          <Badge tone="amber">{counts.cards} cards</Badge>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Workspace views" style={{ flexWrap: "wrap", paddingTop: 0 }}>
        {views.map((view) => (
          <button
            aria-selected={activeView === view.id}
            className={`tab ${activeView === view.id ? "active" : ""}`}
            key={view.id}
            onClick={() => openView(view.id)}
            role="tab"
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="panel-body" role="tabpanel">
        {activeView === "overview" ? <Overview counts={counts} diagnostic={data.diagnostic} workspaceName={data.currentWorkspace?.name} /> : null}
        {activeView === "people" ? (
          <PeopleTable
            mandates={data.mandates}
            outreachQueue={data.outreachQueue}
            people={data.people}
            roles={data.roles}
            source={data.source}
          />
        ) : null}
        {activeView === "dossier" ? (
          <PersonDossier businessCards={data.businessCards} interactions={data.interactions} people={data.people} roles={data.roles} />
        ) : null}
        {activeView === "intake" ? <RelationshipIntake source={data.source} workspaceId={data.currentWorkspace?.id} /> : null}
        {activeView === "mandates" ? <MandatesPanel mandates={data.mandates} /> : null}
        {activeView === "outreach" ? <OutreachQueue outreachQueue={data.outreachQueue} /> : null}
      </div>
    </section>
  );
}

function Overview({
  counts,
  diagnostic,
  workspaceName
}: {
  counts: { people: number; mandates: number; cards: number; outreach: number; review: number };
  diagnostic?: string;
  workspaceName?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="review-section">
        <div className="field-label">Data Source</div>
        <div className="field-value">{diagnostic ?? `Connected to Supabase workspace: ${workspaceName ?? "Workspace"}.`}</div>
      </div>
      <div className="dossier-grid">
        <SummaryCard label="Relationships" value={counts.people} />
        <SummaryCard label="Review Tasks" value={counts.review} />
        <SummaryCard label="Outreach Items" value={counts.outreach} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="review-section">
      <div className="field-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function PanelLoading({ label }: { label: string }) {
  return <div className="empty-state">{label}...</div>;
}
