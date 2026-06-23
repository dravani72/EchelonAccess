"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
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
const OutreachQueue = dynamic(() => import("@/components/outreach-queue").then((mod) => mod.OutreachQueue), {
  ssr: false,
  loading: () => <PanelLoading label="Loading outreach" />
});

type WorkspaceView = "network" | "opportunities" | "people" | "dossier" | "mandates" | "outreach";
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
type NetworkIntelligence = {
  clusters: SharedCluster[];
  introPaths: IntroPath[];
  mandateContexts: MandateContext[];
  organizationOverlaps: { label: string; people: Person[] }[];
};

const views: { id: WorkspaceView; label: string }[] = [
  { id: "network", label: "Network" },
  { id: "opportunities", label: "Intro Paths" },
  { id: "people", label: "People" },
  { id: "dossier", label: "Dossier" },
  { id: "mandates", label: "Mandates" },
  { id: "outreach", label: "Outreach" }
];

export function ResponsiveWorkspace({ data }: { data: AppData }) {
  const [activeView, setActiveView] = useState<WorkspaceView>("network");
  const [isPending, startTransition] = useTransition();
  const intelligence = useMemo(() => buildNetworkIntelligence(data), [data]);
  const counts = useMemo(
    () => ({
      people: data.people.length,
      mandates: data.mandates.length,
      introPaths: intelligence.introPaths.length,
      clusters: intelligence.clusters.length
    }),
    [data.mandates.length, data.people.length, intelligence.clusters.length, intelligence.introPaths.length]
  );

  function openView(view: WorkspaceView) {
    startTransition(() => setActiveView(view));
  }

  return (
    <section className="panel" aria-busy={isPending} id="graph" style={{ overflow: "visible" }}>
      <div className="panel-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 className="panel-title">Interrelationship Desk</h2>
          <div className="section-kicker">Mutual interests, mandate overlap, and introduction paths across the rolodex.</div>
        </div>
        <div className="badge-row">
          <Badge tone="blue">{counts.people} people</Badge>
          <Badge tone="purple">{counts.mandates} mandates</Badge>
          <Badge tone="green">{counts.introPaths} intro paths</Badge>
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
        {activeView === "network" ? <NetworkOverview data={data} intelligence={intelligence} /> : null}
        {activeView === "opportunities" ? <OpportunityBoard introPaths={intelligence.introPaths} /> : null}
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
        {activeView === "outreach" ? <OutreachQueue outreachQueue={data.outreachQueue} /> : null}
      </div>
    </section>
  );
}

function NetworkOverview({ data, intelligence }: { data: AppData; intelligence: NetworkIntelligence }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="review-section">
        <div className="field-label">Operating Model</div>
        <div className="field-value">
          The platform now centers on who can be productively brought together: shared mandates, overlapping interests, common
          institutions, and credible access paths.
        </div>
      </div>

      <div className="grid-two">
        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Mandate Intersection Map</div>
              <div className="field-value">Active asks with the strongest relationship surface area.</div>
            </div>
            <Badge tone="purple">{intelligence.mandateContexts.length}</Badge>
          </div>
          <div className="parsed-fields">
            {intelligence.mandateContexts.slice(0, 5).map((context) => (
              <div key={context.mandate.id}>
                <dt>{context.mandate.title}</dt>
                <dd>
                  {context.people.slice(0, 4).map((person) => person.displayName).join(", ") || "No matched contacts yet"}
                  {context.people.length > 4 ? ` +${context.people.length - 4}` : ""}
                </dd>
              </div>
            ))}
            {!intelligence.mandateContexts.length ? <EmptyLine label="No mandate intersections yet." /> : null}
          </div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Interest Parities</div>
              <div className="field-value">Clusters where multiple contacts share usable context.</div>
            </div>
            <Badge tone="green">{intelligence.clusters.length}</Badge>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {intelligence.clusters.slice(0, 6).map((cluster) => (
              <ClusterRow cluster={cluster} key={`${cluster.kind}-${cluster.label}`} />
            ))}
            {!intelligence.clusters.length ? <div className="empty-state">No shared-interest clusters yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="grid-two">
        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Near-Term Introduction Paths</div>
              <div className="field-value">Pairs with enough overlap to justify middleman action.</div>
            </div>
            <Badge tone="blue">{intelligence.introPaths.length}</Badge>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {intelligence.introPaths.slice(0, 4).map((path) => (
              <IntroPathRow key={`${path.left.id}-${path.right.id}`} path={path} />
            ))}
            {!intelligence.introPaths.length ? <div className="empty-state">No introduction paths detected yet.</div> : null}
          </div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div>
              <div className="field-label">Data Overlaps</div>
              <div className="field-value">Organizations and prior roles that may reveal bridge paths.</div>
            </div>
            <Badge tone="amber">{intelligence.organizationOverlaps.length}</Badge>
          </div>
          <div className="parsed-fields">
            {intelligence.organizationOverlaps.slice(0, 6).map((overlap) => (
              <div key={overlap.label}>
                <dt>{overlap.label}</dt>
                <dd>{overlap.people.map((person) => person.displayName).join(", ")}</dd>
              </div>
            ))}
            {!intelligence.organizationOverlaps.length ? <EmptyLine label="No organization overlaps yet." /> : null}
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

function OpportunityBoard({ introPaths }: { introPaths: IntroPath[] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {introPaths.map((path) => (
        <article className="review-section" key={`${path.left.id}-${path.right.id}`}>
          <div className="review-section-header">
            <div>
              <div className="field-label">Potential Introduction</div>
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
      {!introPaths.length ? <div className="empty-state">Add relationship context, mandates, sectors, or institutions to surface intro paths.</div> : null}
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

function buildNetworkIntelligence(data: AppData): NetworkIntelligence {
  const people = data.people.slice(0, 400);
  const mandates = data.mandates.slice(0, 40);
  const clusters = buildClusters(people, mandates);
  const mandateContexts = mandates
    .map((mandate) => ({
      mandate,
      people: people
        .map((person) => ({ person, score: scorePersonForMandate(person, mandate) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((match) => match.person)
    }))
    .filter((context) => context.people.length)
    .sort((a, b) => b.people.length - a.people.length);

  return {
    clusters,
    introPaths: buildIntroPaths(people, mandates),
    mandateContexts,
    organizationOverlaps: buildOrganizationOverlaps(people, data.roles)
  };
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

function buildIntroPaths(people: Person[], mandates: Mandate[]) {
  const paths: IntroPath[] = [];

  for (let leftIndex = 0; leftIndex < people.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < people.length; rightIndex += 1) {
      const left = people[leftIndex];
      const right = people[rightIndex];
      const sharedSectors = intersect(normalizeList(left.sectorTags), normalizeList(right.sectorTags));
      const sharedGeographies = intersect(
        normalizeList([left.geography, ...(left.relevantGeographies ?? [])]),
        normalizeList([right.geography, ...(right.relevantGeographies ?? [])])
      );
      const sharedMandates = mandates.filter((mandate) => scorePersonForMandate(left, mandate) > 0 && scorePersonForMandate(right, mandate) > 0);
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

function scorePersonForMandate(person: Person, mandate: Mandate) {
  const personTokens = normalizeList([
    ...person.sectorTags,
    person.geography,
    ...(person.relevantMandates ?? []),
    ...(person.relevantGeographies ?? []),
    ...(person.relevantSectors ?? []),
    ...(person.relevantInstitutions ?? [])
  ]);
  const mandateTokens = normalizeList([
    mandate.title,
    mandate.sector,
    ...(mandate.geography ?? []),
    ...(mandate.tags ?? []),
    ...(mandate.desiredCounterparties ?? []),
    ...(mandate.strategicPartners ?? []),
    ...(mandate.decisionMakers ?? []),
    ...(mandate.gatekeepers ?? []),
    ...(mandate.influencers ?? [])
  ]);

  return intersect(personTokens, mandateTokens).length;
}

function intersect(left: ReturnType<typeof normalizeList>, right: ReturnType<typeof normalizeList>) {
  const rightTokens = new Set(right.map((item) => item.token));
  return left.filter((item) => rightTokens.has(item.token)).map((item) => item.label);
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
