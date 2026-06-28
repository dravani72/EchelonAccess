"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/badge";
import { withBasePath } from "@/lib/base-path";
import { formatStatus } from "@/lib/format";
import type { AppData } from "@/lib/data";
import type { Mandate, Person } from "@/types/domain";

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
const OrganizationsPanel = dynamic(() => import("@/components/organizations-panel").then((mod) => mod.OrganizationsPanel), {
  ssr: false,
  loading: () => <PanelLoading label="Loading organizations" />
});
const OutreachQueue = dynamic(() => import("@/components/outreach-queue").then((mod) => mod.OutreachQueue), {
  ssr: false,
  loading: () => <PanelLoading label="Loading outreach" />
});
const RelationshipGraph = dynamic(() => import("@/components/relationship-graph").then((mod) => mod.RelationshipGraph), {
  ssr: false,
  loading: () => <PanelLoading label="Loading graph" />
});

type WorkspaceView =
  | "relationship-map"
  | "intro-scoring"
  | "people"
  | "dossier"
  | "mandates"
  | "organizations"
  | "outreach";
type SharedCluster = {
  label: string;
  kind: "Sector" | "Geography" | "Institution" | "Mandate";
  people: Person[];
  mandates: Mandate[];
};
type IntroPath = {
  left: Person;
  right: Person;
  mandates: Mandate[];
  sharedSectors: string[];
  sharedGeographies: string[];
  score: number;
};
type MandateContext = {
  mandate: Mandate;
  people: Person[];
};
type RelationshipSummary = {
  clusters: SharedCluster[];
  mandateContexts: MandateContext[];
  organizationOverlaps: { label: string; people: Person[] }[];
  personSignals: PersonSignal[];
};
type TokenItem = ReturnType<typeof normalizeList>[number];
type PersonSignal = {
  person: Person;
  tokens: Set<string>;
  sectors: TokenItem[];
  geographies: TokenItem[];
  matchedMandates: Mandate[];
};
type MandateSignal = {
  mandate: Mandate;
  tokens: Set<string>;
};

const views: { id: WorkspaceView; label: string }[] = [
  { id: "relationship-map", label: "Relationship Map" },
  { id: "intro-scoring", label: "Intro Scoring" },
  { id: "people", label: "People Records" },
  { id: "dossier", label: "Person Dossiers" },
  { id: "mandates", label: "Mandate Definitions" },
  { id: "organizations", label: "Organization Scope" },
  { id: "outreach", label: "Outreach Queue" }
];

const hashViewMap: Record<string, WorkspaceView> = {
  graph: "relationship-map",
  opportunities: "intro-scoring",
  people: "people",
  dossier: "dossier",
  mandates: "mandates",
  organizations: "organizations",
  outreach: "outreach"
};

const emptyRelationshipSummary: RelationshipSummary = {
  clusters: [],
  mandateContexts: [],
  organizationOverlaps: [],
  personSignals: []
};

export function ResponsiveWorkspace({ data }: { data: AppData }) {
  const [activeView, setActiveView] = useState<WorkspaceView>("relationship-map");
  const [isPending, startTransition] = useTransition();
  const needsRelationshipSummary = activeView === "relationship-map" || activeView === "intro-scoring";
  const relationshipSummary = useMemo(
    () => (needsRelationshipSummary ? buildRelationshipSummary(data) : emptyRelationshipSummary),
    [data, needsRelationshipSummary]
  );
  const introPaths = useMemo(
    () => (activeView === "intro-scoring" ? buildIntroPaths(relationshipSummary.personSignals.slice(0, 180)) : []),
    [activeView, relationshipSummary.personSignals]
  );
  const counts = useMemo(
    () => ({
      people: data.people.length,
      mandates: data.mandates.length,
      activeModule: views.find((view) => view.id === activeView)?.label ?? "Module"
    }),
    [activeView, data.mandates.length, data.people.length]
  );

  function openView(view: WorkspaceView) {
    startTransition(() => setActiveView(view));
  }

  useEffect(() => {
    function syncHashView() {
      const nextView = hashViewMap[window.location.hash.replace("#", "")];
      if (nextView) {
        startTransition(() => setActiveView(nextView));
      }
    }

    syncHashView();
    window.addEventListener("hashchange", syncHashView);
    return () => window.removeEventListener("hashchange", syncHashView);
  }, []);

  return (
    <section className="panel" aria-busy={isPending} id="graph" style={{ overflow: "visible" }}>
      <div className="panel-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 className="panel-title">Workspace Modules</h2>
          <div className="section-kicker">
            Open one focused module at a time: map connections, score introductions, edit records, define mandates, scope organizations, or queue outreach.
          </div>
        </div>
        <div className="badge-row">
          <Badge tone="blue">{counts.people} people</Badge>
          <Badge tone="purple">{counts.mandates} mandates</Badge>
          <Badge tone="green">{counts.activeModule}</Badge>
          <a className="button" href={withBasePath("/mandates/new")}>
            Define mandate
          </a>
          <a className="button primary" href={withBasePath("/relationships/new")}>
            Define relationship
          </a>
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
        {activeView === "relationship-map" ? <RelationshipMapPanel data={data} summary={relationshipSummary} /> : null}
        {activeView === "intro-scoring" ? <IntroScoringBoard introPaths={introPaths} /> : null}
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
        {activeView === "mandates" ? <MandatesPanel mandates={data.mandates} /> : null}
        {activeView === "organizations" ? <OrganizationsPanel mandates={data.mandates} people={data.people} roles={data.roles} /> : null}
        {activeView === "outreach" ? <OutreachQueue outreachQueue={data.outreachQueue} /> : null}
      </div>
    </section>
  );
}

function RelationshipMapPanel({ data, summary }: { data: AppData; summary: RelationshipSummary }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <RelationshipGraph data={data} />

      <div className="review-section">
        <div className="field-label">Module Boundary</div>
        <div className="field-value">
          This panel only maps entity connections: people, mandates, organizations, scope signals, and evidence-backed overlaps.
        </div>
      </div>

      <div className="grid-two">
        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Mandate-Contact Matches</div>
              <div className="field-value">Active mandates with matched contacts.</div>
            </div>
            <Badge tone="purple">{summary.mandateContexts.length}</Badge>
          </div>
          <div className="parsed-fields">
            {summary.mandateContexts.slice(0, 5).map((context) => (
              <div key={context.mandate.id}>
                <dt>{context.mandate.title}</dt>
                <dd>
                  {context.people.slice(0, 4).map((person) => person.displayName).join(", ") || "No matched contacts yet"}
                  {context.people.length > 4 ? ` +${context.people.length - 4}` : ""}
                </dd>
              </div>
            ))}
            {!summary.mandateContexts.length ? <EmptyLine label="No mandate-contact matches yet." /> : null}
          </div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Shared Interest Clusters</div>
              <div className="field-value">People grouped by sector, geography, institution, or named mandate.</div>
            </div>
            <Badge tone="green">{summary.clusters.length}</Badge>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {summary.clusters.slice(0, 6).map((cluster) => (
              <ClusterRow cluster={cluster} key={`${cluster.kind}-${cluster.label}`} />
            ))}
            {!summary.clusters.length ? <div className="empty-state">No shared-interest clusters yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="grid-two">
        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Intro Scoring Shortcut</div>
              <div className="field-value">Pairwise scoring stays isolated in Intro Scoring.</div>
            </div>
            <Badge tone="blue">{summary.personSignals.length} signals</Badge>
          </div>
          <div className="empty-state">Open Intro Scoring to rank candidate introductions without loading the map editor.</div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Organization Role Overlaps</div>
              <div className="field-value">Organizations and prior roles that may reveal bridge paths.</div>
            </div>
            <Badge tone="amber">{summary.organizationOverlaps.length}</Badge>
          </div>
          <div className="parsed-fields">
            {summary.organizationOverlaps.slice(0, 6).map((overlap) => (
              <div key={overlap.label}>
                <dt>{overlap.label}</dt>
                <dd>{overlap.people.map((person) => person.displayName).join(", ")}</dd>
              </div>
            ))}
            {!summary.organizationOverlaps.length ? <EmptyLine label="No organization overlaps yet." /> : null}
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="field-label">Data Source</div>
        <div className="field-value">{data.diagnostic ?? `Connected to Supabase workspace: ${data.currentWorkspace?.name ?? "Workspace"}.`}</div>
      </div>
    </div>
  );
}

function IntroScoringBoard({ introPaths }: { introPaths: IntroPath[] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {introPaths.map((path) => (
        <article className="review-section" key={`${path.left.id}-${path.right.id}`}>
          <div className="review-section-header">
            <div>
              <div className="field-label">Candidate Introduction</div>
              <div className="review-match-name">
                {path.left.displayName}
                {" <> "}
                {path.right.displayName}
              </div>
            </div>
            <Badge tone={path.score >= 9 ? "green" : "blue"}>Score {path.score}</Badge>
          </div>
          <div className="badge-row" style={{ marginTop: 10 }}>
            {path.mandates.slice(0, 3).map((mandate) => (
              <Badge tone="purple" key={mandate.id}>
                {mandate.title}
              </Badge>
            ))}
            {path.sharedSectors.slice(0, 3).map((sector) => (
              <Badge tone="blue" key={sector}>
                {sector}
              </Badge>
            ))}
            {path.sharedGeographies.slice(0, 3).map((geography) => (
              <Badge tone="amber" key={geography}>
                {geography}
              </Badge>
            ))}
          </div>
          <p className="review-note">
            {path.left.displayName} is {formatStatus(path.left.warmthStatus)} at {path.left.currentOrganization}; {path.right.displayName} is{" "}
            {formatStatus(path.right.warmthStatus)} at {path.right.currentOrganization}. Use the shared context as the pretext before
            moving either person into outreach.
          </p>
        </article>
      ))}
      {!introPaths.length ? (
        <div className="empty-state">Add mandate, sector, geography, or institution fields to score introductions.</div>
      ) : null}
    </div>
  );
}

function ClusterRow({ cluster }: { cluster: SharedCluster }) {
  return (
    <div>
      <div className="badge-row">
        <Badge tone={cluster.kind === "Mandate" ? "purple" : cluster.kind === "Geography" ? "amber" : "blue"}>{cluster.kind}</Badge>
        <span className="field-value" style={{ marginTop: 0 }}>
          {cluster.label}
        </span>
      </div>
      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
        {cluster.people.slice(0, 4).map((person) => person.displayName).join(", ")}
        {cluster.people.length > 4 ? ` +${cluster.people.length - 4}` : ""}
      </div>
    </div>
  );
}

function IntroPathRow({ path }: { path: IntroPath }) {
  return (
    <div>
      <div className="badge-row">
        <Badge tone="green">Score {path.score}</Badge>
        <span className="field-value" style={{ marginTop: 0 }}>
          {path.left.displayName}
          {" <> "}
          {path.right.displayName}
        </span>
      </div>
      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
        {[...path.mandates.map((mandate) => mandate.title), ...path.sharedSectors, ...path.sharedGeographies].slice(0, 4).join(" / ")}
      </div>
    </div>
  );
}

function EmptyLine({ label }: { label: string }) {
  return (
    <div>
      <dt>Status</dt>
      <dd>{label}</dd>
    </div>
  );
}

function PanelLoading({ label }: { label: string }) {
  return <div className="empty-state">{label}...</div>;
}

function buildRelationshipSummary(data: AppData): RelationshipSummary {
  const people = data.people.slice(0, 400);
  const mandates = data.mandates.slice(0, 40);
  const mandateSignals = buildMandateSignals(mandates);
  const personSignals = buildPersonSignals(people, mandateSignals);
  const clusters = buildClusters(people, mandates);
  const mandateContexts = mandateSignals
    .map((mandateSignal) => ({
      mandate: mandateSignal.mandate,
      people: personSignals
        .map((personSignal) => ({ person: personSignal.person, score: countTokenOverlap(personSignal.tokens, mandateSignal.tokens) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((match) => match.person)
    }))
    .filter((context) => context.people.length)
    .sort((a, b) => b.people.length - a.people.length);

  return {
    clusters,
    mandateContexts,
    organizationOverlaps: buildOrganizationOverlaps(people, data.roles),
    personSignals
  };
}

function buildMandateSignals(mandates: Mandate[]): MandateSignal[] {
  return mandates.map((mandate) => ({
    mandate,
    tokens: new Set(
      normalizeList([
        mandate.title,
        mandate.sector,
        ...(mandate.geography ?? []),
        ...(mandate.tags ?? []),
        ...(mandate.desiredCounterparties ?? []),
        ...(mandate.strategicPartners ?? []),
        ...(mandate.decisionMakers ?? []),
        ...(mandate.gatekeepers ?? []),
        ...(mandate.influencers ?? [])
      ]).map((item) => item.token)
    )
  }));
}

function buildPersonSignals(people: Person[], mandateSignals: MandateSignal[]): PersonSignal[] {
  return people.map((person) => {
    const sectors = normalizeList([...person.sectorTags, ...(person.relevantSectors ?? [])]);
    const geographies = normalizeList([person.geography, ...(person.relevantGeographies ?? [])]);
    const tokens = new Set(
      normalizeList([
        ...person.sectorTags,
        person.geography,
        person.currentOrganization,
        ...(person.relevantMandates ?? []),
        ...(person.relevantGeographies ?? []),
        ...(person.relevantSectors ?? []),
        ...(person.relevantInstitutions ?? [])
      ]).map((item) => item.token)
    );

    return {
      person,
      tokens,
      sectors,
      geographies,
      matchedMandates: mandateSignals
        .filter((mandateSignal) => countTokenOverlap(tokens, mandateSignal.tokens) > 0)
        .map((mandateSignal) => mandateSignal.mandate)
    };
  });
}

function buildClusters(people: Person[], mandates: Mandate[]) {
  const buckets = new Map<string, SharedCluster>();

  for (const person of people) {
    addClusterValues(buckets, "Sector", person, person.sectorTags);
    addClusterValues(buckets, "Sector", person, person.relevantSectors ?? []);
    addClusterValues(buckets, "Geography", person, [person.geography, ...(person.relevantGeographies ?? [])]);
    addClusterValues(buckets, "Institution", person, [person.currentOrganization, ...(person.relevantInstitutions ?? [])]);
    addClusterValues(buckets, "Mandate", person, person.relevantMandates ?? []);
  }

  for (const mandate of mandates) {
    const values = [
      mandate.title,
      mandate.sector,
      ...(mandate.geography ?? []),
      ...(mandate.desiredCounterparties ?? []),
      ...(mandate.strategicPartners ?? []),
      ...(mandate.tags ?? [])
    ];
    for (const value of normalizeList(values)) {
      const key = clusterKey(value.kind, value.label);
      const cluster = buckets.get(key);
      if (cluster) {
        cluster.mandates.push(mandate);
      }
    }
  }

  return [...buckets.values()]
    .filter((cluster) => cluster.people.length > 1 || cluster.mandates.length > 0)
    .sort((a, b) => b.people.length + b.mandates.length - (a.people.length + a.mandates.length))
    .slice(0, 16);
}

function addClusterValues(buckets: Map<string, SharedCluster>, kind: SharedCluster["kind"], person: Person, values: Array<string | undefined>) {
  for (const label of normalizeList(values).map((value) => value.label)) {
    const key = clusterKey(kind, label);
    const cluster = buckets.get(key) ?? { label, kind, people: [], mandates: [] };
    if (!cluster.people.some((existing) => existing.id === person.id)) {
      cluster.people.push(person);
    }
    buckets.set(key, cluster);
  }
}

function buildIntroPaths(people: PersonSignal[]) {
  const paths: IntroPath[] = [];

  for (let leftIndex = 0; leftIndex < people.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < people.length; rightIndex += 1) {
      const leftSignal = people[leftIndex];
      const rightSignal = people[rightIndex];
      const left = leftSignal.person;
      const right = rightSignal.person;
      const sharedSectors = intersect(leftSignal.sectors, rightSignal.sectors);
      const sharedGeographies = intersect(leftSignal.geographies, rightSignal.geographies);
      const sharedMandates = intersectMandates(leftSignal.matchedMandates, rightSignal.matchedMandates);
      const score =
        sharedMandates.length * 3 +
        sharedSectors.length * 2 +
        sharedGeographies.length +
        Math.min(left.relationshipStrength, right.relationshipStrength);

      if (score >= 5) {
        paths.push({ left, right, mandates: sharedMandates, sharedSectors, sharedGeographies, score });
      }
    }
  }

  return paths.sort((a, b) => b.score - a.score).slice(0, 12);
}

function buildOrganizationOverlaps(people: Person[], roles: AppData["roles"]) {
  const byOrganization = new Map<string, { label: string; people: Person[] }>();
  const peopleById = new Map(people.map((person) => [person.id, person]));

  for (const person of people) {
    addOrganizationOverlap(byOrganization, person.currentOrganization, person);
  }

  for (const role of roles) {
    const person = peopleById.get(role.personId);
    if (person) addOrganizationOverlap(byOrganization, role.organizationName, person);
  }

  return [...byOrganization.values()]
    .filter((overlap) => overlap.people.length > 1)
    .sort((a, b) => b.people.length - a.people.length)
    .slice(0, 10);
}

function addOrganizationOverlap(buckets: Map<string, { label: string; people: Person[] }>, organization: string | undefined, person: Person) {
  if (!organization) return;
  const key = normalizeToken(organization);
  if (!key) return;
  const overlap = buckets.get(key) ?? { label: organization, people: [] };
  if (!overlap.people.some((existing) => existing.id === person.id)) {
    overlap.people.push(person);
  }
  buckets.set(key, overlap);
}

function intersect(left: TokenItem[], right: TokenItem[]) {
  const rightTokens = new Set(right.map((item) => item.token));
  return left.filter((item) => rightTokens.has(item.token)).map((item) => item.label);
}

function intersectMandates(left: Mandate[], right: Mandate[]) {
  const rightIds = new Set(right.map((mandate) => mandate.id));
  return left.filter((mandate) => rightIds.has(mandate.id));
}

function countTokenOverlap(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) count += 1;
  });
  return count;
}

function normalizeList(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .flatMap((value) => String(value ?? "").split(/[,/]/))
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, token: normalizeToken(label), kind: classifyToken(label) }))
    .filter((item) => {
      if (!item.token || seen.has(item.token)) return false;
      seen.add(item.token);
      return true;
    });
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
}

function classifyToken(label: string): SharedCluster["kind"] {
  if (/\b(capital|mandate|path|access|introductions?)\b/i.test(label)) return "Mandate";
  if (/\b(bank|capital|ministry|fund|group|department|university|council|authority)\b/i.test(label)) return "Institution";
  if (/\b(africa|america|asia|europe|london|brazil|singapore|ghana|nigeria|kingdom|states|west)\b/i.test(label)) return "Geography";
  return "Sector";
}

function clusterKey(kind: SharedCluster["kind"], label: string) {
  return `${kind}:${normalizeToken(label)}`;
}
