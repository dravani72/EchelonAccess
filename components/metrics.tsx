import type { AppData } from "@/lib/data";

export function Metrics({ data }: { data: AppData }) {
  const bridgeableContacts = data.people.filter((person) => person.relationshipStrength >= 3 && person.mandateMatches > 0).length;
  const activeMandates = data.mandates.filter((mandate) => mandate.status === "active").length;
  const awaitingOutreach = data.outreachQueue.filter(
    (item) => item.status === "draft_ready" || item.status === "awaiting_approval"
  ).length;
  const overlapSignals = data.people.filter(
    (person) =>
      person.sectorTags.length > 1 ||
      Boolean(person.relevantMandates?.length) ||
      Boolean(person.relevantInstitutions?.length) ||
      Boolean(person.keyRelationships)
  ).length;

  const metrics = [
    {
      label: "Overlap signals",
      value: overlapSignals,
      context: "interests, institutions, and mandate links"
    },
    {
      label: "Active mandates",
      value: activeMandates,
      context: "live reasons to bring people together"
    },
    {
      label: "Bridgeable contacts",
      value: bridgeableContacts,
      context: "warm enough and tied to an ask"
    },
    {
      label: "Introductions queued",
      value: awaitingOutreach,
      context: "drafts or approvals ready for action"
    }
  ];

  return (
    <section className="metrics" aria-label="Command metrics">
      {metrics.map((metric) => (
        <article className="metric" key={metric.label}>
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">{metric.value}</div>
          <div className="metric-context">{metric.context}</div>
        </article>
      ))}
    </section>
  );
}
