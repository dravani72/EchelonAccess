import type { AppData } from "@/lib/data";

export function Metrics({ data }: { data: AppData }) {
  const staleHighValue = data.people.filter((person) => person.relationshipStrength >= 3 && person.warmthStatus !== "direct").length;
  const activeMandates = data.mandates.filter((mandate) => mandate.status === "active").length;
  const awaitingOutreach = data.outreachQueue.filter(
    (item) => item.status === "draft_ready" || item.status === "awaiting_approval"
  ).length;

  const metrics = [
    {
      label: "Unreviewed intelligence",
      value: data.reviewTasks.length,
      context: "cards, duplicates, and role changes"
    },
    {
      label: "Active mandates",
      value: activeMandates,
      context: "deal objectives with current paths"
    },
    {
      label: "Warm stale contacts",
      value: staleHighValue,
      context: "relationship value waiting on pretext"
    },
    {
      label: "Outreach awaiting action",
      value: awaitingOutreach,
      context: "drafts or approvals due this week"
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
