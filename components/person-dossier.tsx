"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Badge } from "@/components/badge";
import { confidenceLabel, formatStatus } from "@/lib/format";
import type { BusinessCard, Interaction, Person, Role } from "@/types/domain";

const tabs = ["Overview", "Timeline", "Roles", "Relationships", "Cards", "Sources"] as const;
type DossierTab = (typeof tabs)[number];

const DOSSIER_PERSON_LIMIT = 250;
const RELATED_LIMIT = 6;
const ROLE_RENDER_LIMIT = 24;
const INTERACTION_RENDER_LIMIT = 30;
const CARD_RENDER_LIMIT = 8;
const SOURCE_RENDER_LIMIT = 60;
const containedStyle = { contain: "content" } satisfies CSSProperties;
const identityCardStyle = {
  alignSelf: "start",
  maxHeight: "calc(100vh - 160px)",
  overflow: "auto",
  overscrollBehavior: "contain"
} satisfies CSSProperties;
const boundedTextStyle = { maxWidth: "100%", overflowWrap: "anywhere" } satisfies CSSProperties;
const boundedIdentityValueStyle = {
  ...boundedTextStyle,
  maxHeight: 118,
  overflow: "auto"
} satisfies CSSProperties;
const tableFrameStyle = { contain: "content", overflowX: "auto" } satisfies CSSProperties;
const tableStyle = { tableLayout: "fixed" } satisfies CSSProperties;
const tableCellStyle = { overflowWrap: "anywhere", verticalAlign: "top" } satisfies CSSProperties;

export function PersonDossier({
  people,
  roles,
  interactions,
  businessCards
}: {
  people: Person[];
  roles: Role[];
  interactions: Interaction[];
  businessCards: BusinessCard[];
}) {
  const [activeTab, setActiveTab] = useState<DossierTab>("Overview");
  const [selectedPersonId, setSelectedPersonId] = useState(people[0]?.id ?? "");
  const visiblePeople = useMemo(() => people.slice(0, DOSSIER_PERSON_LIMIT), [people]);
  const peopleById = useMemo(() => new Map(visiblePeople.map((item) => [item.id, item])), [visiblePeople]);
  const rolesByPersonId = useMemo(() => groupByPersonId(roles), [roles]);
  const interactionsByPersonId = useMemo(() => groupByPersonId(interactions), [interactions]);
  const cardsByPersonId = useMemo(() => groupByPersonId(businessCards), [businessCards]);
  const person = peopleById.get(selectedPersonId) ?? visiblePeople[0];
  const personRoles = useMemo(
    () => (person ? (rolesByPersonId.get(person.id) ?? []).slice(0, ROLE_RENDER_LIMIT) : []),
    [person, rolesByPersonId]
  );
  const personInteractions = useMemo(
    () => (person ? (interactionsByPersonId.get(person.id) ?? []).slice(0, INTERACTION_RENDER_LIMIT) : []),
    [interactionsByPersonId, person]
  );
  const personCards = useMemo(
    () => (person ? (cardsByPersonId.get(person.id) ?? []).slice(0, CARD_RENDER_LIMIT) : []),
    [cardsByPersonId, person]
  );

  const related = useMemo(() => {
    if (!person) return [];
    const matches: { person: Person; reasons: string[] }[] = [];
    const personSectors = new Set(person.sectorTags);

    for (const candidate of visiblePeople) {
      if (candidate.id === person.id) continue;
      const reasons = [
        candidate.currentOrganization === person.currentOrganization ? "same organization" : "",
        candidate.sectorTags.some((tag) => personSectors.has(tag)) ? "shared sector" : "",
        candidate.geography === person.geography ? "same geography" : ""
      ].filter(Boolean);

      if (reasons.length) {
        matches.push({ person: candidate, reasons });
        if (matches.length >= RELATED_LIMIT) break;
      }
    }

    return matches;
  }, [person, visiblePeople]);
  const sourceRows = useMemo(
    () =>
      [
        ...personRoles.map((role) => ({
          id: `role-${role.id}`,
          type: "Role",
          label: role.sourceLabel,
          detail: `${role.title} at ${role.organizationName}`,
          confidence: role.confidence,
          isMockData: role.isMockData
        })),
        ...personInteractions.map((interaction) => ({
          id: `interaction-${interaction.id}`,
          type: "Interaction",
          label: interaction.sourceLabel,
          detail: interaction.summary,
          confidence: interaction.confidence,
          isMockData: interaction.isMockData
        })),
        ...personCards.map((card) => ({
          id: `card-${card.id}`,
          type: "Business card",
          label: card.sourceEvent ?? "Uploaded artifact",
          detail: card.imagePath ?? card.rawOcrText ?? "Stored card evidence",
          confidence: card.confidence,
          isMockData: card.isMockData
        }))
      ].slice(0, SOURCE_RENDER_LIMIT),
    [personCards, personInteractions, personRoles]
  );

  useEffect(() => {
    if (!selectedPersonId && visiblePeople[0]) {
      setSelectedPersonId(visiblePeople[0].id);
      return;
    }

    if (selectedPersonId && !peopleById.has(selectedPersonId) && visiblePeople[0]) {
      setSelectedPersonId(visiblePeople[0].id);
    }
  }, [peopleById, selectedPersonId, visiblePeople]);

  if (!person) {
    return null;
  }

  return (
    <section className="panel" id="People">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Person Dossier</h2>
          <div className="section-kicker">Current status layered over preserved relationship history.</div>
        </div>
        <select className="text-input dossier-select" onChange={(event) => setSelectedPersonId(event.target.value)} value={person.id}>
          {visiblePeople.map((item) => (
            <option key={item.id} value={item.id}>
              {item.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="tabs" aria-label="Dossier tabs">
        {tabs.map((tab) => (
          <button className={`tab ${activeTab === tab ? "active" : ""}`} key={tab} onClick={() => setActiveTab(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>

      <div className="panel-body">
        <div className="dossier" style={containedStyle}>
          <IdentityCard person={person} />
          <div className="stack">
            {activeTab === "Overview" ? <OverviewTab person={person} roles={personRoles} interactions={personInteractions} /> : null}
            {activeTab === "Timeline" ? <TimelineTab interactions={personInteractions} /> : null}
            {activeTab === "Roles" ? <RolesTab roles={personRoles} /> : null}
            {activeTab === "Relationships" ? <RelationshipsTab related={related} /> : null}
            {activeTab === "Cards" ? <CardsTab cards={personCards} /> : null}
            {activeTab === "Sources" ? <SourcesTab rows={sourceRows} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function IdentityCard({ person }: { person: Person }) {
  const initials = person.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className={`identity-card ${person.isMockData ? "mock-record" : ""}`} style={identityCardStyle}>
      <div className="avatar">{initials}</div>
      <div className="identity-name">{person.displayName}</div>
      <div className="muted">{person.currentTitle}</div>
      <div className="muted">{person.currentOrganization}</div>

      <div className="field-list">
        <div>
          <div className="field-label">Primary Geography</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.geography}
          </div>
        </div>
        <div>
          <div className="field-label">Sectors</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.sectorTags.join(", ") || "None tagged"}
          </div>
        </div>
        <div>
          <div className="field-label">Source Count</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.sourceCount} sources
          </div>
        </div>
        <div>
          <div className="field-label">Influence Type</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.influenceType ?? "Not classified"}
          </div>
        </div>
        <div>
          <div className="field-label">Access Path</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.accessPath ?? "No access path recorded."}
          </div>
        </div>
        <div>
          <div className="field-label">Relationship Owner</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.relationshipOwner ?? "Unassigned"}
          </div>
        </div>
        <div>
          <div className="field-label">Opposition / Blockers</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.opposition ?? "No opposition recorded."}
          </div>
        </div>
        <div>
          <div className="field-label">Private Note</div>
          <div className="field-value" style={boundedIdentityValueStyle}>
            {person.notes ?? "No note recorded."}
          </div>
        </div>
      </div>
    </aside>
  );
}

function OverviewTab({ person, roles, interactions }: { person: Person; roles: Role[]; interactions: Interaction[] }) {
  return (
    <>
      <div>
        <h3 className="panel-title">Operator Summary</h3>
        <p className="section-kicker">
          {person.displayName} is a {formatStatus(person.warmthStatus)} relationship with {person.relationshipStrength}/5 strength,
          {person.mandateMatches} mandate matches, and {interactions.length} recorded interaction{interactions.length === 1 ? "" : "s"}.
        </p>
      </div>
      <div className="badge-row">
        <Badge tone="green">{formatStatus(person.warmthStatus)}</Badge>
        <Badge tone="blue">{person.relationshipStrength}/5 strength</Badge>
        <Badge tone="purple">{person.mandateMatches} mandate matches</Badge>
        <Badge tone={person.reviewStatus === "verified" ? "green" : "amber"}>{formatStatus(person.reviewStatus)}</Badge>
        {person.sensitivityLevel ? <Badge tone={person.sensitivityLevel === "sensitive" ? "red" : "amber"}>{formatStatus(person.sensitivityLevel)}</Badge> : null}
      </div>
      <IntelligenceGrid person={person} />
      <RolesTab roles={roles.slice(0, 3)} compact />
      <TimelineTab interactions={interactions.slice(0, 3)} compact />
    </>
  );
}

function IntelligenceGrid({ person }: { person: Person }) {
  const rows = [
    ["Best Approach", person.bestApproach],
    ["Current Authority", person.currentAuthority],
    ["Historical Authority", person.historicalAuthority],
    ["Motivations", person.motivations],
    ["Constraints", person.constraints],
    ["Opposition", person.opposition],
    ["Key Relationships", person.keyRelationships],
    ["Do Not Discuss", person.doNotDiscuss],
    ["Best Next Move", person.bestNextMove],
    ["Nationality", person.nationality],
    ["Languages", person.languages?.join(", ")],
    ["Public/Private Status", person.publicPrivateStatus],
    ["Relevant Mandates", person.relevantMandates?.join(", ")],
    ["Relevant Geographies", person.relevantGeographies?.join(", ")],
    ["Relevant Sectors", person.relevantSectors?.join(", ")],
    ["Relevant Institutions", person.relevantInstitutions?.join(", ")],
    ["Source Confidence", person.sourceConfidence === undefined ? undefined : confidenceLabel(person.sourceConfidence)],
    ["Last Verified", person.lastVerifiedDate]
  ].filter(([, value]) => value);

  if (!rows.length) {
    return <EmptyState text="No structured relationship intelligence recorded yet." />;
  }

  return (
    <div className="dossier-grid intelligence-display-grid">
      {rows.map(([label, value]) => (
        <div className="review-section" key={label}>
          <div className="field-label">{label}</div>
          <div className="field-value" style={boundedTextStyle}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({ interactions, compact = false }: { interactions: Interaction[]; compact?: boolean }) {
  return (
    <div>
      <h3 className="panel-title">{compact ? "Recent Timeline" : "Timeline"}</h3>
      {interactions.length ? (
        <div className="timeline" style={containedStyle}>
          {interactions.map((interaction) => (
            <div className={`timeline-item ${interaction.isMockData ? "mock-record" : ""}`} key={interaction.id}>
              <div className="timeline-date">{interaction.date}</div>
              <div>
                <div className="person-name" style={boundedTextStyle}>
                  {interaction.summary}
                </div>
                <div className="muted" style={boundedTextStyle}>
                  {interaction.outcome ?? interaction.nextStep ?? formatStatus(interaction.type)}
                </div>
                <div className="badge-row" style={{ marginTop: 8 }}>
                  <Badge tone="blue">{interaction.sourceLabel}</Badge>
                  <Badge tone="green">{confidenceLabel(interaction.confidence)}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No timeline events recorded yet." />
      )}
    </div>
  );
}

function RolesTab({ roles, compact = false }: { roles: Role[]; compact?: boolean }) {
  return (
    <div>
      <h3 className="panel-title">{compact ? "Role Snapshot" : "Role History"}</h3>
      {roles.length ? (
        <div style={tableFrameStyle}>
          <table className="table" style={tableStyle}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Organization</th>
              <th>Period</th>
              <th>Source</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr className={role.isMockData ? "mock-record" : undefined} key={role.id}>
                <td style={tableCellStyle}>
                  <span className="person-name" style={boundedTextStyle}>
                    {role.title}
                  </span>
                  <div className="muted">{role.isCurrent ? "Current layer" : "Historical evidence"}</div>
                </td>
                <td style={tableCellStyle}>{role.organizationName}</td>
                <td style={tableCellStyle}>
                  {role.startDate ?? "Unknown"}
                  {role.endDate ? `-${role.endDate}` : role.isCurrent ? "-present" : ""}
                </td>
                <td style={tableCellStyle}>{role.sourceLabel}</td>
                <td style={tableCellStyle}>
                  <Badge tone={role.confidence > 0.85 ? "green" : "amber"}>{confidenceLabel(role.confidence)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      ) : (
        <EmptyState text="No role history recorded yet." />
      )}
    </div>
  );
}

function RelationshipsTab({ related }: { related: { person: Person; reasons: string[] }[] }) {
  return (
    <div>
      <h3 className="panel-title">Relationship Paths</h3>
      {related.length ? (
        <div className="dossier-grid" style={containedStyle}>
          {related.map(({ person, reasons }) => (
            <div className={`review-section ${person.isMockData ? "mock-record" : ""}`} key={person.id}>
              <div className="person-name">{person.displayName}</div>
              <p className="section-kicker" style={boundedTextStyle}>
                {person.currentTitle}
              </p>
              <div className="badge-row">
                {reasons.map((reason) => (
                  <Badge key={reason} tone="purple">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No relationship paths detected from shared organization, sector, or geography yet." />
      )}
    </div>
  );
}

function CardsTab({ cards }: { cards: BusinessCard[] }) {
  return (
    <div>
      <h3 className="panel-title">Business Cards</h3>
      {cards.length ? (
        <div className="dossier-grid" style={containedStyle}>
          {cards.map((card) => (
            <div className={`review-section ${card.isMockData ? "mock-record" : ""}`} key={card.id}>
              <div className="card-preview">
                {card.imageUrl ? (
                  <img alt="Business card artifact" className="artifact-image" decoding="async" loading="lazy" src={card.imageUrl} />
                ) : (
                  "Stored artifact"
                )}
              </div>
              <div className="field-list">
                <div>
                  <div className="field-label">Scan Date</div>
                  <div className="field-value">{card.scanDate}</div>
                </div>
                <div>
                  <div className="field-label">Review</div>
                  <div className="field-value">{formatStatus(card.reviewStatus)}</div>
                </div>
                <div>
                  <div className="field-label">Source</div>
                  <div className="field-value" style={boundedTextStyle}>
                    {card.sourceEvent ?? "Uploaded artifact"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No business card artifacts linked to this person yet." />
      )}
    </div>
  );
}

function SourcesTab({
  rows
}: {
  rows: { id: string; type: string; label: string; detail: string; confidence: number; isMockData?: boolean }[];
}) {
  return (
    <div>
      <h3 className="panel-title">Sources</h3>
      {rows.length ? (
        <div style={tableFrameStyle}>
          <table className="table" style={tableStyle}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Source</th>
              <th>Detail</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={row.isMockData ? "mock-record" : undefined} key={row.id}>
                <td style={tableCellStyle}>{row.type}</td>
                <td style={tableCellStyle}>{row.label}</td>
                <td style={tableCellStyle}>{row.detail}</td>
                <td style={tableCellStyle}>
                  <Badge tone={row.confidence > 0.8 ? "green" : "amber"}>{confidenceLabel(row.confidence)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      ) : (
        <EmptyState text="No source records attached yet." />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function groupByPersonId<T extends { personId?: string }>(records: T[]) {
  const grouped = new Map<string, T[]>();

  records.forEach((record) => {
    if (!record.personId) return;
    const existing = grouped.get(record.personId);
    if (existing) {
      existing.push(record);
      return;
    }
    grouped.set(record.personId, [record]);
  });

  return grouped;
}
