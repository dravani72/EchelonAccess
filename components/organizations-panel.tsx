import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import type { Mandate, Person, Role } from "@/types/domain";

type OrganizationProfile = {
  name: string;
  type: string;
  sectors: string[];
  geographies: string[];
  people: Person[];
  roles: Role[];
  mandates: Mandate[];
  currentAuthority: string[];
  historicalAuthority: string[];
  relationshipOwners: string[];
  accessPaths: string[];
  sensitivities: string[];
  tags: string[];
};

export function OrganizationsPanel({ mandates, people, roles }: { mandates: Mandate[]; people: Person[]; roles: Role[] }) {
  const organizations = buildOrganizationProfiles(people, roles, mandates);

  return (
    <section className="panel" id="organizations">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Organization Definition</h2>
          <div className="section-kicker">Institutional scope, coverage, access posture, mandate relevance, and known constraints.</div>
        </div>
        <Badge tone="blue">{organizations.length} organizations</Badge>
      </div>
      <div className="panel-body" style={{ display: "grid", gap: 14 }}>
        {organizations.map((organization) => (
          <article className="review-section" key={organization.name}>
            <div className="review-section-header">
              <div>
                <div className="field-label">{organization.type}</div>
                <div className="review-match-name">{organization.name}</div>
                <p className="review-note">
                  {organization.people.length} linked contacts, {organization.roles.length} role records, {organization.mandates.length} relevant mandates.
                </p>
              </div>
              <div className="badge-row">
                {organization.sectors.slice(0, 3).map((sector) => (
                  <Badge tone="blue" key={sector}>
                    {sector}
                  </Badge>
                ))}
                {organization.geographies.slice(0, 2).map((geography) => (
                  <Badge tone="amber" key={geography}>
                    {geography}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="parsed-fields" style={{ marginTop: 12 }}>
              <DefinitionLine label="Relationship owners" value={organization.relationshipOwners.join(", ")} />
              <DefinitionLine label="Access paths" value={organization.accessPaths.map(formatStatus).join(", ")} />
              <DefinitionLine label="Sensitivity" value={organization.sensitivities.map(formatStatus).join(", ")} />
            </div>

            <DefinitionSection
              rows={[
                ["Type", organization.type],
                ["Sectors", organization.sectors.join(", ")],
                ["Geographies", organization.geographies.join(", ")],
                ["Tags", organization.tags.join(", ")]
              ]}
              title="Institutional Scope"
            />
            <DefinitionSection
              rows={[
                ["Current contacts", organization.people.map((person) => `${person.displayName} (${person.currentTitle})`).join(", ")],
                ["Current authority", organization.currentAuthority.join(" | ")],
                ["Historical authority", organization.historicalAuthority.join(" | ")],
                ["Role history", organization.roles.map((role) => `${role.title}${role.isCurrent ? "" : " (historical)"}`).join(", ")]
              ]}
              title="Coverage And Authority"
            />
            <DefinitionSection
              rows={[
                ["Relevant mandates", organization.mandates.map((mandate) => mandate.title).join(", ")],
                ["Desired counterparties", unique(organization.mandates.flatMap((mandate) => mandate.desiredCounterparties ?? [])).join(", ")],
                ["Target counterparty types", unique(organization.mandates.flatMap((mandate) => mandate.targetCounterpartyTypes ?? [])).join(", ")],
                ["Strategic partners", unique(organization.mandates.flatMap((mandate) => mandate.strategicPartners ?? [])).join(", ")],
                ["Forbidden contacts", unique(organization.mandates.flatMap((mandate) => mandate.forbiddenContacts ?? [])).join(", ")]
              ]}
              title="Mandate Relevance"
            />
            <DefinitionSection
              rows={[
                ["Compliance", unique(organization.mandates.map((mandate) => mandate.complianceRequirements)).join(" | ")],
                ["Regulatory", unique(organization.mandates.map((mandate) => mandate.regulatoryRegime)).join(" | ")],
                ["Political exposure", unique(organization.mandates.map((mandate) => mandate.politicalExposure)).join(" | ")],
                ["Conflict constraints", unique(organization.mandates.map((mandate) => mandate.conflictConstraints)).join(" | ")],
                ["Blockers", unique(organization.mandates.map((mandate) => mandate.blockers)).join(" | ")]
              ]}
              title="Constraints And Risk"
            />
          </article>
        ))}
        {!organizations.length ? <div className="empty-state">No organizations can be derived from the current relationship data yet.</div> : null}
      </div>
    </section>
  );
}

function buildOrganizationProfiles(people: Person[], roles: Role[], mandates: Mandate[]) {
  const buckets = new Map<string, OrganizationProfile>();

  for (const person of people) {
    const organization = person.currentOrganization || "Unknown organization";
    const profile = getOrganizationProfile(buckets, organization);
    profile.people.push(person);
    profile.sectors.push(...person.sectorTags, ...(person.relevantSectors ?? []));
    profile.geographies.push(person.geography, ...(person.relevantGeographies ?? []));
    profile.currentAuthority.push(person.currentAuthority ?? "");
    profile.historicalAuthority.push(person.historicalAuthority ?? "");
    profile.relationshipOwners.push(person.relationshipOwner ?? "");
    profile.accessPaths.push(person.accessPath ?? "");
    profile.sensitivities.push(person.sensitivityLevel ?? "");
    profile.tags.push(...(person.relevantInstitutions ?? []), ...(person.relevantMandates ?? []));
  }

  for (const role of roles) {
    const profile = getOrganizationProfile(buckets, role.organizationName);
    profile.roles.push(role);
  }

  for (const mandate of mandates) {
    const candidates = [
      mandate.clientName,
      ...(mandate.desiredCounterparties ?? []),
      ...(mandate.strategicPartners ?? []),
      ...(mandate.buyerUniverse ?? []),
      ...(mandate.investorUniverse ?? []),
      ...(mandate.governmentTouchpoints ?? [])
    ];

    for (const name of candidates) {
      const profile = findLikelyProfile(buckets, name);
      if (profile && !profile.mandates.some((existing) => existing.id === mandate.id)) {
        profile.mandates.push(mandate);
        if (mandate.sector) profile.sectors.push(mandate.sector);
        profile.geographies.push(...(mandate.geography ?? []));
        profile.tags.push(...(mandate.tags ?? []));
      }
    }
  }

  return [...buckets.values()]
    .map((profile) => ({
      ...profile,
      type: inferOrganizationType(profile.name, profile.tags),
      sectors: unique(profile.sectors),
      geographies: unique(profile.geographies),
      currentAuthority: unique(profile.currentAuthority),
      historicalAuthority: unique(profile.historicalAuthority),
      relationshipOwners: unique(profile.relationshipOwners),
      accessPaths: unique(profile.accessPaths),
      sensitivities: unique(profile.sensitivities),
      tags: unique(profile.tags)
    }))
    .sort((a, b) => b.people.length + b.roles.length + b.mandates.length - (a.people.length + a.roles.length + a.mandates.length));
}

function getOrganizationProfile(buckets: Map<string, OrganizationProfile>, name: string) {
  const key = normalizeKey(name);
  const existing = buckets.get(key);
  if (existing) return existing;

  const profile: OrganizationProfile = {
    name,
    type: "Other",
    sectors: [],
    geographies: [],
    people: [],
    roles: [],
    mandates: [],
    currentAuthority: [],
    historicalAuthority: [],
    relationshipOwners: [],
    accessPaths: [],
    sensitivities: [],
    tags: []
  };
  buckets.set(key, profile);
  return profile;
}

function findLikelyProfile(buckets: Map<string, OrganizationProfile>, candidate: string) {
  const key = normalizeKey(candidate);
  const exact = buckets.get(key);
  if (exact) return exact;

  return [...buckets.values()].find((profile) => {
    const profileKey = normalizeKey(profile.name);
    return key.includes(profileKey) || profileKey.includes(key);
  });
}

function DefinitionSection({ rows, title }: { rows: Array<[string, string | undefined]>; title: string }) {
  const visibleRows = rows.filter(([, value]) => value);

  if (!visibleRows.length) {
    return null;
  }

  return (
    <details className="mandate-morphology">
      <summary>{title}</summary>
      <div className="mandate-detail-grid">
        {visibleRows.map(([label, value]) => (
          <div className="mandate-detail" key={label}>
            <div className="field-label">{label}</div>
            <div className="field-value">{value}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function DefinitionLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function inferOrganizationType(name: string, tags: string[]) {
  const value = `${name} ${tags.join(" ")}`.toLowerCase();
  if (/\b(ministry|department|authority|regulator|government)\b/.test(value)) return "Government";
  if (/\b(bank|development finance|development-bank)\b/.test(value)) return "Development finance";
  if (/\b(capital|fund|growth|investor|family office)\b/.test(value)) return "Capital provider";
  if (/\b(port|logistics|operator|platform|group)\b/.test(value)) return "Operator";
  if (/\b(embassy|trade)\b/.test(value)) return "Diplomatic / trade";
  return "Other";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const key = normalizeKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
